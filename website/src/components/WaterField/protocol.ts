export type ShaderUniformValue = number | number[];

export type ShaderUniforms = Record<string, ShaderUniformValue>;

export type ShaderWorkerInit = {
  type: 'init';
  canvas: OffscreenCanvas;
  fragmentShader: string;
  uniforms: ShaderUniforms;
  images: Record<string, string>;
  speed: number;
};

export type ShaderWorkerResize = {
  type: 'resize';
  width: number;
  height: number;
  pixelRatio: number;
};

export type ShaderWorkerSpeed = {
  type: 'speed';
  speed: number;
};

export type ShaderWorkerVisibility = {
  type: 'visibility';
  hidden: boolean;
};

export type ShaderWorkerMessage =
  | ShaderWorkerInit
  | ShaderWorkerResize
  | ShaderWorkerSpeed
  | ShaderWorkerVisibility;

export type ShaderWorkerEvent = { type: 'ready' } | { type: 'failure' };
