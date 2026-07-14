import type { ShaderUniforms } from './protocol';
import {
  getShaderColorFromString,
  ShaderFitOptions,
  waterFragmentShader,
} from '@paper-design/shaders';
import { Water } from '@paper-design/shaders-react';
import { memo, useEffect, useState } from 'react';
import { canRenderOffscreen, OffscreenShader } from './OffscreenShader';

const MOBILE_QUERY = '(max-width: 768px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const COLOR_BACK = '#2200ff';
const COLOR_HIGHLIGHT = '#001428';

const SPEED = 0.6;
const SPEED_REDUCED = 0.4;
const SPEED_INITIAL = 0.2;

const ACTIVATION_EVENTS = [
  'pointermove',
  'pointerdown',
  'wheel',
  'touchstart',
  'keydown',
] as const;

const IDLE_MOUNT_MS = 10;

const EDGE_FADE = '#0051ff 50%, #08103a 75%, transparent';
const FIELD_MASK = `linear-gradient(to bottom, transparent, ${EDGE_FADE})`;

const IMAGE = '/img/bg-0.webp';
const OPACITY = 0.5;
const MIN_PIXEL_RATIO = 1;

const WATER = {
  highlights: 0.25,
  layering: 0,
  edges: 0.25,
  waves: 0.25,
  caustic: 0.25,
  size: 0.25,
  scale: 1.2,
} as const;

const WATER_UNIFORMS: ShaderUniforms = {
  u_colorBack: getShaderColorFromString(COLOR_BACK),
  u_colorHighlight: getShaderColorFromString(COLOR_HIGHLIGHT),
  u_highlights: WATER.highlights,
  u_layering: WATER.layering,
  u_edges: WATER.edges,
  u_waves: WATER.waves,
  u_caustic: WATER.caustic,
  u_size: WATER.size,
  u_scale: WATER.scale,
  u_fit: ShaderFitOptions.cover,
  u_rotation: 0,
  u_originX: 0.5,
  u_originY: 0.5,
  u_offsetX: 0,
  u_offsetY: 0,
  u_worldWidth: 0,
  u_worldHeight: 0,
};

const readQuery = (query: string) =>
  typeof window === 'undefined' ? false : window.matchMedia(query).matches;

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => readQuery(query));

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);

    sync();
    media.addEventListener('change', sync);

    return () => media.removeEventListener('change', sync);
  }, [query]);

  return matches;
};

const WaterFieldComponent = ({ className }: { className?: string }) => {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [workerFailed, setWorkerFailed] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setRevealed(true))
    );

    return () => cancelAnimationFrame(frame);
  }, [mounted]);

  useEffect(() => {
    if (isMobile) return;

    const start = () => {
      setMounted(true);
      setActive(true);
    };
    const options = { once: true, passive: true } as const;
    let idle: number | null = null;

    if (canRenderOffscreen()) setMounted(true);
    else idle = window.setTimeout(() => setMounted(true), IDLE_MOUNT_MS);

    for (const event of ACTIVATION_EVENTS)
      window.addEventListener(event, start, options);

    return () => {
      if (idle !== null) window.clearTimeout(idle);

      for (const event of ACTIVATION_EVENTS)
        window.removeEventListener(event, start);
    };
  }, [isMobile]);

  const animatedSpeed = prefersReducedMotion ? SPEED_REDUCED : SPEED;
  const speed = active ? animatedSpeed : SPEED_INITIAL;
  const offscreen = !workerFailed && canRenderOffscreen();

  if (isMobile) return null;

  return (
    <div
      className={`pointer-events-none ${className ?? 'fixed inset-0 z-0'}`}
      style={{
        backgroundColor: COLOR_BACK,
        maskImage: FIELD_MASK,
        WebkitMaskImage: FIELD_MASK,
      }}
      aria-hidden
    >
      {mounted &&
        (offscreen ? (
          <OffscreenShader
            fragmentShader={waterFragmentShader}
            uniforms={WATER_UNIFORMS}
            images={{ u_image: IMAGE }}
            speed={speed}
            opacity={OPACITY}
            minPixelRatio={MIN_PIXEL_RATIO}
            onFailure={() => setWorkerFailed(true)}
          />
        ) : (
          <Water
            image={IMAGE}
            width='100%'
            height='100%'
            colorBack={COLOR_BACK}
            colorHighlight={COLOR_HIGHLIGHT}
            highlights={WATER.highlights}
            layering={WATER.layering}
            edges={WATER.edges}
            waves={WATER.waves}
            caustic={WATER.caustic}
            size={WATER.size}
            scale={WATER.scale}
            speed={speed}
            fit='cover'
            minPixelRatio={MIN_PIXEL_RATIO}
            style={{
              opacity: revealed ? OPACITY : 0,
              backgroundColor: COLOR_BACK,
              willChange: 'opacity',
              transition: 'opacity 400ms ease',
            }}
          />
        ))}
    </div>
  );
};

export const WaterField = memo(WaterFieldComponent);
