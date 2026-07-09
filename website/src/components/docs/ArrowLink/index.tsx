import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { Icon } from '../icons';

const ARROW_COPY =
  'col-start-1 row-start-1 inline-flex transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]';

/* The diagonal slide the docs links share: on hover the arrow leaves top-right
   and a second copy arrives from bottom-left. The parent must carry `group`.
   Inside an admonition it inherits that box's accent (--lagune-adm); everywhere
   else it falls back to the page accent. */
export const LinkArrow = (): ReactNode => (
  <span
    aria-hidden
    className='relative ml-0.5 inline-grid size-[1em] place-items-center overflow-hidden align-[-0.125em] text-[var(--lagune-adm,var(--accent))]'
  >
    <span
      className={`${ARROW_COPY} group-hover:translate-x-[120%] group-hover:translate-y-[-120%]`}
    >
      <Icon name='arrowUpRight' strokeWidth={3} />
    </span>
    <span
      className={`${ARROW_COPY} translate-x-[-120%] translate-y-[120%] group-hover:translate-x-0 group-hover:translate-y-0`}
    >
      <Icon name='arrowUpRight' strokeWidth={3} />
    </span>
  </span>
);

type ArrowLinkProps = {
  to: string;
  children: ReactNode;
};

export const ArrowLink = ({ to, children }: ArrowLinkProps): ReactNode => {
  const external = /^https?:\/\//.test(to);

  return (
    <Link
      className='group'
      to={to}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {children}
      <LinkArrow />
    </Link>
  );
};
