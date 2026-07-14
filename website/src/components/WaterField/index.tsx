import { Water } from '@paper-design/shaders-react';
import { memo, useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const COLOR_BACK = '#2200ff';
const COLOR_HIGHLIGHT = '#001428';

const SPEED = 0.6;
const SPEED_REDUCED = 0.4;
const SPEED_MOBILE = 0.2;

const ACTIVATION_EVENTS = [
  'pointermove',
  'pointerdown',
  'wheel',
  'touchstart',
  'keydown',
] as const;

const IDLE_MOUNT_MS = 25;

const EDGE_FADE = '#0051ff 50%, #08103a 75%, transparent';
const FIELD_MASK = `linear-gradient(to bottom, transparent, ${EDGE_FADE})`;

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

  useEffect(() => {
    if (!mounted) return;

    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setRevealed(true))
    );

    return () => cancelAnimationFrame(frame);
  }, [mounted]);

  useEffect(() => {
    const start = () => {
      setMounted(true);
      setActive(true);
    };
    const options = { once: true, passive: true } as const;
    const idle = window.setTimeout(() => setMounted(true), IDLE_MOUNT_MS);

    for (const event of ACTIVATION_EVENTS)
      window.addEventListener(event, start, options);

    return () => {
      window.clearTimeout(idle);

      for (const event of ACTIVATION_EVENTS)
        window.removeEventListener(event, start);
    };
  }, []);

  const animatedSpeed = isMobile
    ? SPEED_MOBILE
    : prefersReducedMotion
      ? SPEED_REDUCED
      : SPEED;
  const speed = active ? animatedSpeed : 0.1;

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
      {mounted && (
        <Water
          image='/img/bg-0.webp'
          width='100%'
          height='100%'
          colorBack={COLOR_BACK}
          colorHighlight={COLOR_HIGHLIGHT}
          highlights={0.25}
          layering={0}
          edges={0.25}
          waves={0.25}
          caustic={0.25}
          size={0.25}
          scale={1.2}
          speed={speed}
          fit='cover'
          style={{
            opacity: revealed ? (isMobile ? 1 : 0.5) : 0,
            backgroundColor: COLOR_BACK,
            willChange: 'opacity',
            transition: 'opacity 400ms ease',
          }}
        />
      )}
    </div>
  );
};

export const WaterField = memo(WaterFieldComponent);
