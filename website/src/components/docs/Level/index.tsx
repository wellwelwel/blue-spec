import type { ReactNode } from 'react';
import { GoDotFill } from 'react-icons/go';

const MAX = 5;

const toneFor = (level: number): string => {
  if (level <= 2) return 'var(--teal)';
  if (level === 3) return 'var(--amber)';
  return 'var(--red)';
};

export const Level = ({ value }: { value: number }): ReactNode => {
  const level = Math.min(MAX, Math.max(1, Math.round(value)));

  return (
    <span
      role='img'
      aria-label={`${level} out of ${MAX}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.125em',
        color: toneFor(level),
        verticalAlign: 'middle',
      }}
    >
      {Array.from({ length: MAX }, (_, index) => (
        <GoDotFill
          key={index}
          aria-hidden
          style={{ opacity: index < level ? 1 : 0.15 }}
        />
      ))}
    </span>
  );
};
