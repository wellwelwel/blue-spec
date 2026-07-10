import type { ReactNode } from 'react';
import { frameResizeObserver } from '@site/src/components/frameResizeObserver';
import { useCallback, useEffect, useRef, useState } from 'react';

export const ScrollFade = ({
  children,
  className = '',
  scrollClassName = '',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  scrollClassName?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children'>) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  const update = useCallback(() => {
    const node = scrollRef.current;

    if (!node) return;

    const { scrollTop, scrollHeight, clientHeight } = node;

    setAtTop(scrollTop <= 1);
    setAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
  }, []);

  useEffect(() => {
    const node = scrollRef.current;

    if (!node) return;

    update();

    const observer = frameResizeObserver(update);

    observer.observe(node);

    for (const child of Array.from(node.children)) observer.observe(child);

    return () => observer.disconnect();
  }, [update]);

  return (
    <div className={`relative min-h-0 ${className}`}>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-[72px] bg-gradient-to-b from-[#0a0f1f] via-[#0a0f1f]/80 to-transparent transition-opacity duration-200 ease-out ${
          atTop ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <div
        ref={scrollRef}
        onScroll={update}
        className={scrollClassName}
        {...rest}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[72px] bg-gradient-to-t from-[#0a0f1f] via-[#0a0f1f]/80 to-transparent transition-opacity duration-200 ease-out ${
          atBottom ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
};
