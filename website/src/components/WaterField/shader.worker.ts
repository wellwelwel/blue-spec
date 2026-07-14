import type {
  ShaderUniforms,
  ShaderWorkerEvent,
  ShaderWorkerInit,
  ShaderWorkerMessage,
} from './protocol';
import { vertexShaderSource } from './vertex-shader';

const emit = (event: ShaderWorkerEvent) => postMessage(event);

const compileShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};

const createProgram = (
  gl: WebGL2RenderingContext,
  fragmentShaderSource: string
): WebGLProgram | null => {
  let vertexSource = vertexShaderSource;
  let fragmentSource = fragmentShaderSource;
  const format = gl.getShaderPrecisionFormat(
    gl.FRAGMENT_SHADER,
    gl.MEDIUM_FLOAT
  );

  if (format && format.precision < 23) {
    vertexSource = vertexSource.replace(
      /precision\s+(lowp|mediump)\s+float;/g,
      'precision highp float;'
    );
    fragmentSource = fragmentSource
      .replace(/precision\s+(lowp|mediump)\s+float/g, 'precision highp float')
      .replace(
        /\b(uniform|varying|attribute)\s+(lowp|mediump)\s+(\w+)/g,
        '$1 highp $3'
      );
  }

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
};

class OffscreenShaderMount {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly locations = new Map<string, WebGLUniformLocation | null>();
  private currentFrame = 0;
  private lastRenderTime = 0;
  private speed: number;
  private currentSpeed = 0;
  private hidden = false;
  private rafId: number | null = null;
  private pixelRatio = 1;
  private resolutionChanged = true;

  constructor(init: ShaderWorkerInit) {
    const gl = init.canvas.getContext('webgl2');
    if (!gl) throw new Error('WebGL2 is not supported');

    const program = createProgram(gl, init.fragmentShader);
    if (!program) throw new Error('Shader program failed to build');

    this.gl = gl;
    this.program = program;
    this.speed = init.speed;

    gl.useProgram(program);
    this.setupPositionAttribute();
    this.setUniforms(init.uniforms);
  }

  private setupPositionAttribute() {
    const gl = this.gl;
    const location = gl.getAttribLocation(this.program, 'a_position');
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  }

  private location(name: string) {
    if (!this.locations.has(name)) {
      this.locations.set(name, this.gl.getUniformLocation(this.program, name));
    }

    return this.locations.get(name) ?? null;
  }

  private setUniforms(uniforms: ShaderUniforms) {
    for (const [name, value] of Object.entries(uniforms)) {
      const location = this.location(name);
      if (!location) continue;

      if (typeof value === 'number') {
        this.gl.uniform1f(location, value);
        continue;
      }

      if (value.length === 2) this.gl.uniform2fv(location, value);
      else if (value.length === 3) this.gl.uniform3fv(location, value);
      else if (value.length === 4) this.gl.uniform4fv(location, value);
      else console.warn(`Unsupported uniform array length for ${name}`);
    }
  }

  async loadImages(images: Record<string, string>) {
    await Promise.all(
      Object.entries(images).map(([name, url], unit) =>
        this.loadImage(name, url, unit)
      )
    );
  }

  private async loadImage(name: string, url: string, unit: number) {
    const aspectRatioLocation = this.location(`${name}AspectRatio`);

    try {
      const response = await fetch(url);
      const bitmap = await createImageBitmap(await response.blob());
      const gl = this.gl;

      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        bitmap
      );
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR
      );

      const location = this.location(name);
      if (location) gl.uniform1i(location, unit);
      if (aspectRatioLocation)
        gl.uniform1f(aspectRatioLocation, bitmap.width / bitmap.height);

      bitmap.close();
    } catch {
      if (aspectRatioLocation) this.gl.uniform1f(aspectRatioLocation, 1);
    }
  }

  start() {
    this.currentSpeed = this.hidden ? 0 : this.speed;
    this.lastRenderTime = performance.now();
    this.render(this.lastRenderTime);
  }

  resize(width: number, height: number, pixelRatio: number) {
    const canvas = this.gl.canvas;
    if (
      canvas.width === width &&
      canvas.height === height &&
      this.pixelRatio === pixelRatio
    )
      return;

    canvas.width = width;
    canvas.height = height;
    this.pixelRatio = pixelRatio;
    this.resolutionChanged = true;
    this.gl.viewport(0, 0, width, height);

    if (this.rafId === null) this.render(performance.now());
  }

  setSpeed(speed: number) {
    this.speed = speed;
    this.syncSpeed();
  }

  setHidden(hidden: boolean) {
    this.hidden = hidden;
    this.syncSpeed();
  }

  private syncSpeed() {
    const next = this.hidden ? 0 : this.speed;
    this.currentSpeed = next;

    if (this.rafId === null && next !== 0) {
      this.lastRenderTime = performance.now();
      this.rafId = requestAnimationFrame(this.render);
    }

    if (this.rafId !== null && next === 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private requestRender() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(this.render);
  }

  private render = (time: number) => {
    const gl = this.gl;
    const delta = time - this.lastRenderTime;

    this.lastRenderTime = time;
    if (this.currentSpeed !== 0) this.currentFrame += delta * this.currentSpeed;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniform1f(this.location('u_time'), this.currentFrame * 1e-3);

    if (this.resolutionChanged) {
      gl.uniform2f(
        this.location('u_resolution'),
        gl.canvas.width,
        gl.canvas.height
      );
      gl.uniform1f(this.location('u_pixelRatio'), this.pixelRatio);
      this.resolutionChanged = false;
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (this.currentSpeed !== 0) this.requestRender();
    else this.rafId = null;
  };
}

let mount: OffscreenShaderMount | null = null;

addEventListener('message', (event: MessageEvent) => {
  const message: ShaderWorkerMessage = event.data;

  if (message.type === 'init') {
    try {
      mount = new OffscreenShaderMount(message);
    } catch {
      emit({ type: 'failure' });
      return;
    }

    void mount.loadImages(message.images).then(() => {
      mount?.start();
      emit({ type: 'ready' });
    });

    return;
  }

  if (!mount) return;

  if (message.type === 'resize')
    mount.resize(message.width, message.height, message.pixelRatio);
  else if (message.type === 'speed') mount.setSpeed(message.speed);
  else if (message.type === 'visibility') mount.setHidden(message.hidden);
});
