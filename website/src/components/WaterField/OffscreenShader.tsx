import type {
  ShaderUniforms,
  ShaderWorkerEvent,
  ShaderWorkerInit,
  ShaderWorkerMessage,
  ShaderWorkerResize,
  ShaderWorkerSpeed,
} from './protocol';
import { useEffect, useRef } from 'react';

const DEFAULT_MAX_PIXEL_COUNT = 1920 * 1080 * 4;

export const canRenderOffscreen = () =>
  typeof Worker === 'function' &&
  typeof HTMLCanvasElement !== 'undefined' &&
  'transferControlToOffscreen' in HTMLCanvasElement.prototype;

type HostMetrics = {
  cssWidth: number;
  cssHeight: number;
  devicePixelWidth: number | null;
  devicePixelHeight: number | null;
};

const resolveResize = (
  metrics: HostMetrics,
  minPixelRatio: number,
  maxPixelCount: number
): ShaderWorkerResize => {
  const pixelRatio = Math.max(1, window.devicePixelRatio);
  const pinchZoom = window.visualViewport?.scale ?? 1;
  let targetWidth: number;
  let targetHeight: number;

  if (metrics.devicePixelWidth !== null && metrics.devicePixelHeight !== null) {
    const scale = Math.max(1, minPixelRatio / pixelRatio) * pinchZoom;
    targetWidth = metrics.devicePixelWidth * scale;
    targetHeight = metrics.devicePixelHeight * scale;
  } else {
    const scale = Math.max(pixelRatio, minPixelRatio) * pinchZoom;
    targetWidth = Math.round(metrics.cssWidth) * scale;
    targetHeight = Math.round(metrics.cssHeight) * scale;
  }

  const headroom = Math.min(
    1,
    Math.sqrt(maxPixelCount) / Math.sqrt(targetWidth * targetHeight)
  );
  const width = Math.round(targetWidth * headroom);
  const height = Math.round(targetHeight * headroom);

  return {
    type: 'resize',
    width,
    height,
    pixelRatio: width / Math.max(1, Math.round(metrics.cssWidth)),
  };
};

type OffscreenShaderProps = {
  fragmentShader: string;
  uniforms: ShaderUniforms;
  images: Record<string, string>;
  speed: number;
  opacity: number;
  minPixelRatio?: number;
  maxPixelCount?: number;
  onFailure: () => void;
};

export const OffscreenShader = ({
  fragmentShader,
  uniforms,
  images,
  speed,
  opacity,
  minPixelRatio = 1,
  maxPixelCount = DEFAULT_MAX_PIXEL_COUNT,
  onFailure,
}: OffscreenShaderProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const speedRef = useRef(speed);
  const opacityRef = useRef(opacity);
  const onFailureRef = useRef(onFailure);

  speedRef.current = speed;
  opacityRef.current = opacity;
  onFailureRef.current = onFailure;

  useEffect(() => {
    const message: ShaderWorkerSpeed = { type: 'speed', speed };
    workerRef.current?.postMessage(message);
  }, [speed]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.opacity = '0';
    canvas.style.transitionProperty = 'opacity';
    canvas.style.transitionDuration = '400ms';
    canvas.style.transitionTimingFunction = 'ease';
    host.appendChild(canvas);

    const worker = new Worker(new URL('./shader.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const message: ShaderWorkerEvent = event.data;

      if (message.type === 'ready')
        canvas.style.opacity = String(opacityRef.current);
      else if (message.type === 'failure') onFailureRef.current();
    };

    const init: ShaderWorkerInit = {
      type: 'init',
      canvas: canvas.transferControlToOffscreen(),
      fragmentShader,
      uniforms,
      images,
      speed: speedRef.current,
    };
    worker.postMessage(init, [init.canvas]);

    const post = (message: ShaderWorkerMessage) => worker.postMessage(message);
    const metrics: HostMetrics = {
      cssWidth: 0,
      cssHeight: 0,
      devicePixelWidth: null,
      devicePixelHeight: null,
    };

    const observe = () => {
      const observer = new ResizeObserver(([entry]) => {
        if (!entry) return;

        const borderBox = entry.borderBoxSize[0];
        if (borderBox) {
          metrics.cssWidth = borderBox.inlineSize;
          metrics.cssHeight = borderBox.blockSize;
        }

        const devicePixelBox = entry.devicePixelContentBoxSize?.[0];
        if (devicePixelBox) {
          metrics.devicePixelWidth = devicePixelBox.inlineSize;
          metrics.devicePixelHeight = devicePixelBox.blockSize;
        }

        const resize = resolveResize(metrics, minPixelRatio, maxPixelCount);
        if (resize.width > 0 && resize.height > 0) post(resize);
      });

      observer.observe(host);

      return observer;
    };

    let observer = observe();

    const handleViewportChange = () => {
      observer.disconnect();
      observer = observe();
    };

    const handleVisibilityChange = () => {
      post({ type: 'visibility', hidden: document.hidden });
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener(
        'resize',
        handleViewportChange
      );
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      workerRef.current = null;
      worker.terminate();
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className='absolute inset-0' aria-hidden />;
};
