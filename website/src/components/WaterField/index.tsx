import { Water } from '@paper-design/shaders-react';
import { memo, useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const COLOR_BACK = '#2200ff';
const COLOR_HIGHLIGHT = '#001428';

const SPEED = 0.6;
const SPEED_REDUCED = 0.5;
const SPEED_MOBILE = 0.2;

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

  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setRevealed(true))
    );

    return () => cancelAnimationFrame(frame);
  }, []);

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
      <Water
        image='/img/bg-0.png'
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
        speed={
          isMobile ? SPEED_MOBILE : prefersReducedMotion ? SPEED_REDUCED : SPEED
        }
        fit='cover'
        style={{
          opacity: revealed ? 0.5 : 0,
          backgroundColor: COLOR_BACK,
          willChange: 'opacity',
          transition: 'opacity 400ms ease',
        }}
      />
    </div>
  );
};

export const WaterField = memo(WaterFieldComponent);
