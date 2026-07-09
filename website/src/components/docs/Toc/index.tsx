import type { ReactNode } from 'react';
import { useLocation } from '@docusaurus/router';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

export type DocTocItem = {
  value: string;
  id: string;
  level: number;
};

const TOP_OFFSET = 120;

export const DocsToc = ({ toc }: { toc: DocTocItem[] }): ReactNode => {
  const { pathname } = useLocation();
  const items = toc.filter((item) => item.level === 2 || item.level === 3);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (items.length === 0) return;

    const ids = items.map((item) => item.id);
    let frame = 0;

    const measure = () => {
      frame = 0;
      let current = '';
      for (const id of ids) {
        const heading = document.getElementById(id);
        if (!heading || heading.offsetParent === null) continue;
        if (current === '') current = id;
        if (heading.getBoundingClientRect().top <= TOP_OFFSET) current = id;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [pathname, items.map((item) => item.id).join()]);

  if (items.length === 0) return null;

  return (
    <nav
      className='lagune-docs-route-rise rounded-card bg-surface px-5 pt-5 pb-1.5 shadow-card'
      aria-label='Table of contents'
    >
      <span className='px-2.5 text-[0.7rem] font-bold uppercase tracking-[0.09em] text-faint'>
        On this page
      </span>
      <ul className='mt-2 flex list-none flex-col gap-0.5 p-0'>
        {items.map((item) => (
          <li key={item.id} className='m-0'>
            <a
              className={clsx(
                'block rounded-md px-2.5 py-1.5 text-[0.82rem] font-semibold no-underline transition-colors hover:no-underline',
                item.level === 3 && 'pl-6',
                activeId === item.id
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted hover:bg-canvas hover:text-ink-2'
              )}
              href={`#${item.id}`}
              dangerouslySetInnerHTML={{ __html: item.value }}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
};
