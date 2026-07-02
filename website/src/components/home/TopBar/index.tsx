import type { ComponentType, ReactNode } from 'react';
import Link from '@docusaurus/Link';

export type TopBarLink = {
  label: string;
  Icon: ComponentType;
  href?: string;
  onClick?: () => void;
};

type TopBarProps = {
  links: TopBarLink[];
};

const TOP_LINK =
  'inline-flex items-center gap-[9px] py-[9px] rounded-xl text-[#a1b1e7] text-[13px] font-bold tracking-[-0.01em] no-underline cursor-pointer [&>svg]:size-4 [&>svg]:text-[#0c3c9f] [&>svg]:transition-colors [&>svg]:duration-200 [&>svg]:ease-out hover:[&>svg]:text-accent';

/* Desktop chrome only: below 921px the card header keeps the brand and
   collapses these links into its hamburger menu. */
export const TopBar = ({ links }: TopBarProps): ReactNode => (
  <header className='fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-end px-[clamp(16px,4vw,64px)] max-[920px]:hidden'>
    <nav aria-label='Site' className='flex items-center gap-4'>
      {links.map(({ label, Icon, href, onClick }) =>
        href ? (
          <Link key={label} className={TOP_LINK} to={href}>
            <Icon aria-hidden />
            {label}
          </Link>
        ) : (
          <button
            key={label}
            type='button'
            onClick={onClick}
            className={TOP_LINK}
          >
            <Icon aria-hidden />
            {label}
          </button>
        )
      )}
    </nav>
  </header>
);
