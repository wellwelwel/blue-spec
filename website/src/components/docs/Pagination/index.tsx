import type { DocsSidebarLink } from '@site/plugins/docs-content';
import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import { Icon } from '../icons';

const CARD =
  'group flex items-center gap-3 rounded-card bg-surface px-5 py-4 no-underline shadow-card transition-[box-shadow] hover:no-underline hover:shadow-pop';

const PaginationCard = ({
  link,
  direction,
}: {
  link: DocsSidebarLink;
  direction: 'previous' | 'next';
}): ReactNode => (
  <Link
    className={clsx(
      CARD,
      direction === 'next' && 'flex-row-reverse text-right'
    )}
    to={link.permalink}
  >
    <span className='inline-flex flex-none text-[1.1rem] text-faint transition-colors group-hover:text-accent'>
      <Icon name={direction === 'previous' ? 'arrowLeft' : 'arrowRight'} />
    </span>
    <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
      <span className='text-[0.7rem] font-bold uppercase tracking-[0.09em] text-faint'>
        {direction === 'previous' ? 'Previous' : 'Next'}
      </span>
      <span className='truncate text-[0.9rem] font-extrabold text-ink transition-colors group-hover:text-accent'>
        {link.label}
      </span>
    </span>
  </Link>
);

export const DocsPagination = ({
  previous,
  next,
}: {
  previous: DocsSidebarLink | undefined;
  next: DocsSidebarLink | undefined;
}): ReactNode => {
  if (!previous && !next) return null;

  return (
    <nav className='mt-5 grid gap-4 sm:grid-cols-2' aria-label='Docs pages'>
      <span className='min-w-0'>
        {previous && <PaginationCard link={previous} direction='previous' />}
      </span>
      <span className='min-w-0'>
        {next && <PaginationCard link={next} direction='next' />}
      </span>
    </nav>
  );
};
