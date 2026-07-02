import type { ReactNode } from 'react';

export const IconSwap = ({
  on,
  active,
  inactive,
  className,
}: {
  on: boolean;
  active: ReactNode;
  inactive: ReactNode;
  className?: string;
}) => (
  <span
    className={`relative inline-grid place-items-center ${className ?? ''}`}
  >
    <span
      className={`col-start-1 row-start-1 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
        on
          ? 'scale-100 opacity-100 blur-0'
          : 'scale-[0.25] opacity-0 blur-[4px]'
      }`}
      aria-hidden
    >
      {active}
    </span>
    <span
      className={`col-start-1 row-start-1 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
        on
          ? 'scale-[0.25] opacity-0 blur-[4px]'
          : 'scale-100 opacity-100 blur-0'
      }`}
      aria-hidden
    >
      {inactive}
    </span>
  </span>
);
