import type {
  DocsSidebarCategory,
  DocsSidebarEntry,
  DocsSidebarLink,
} from '@site/plugins/docs-content';
import type { ReactNode } from 'react';
import type { DocsIconName } from '../icons';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import LayoutProvider from '@theme/Layout/Provider';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useDocsData } from '../data';
import { Icon } from '../icons';
import { QuickSearch } from '../QuickSearch';
import { toggleDocsTheme } from '../theme';

const GROUP =
  'px-2.5 pt-4 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.09em] text-faint';

const NAV_LINK =
  'flex items-center gap-3 rounded-field px-3 py-2.25 text-[0.79rem] font-semibold no-underline transition-colors';

const FOOT_LINK = `${NAV_LINK} text-muted hover:bg-canvas hover:text-ink-2 hover:no-underline`;

const ICON_BTN =
  'relative grid size-11.5 flex-none cursor-pointer place-items-center rounded-full border-0 bg-surface text-[1.2rem] text-ink-2 no-underline shadow-card transition-[color,box-shadow] hover:text-accent hover:no-underline hover:shadow-pop';

const PILL =
  'inline-flex h-11.5 flex-none items-center gap-2 rounded-full bg-surface px-4.5 text-[0.85rem] font-bold text-ink-2 no-underline shadow-card transition-[color,box-shadow] hover:text-accent hover:no-underline hover:shadow-pop';

const GROUP_ICONS: Partial<Record<string, DocsIconName>> = {
  'Get Started': 'play',
  'The Blue Team Flow': 'activity',
  Tools: 'grid',
  Hooks: 'cpu',
  'References & Sources': 'file',
  Maintenance: 'refresh',
};

const isActive = (pathname: string, permalink: string): boolean =>
  pathname.replace(/\/+$/, '') === permalink.replace(/\/+$/, '') ||
  (pathname === '/docs/' && permalink === '/docs');

/* Docusaurus remounts the route tree on every navigation, which would reset
   each category's local state. Manual toggles live here so the sidebar
   survives navigation. The drawer never reads it: it always opens collapsed. */
const persistedOpenGroups = new Map<string, boolean>();

const SidebarItem = ({
  item,
  pathname,
}: {
  item: DocsSidebarLink;
  pathname: string;
}): ReactNode => (
  <Link
    className={clsx(
      NAV_LINK,
      isActive(pathname, item.permalink)
        ? 'bg-accent-soft text-accent hover:no-underline'
        : 'text-muted hover:bg-canvas hover:text-ink-2 hover:no-underline'
    )}
    to={item.permalink}
  >
    {item.label}
  </Link>
);

const SidebarCategory = ({
  category,
  pathname,
  startCollapsed,
}: {
  category: DocsSidebarCategory;
  pathname: string;
  startCollapsed: boolean;
}): ReactNode => {
  const containsActive = category.items.some((item) =>
    isActive(pathname, item.permalink)
  );
  const [open, setOpen] = useState(
    startCollapsed
      ? false
      : containsActive ||
          (persistedOpenGroups.get(category.label) ?? !category.collapsed)
  );
  const listId = `bs-docs-group-${category.label.toLowerCase().replace(/[^a-z]+/g, '-')}`;

  useEffect(() => {
    if (!startCollapsed && containsActive) setOpen(true);
  }, [startCollapsed, containsActive]);

  const toggle = () => {
    const next = !open;
    if (!startCollapsed) persistedOpenGroups.set(category.label, next);
    setOpen(next);
  };

  const icon = GROUP_ICONS[category.label] ?? 'layers';

  return (
    <div className='flex flex-col'>
      <button
        className={clsx(
          GROUP,
          'flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent text-left transition-colors hover:text-muted'
        )}
        type='button'
        aria-expanded={open}
        aria-controls={listId}
        onClick={toggle}
      >
        <span className='flex min-w-0 items-center gap-2'>
          <span className='inline-flex text-[0.9rem] text-muted'>
            <Icon name={icon} />
          </span>
          <span className='truncate'>{category.label}</span>
        </span>
        <span
          className={clsx(
            'inline-flex text-[0.9rem] transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
            open && 'rotate-90'
          )}
        >
          <Icon name='chevronRight' />
        </span>
      </button>
      <div
        id={listId}
        className={clsx(
          'grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className='ml-[calc(1.075rem-1px)] flex min-h-0 flex-col gap-0.75 overflow-hidden border-l border-line pl-2'>
          {category.items.map((item) => (
            <SidebarItem key={item.docId} item={item} pathname={pathname} />
          ))}
        </div>
      </div>
    </div>
  );
};

const SidebarNav = ({
  sidebar,
  pathname,
  startCollapsed = false,
}: {
  sidebar: DocsSidebarEntry[];
  pathname: string;
  startCollapsed?: boolean;
}): ReactNode => (
  <>
    <Link
      className='flex items-center gap-3 px-2 pt-1.5 pb-5 text-ink no-underline hover:no-underline'
      to='/'
    >
      <img
        className='size-9.5 flex-none rounded-field object-contain'
        src='/favicon.png'
        alt=''
        width={38}
        height={38}
      />
      <span className='flex flex-col gap-1 text-[1.25rem] font-extrabold leading-none tracking-[-0.02em] text-ink'>
        Blue Spec
        <span className='sr-only'>Documentation</span>
        <span
          aria-hidden
          className='flex justify-between text-[0.75rem] font-semibold leading-none tracking-normal text-muted'
        >
          {[...'Documentation'].map((letter, index) => (
            <span key={index}>{letter}</span>
          ))}
        </span>
      </span>
    </Link>
    <nav className='flex flex-col gap-0.75'>
      {sidebar.map((entry) =>
        entry.type === 'category' ? (
          <SidebarCategory
            key={entry.label}
            category={entry}
            pathname={pathname}
            startCollapsed={startCollapsed}
          />
        ) : (
          <SidebarItem key={entry.docId} item={entry} pathname={pathname} />
        )
      )}
    </nav>
    <a
      className='group mt-auto mb-4 flex items-center gap-2 pt-8 no-underline hover:no-underline'
      href='https://github.com/wellwelwel/blue-spec'
      target='_blank'
      rel='noreferrer'
    >
      <span className='grid size-19 flex-none transition-transform duration-300 ease-out group-hover:scale-102'>
        <img
          className='col-start-1 row-start-1 size-19 scale-100 object-contain opacity-100 mix-blend-multiply filter-[blur(0)] transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] docs-dark:scale-[0.25] docs-dark:opacity-0 docs-dark:filter-[blur(4px)]'
          src='/img/docs/octocat.gif'
          alt=''
          width={76}
          height={76}
        />
        <img
          className='col-start-1 row-start-1 size-19 scale-[0.25] object-contain opacity-0 filter-[drop-shadow(0_2px_6px_rgba(0,0,0,0.55))_blur(4px)] transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] docs-dark:scale-[0.85] docs-dark:opacity-100 docs-dark:filter-[drop-shadow(0_2px_6px_rgba(0,0,0,0.55))_blur(0)]'
          src='/img/docs/octocat-2.png'
          alt=''
          width={76}
          height={76}
        />
      </span>
      <span className='relative flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='pointer-events-none absolute -top-7 -right-2.5 text-[5rem] leading-none text-slate-200 opacity-30 [clip-path:inset(0_0_0_33%)] docs-dark:opacity-[.05]'>
          <Icon name='star' />
        </span>
        <span className='relative z-10 text-[0.9rem] font-extrabold leading-tight text-ink'>
          Star on GitHub
        </span>
        <span className='relative z-10 text-[0.75rem] font-semibold leading-tight text-muted'>
          Support Blue Spec
        </span>
      </span>
      <span className='relative grid size-[0.85rem] flex-none place-items-center overflow-hidden text-[0.85rem] text-accent'>
        <span className='col-start-1 row-start-1 inline-flex transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] group-hover:translate-x-[120%] group-hover:translate-y-[-120%]'>
          <Icon name='arrowUpRight' />
        </span>
        <span className='col-start-1 row-start-1 inline-flex translate-x-[-120%] translate-y-[120%] transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] group-hover:translate-x-0 group-hover:translate-y-0'>
          <Icon name='arrowUpRight' />
        </span>
      </span>
    </a>
    <div className='flex flex-col gap-0.5 border-t border-line pt-3'>
      <a
        className={FOOT_LINK}
        href='https://github.com/wellwelwel/blue-spec'
        target='_blank'
        rel='noreferrer'
      >
        <span className='inline-flex text-[1.15rem]'>
          <Icon name='github' />
        </span>
        <span className='flex-1'>GitHub</span>
        <span className='inline-flex text-[0.8rem] text-faint'>
          <Icon name='arrowUpRight' />
        </span>
      </a>
      <a
        className={FOOT_LINK}
        href='https://github.com/sponsors/wellwelwel'
        target='_blank'
        rel='noreferrer'
      >
        <span className='inline-flex text-[1.15rem] text-pink'>
          <Icon name='heart' />
        </span>
        <span className='flex-1'>Sponsor</span>
        <span className='inline-flex text-[0.8rem] text-faint'>
          <Icon name='arrowUpRight' />
        </span>
      </a>
    </div>
  </>
);

export const DocsShell = ({
  children,
  rail,
}: {
  children: ReactNode;
  rail?: ReactNode;
}): ReactNode => {
  const { sidebar } = useDocsData();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('bs-docs-drawer-open', drawerOpen);
    return () => document.body.classList.remove('bs-docs-drawer-open');
  }, [drawerOpen]);

  return (
    <LayoutProvider>
      <div className='bs-docs min-h-screen'>
        {drawerOpen && (
          <div className='fixed inset-0 z-50 min-[1024px]:hidden'>
            <button
              className='bs-docs-backdrop absolute inset-0 size-full cursor-pointer border-0'
              type='button'
              aria-label='Close navigation'
              onClick={() => setDrawerOpen(false)}
            />
            <aside className='bs-docs-drawer bs-scroll absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-surface px-4 py-6 shadow-pop'>
              <button
                className='absolute top-4 right-3 grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[1.2rem] text-muted transition-colors hover:text-ink'
                type='button'
                aria-label='Close navigation'
                onClick={() => setDrawerOpen(false)}
              >
                <Icon name='x' />
              </button>
              <SidebarNav
                sidebar={sidebar}
                pathname={pathname}
                startCollapsed
              />
            </aside>
          </div>
        )}
        <div className='min-[1024px]:grid min-[1024px]:grid-cols-[250px_minmax(0,1fr)] min-[1440px]:grid-cols-[270px_minmax(0,1fr)]'>
          <aside className='bs-scroll sticky top-0 hidden h-screen flex-col overflow-y-auto bg-surface px-4 py-6 min-[1024px]:flex'>
            <SidebarNav sidebar={sidebar} pathname={pathname} />
          </aside>
          <div className='flex min-w-0 flex-col'>
            <header className='sticky top-0 z-30 flex items-center gap-3 bg-canvas/85 px-4 pt-4 pb-3 backdrop-blur-md sm:gap-4.5 sm:px-7 sm:pt-5.5 sm:pb-4'>
              <button
                className={clsx(ICON_BTN, 'min-[1024px]:hidden')}
                type='button'
                aria-label='Open navigation'
                onClick={() => setDrawerOpen(true)}
              >
                <Icon name='menu' />
              </button>
              <QuickSearch />
              <div className='flex items-center gap-3'>
                <button
                  className={ICON_BTN}
                  type='button'
                  aria-label='Toggle theme'
                  onClick={toggleDocsTheme}
                >
                  <span className='col-start-1 row-start-1 inline-flex scale-100 opacity-100 filter-[blur(0)] transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] docs-dark:scale-[0.25] docs-dark:opacity-0 docs-dark:filter-[blur(4px)]'>
                    <Icon name='moon' />
                  </span>
                  <span className='col-start-1 row-start-1 inline-flex scale-[0.25] opacity-0 filter-[blur(4px)] transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] docs-dark:scale-100 docs-dark:opacity-100 docs-dark:filter-[blur(0)]'>
                    <Icon name='sun' />
                  </span>
                </button>
                <a
                  className={clsx(ICON_BTN, 'max-sm:hidden')}
                  href='https://github.com/wellwelwel/blue-spec'
                  target='_blank'
                  rel='noreferrer'
                  aria-label='GitHub repository'
                >
                  <Icon name='github' />
                </a>
                <a
                  className={clsx(ICON_BTN, 'max-md:hidden')}
                  href='https://github.com/sponsors/wellwelwel'
                  target='_blank'
                  rel='noreferrer'
                  aria-label='Sponsor Blue Spec'
                >
                  <span className='inline-flex text-pink'>
                    <Icon name='heart' />
                  </span>
                </a>
                <span className='h-7.5 w-px bg-line-2 max-md:hidden' />
                <Link className={clsx(PILL, 'max-md:hidden')} to='/'>
                  <span className='inline-flex text-[1.1rem]'>
                    <Icon name='grid' />
                  </span>
                  Home
                </Link>
                <Link
                  className={clsx(ICON_BTN, 'md:hidden')}
                  to='/'
                  aria-label='Back to the home page'
                >
                  <Icon name='grid' />
                </Link>
              </div>
            </header>
            <div className='mx-auto w-full max-w-360 flex-1 px-4 pt-2 pb-7 sm:px-7 min-[1280px]:grid min-[1280px]:grid-cols-[minmax(0,1fr)_300px] min-[1280px]:items-start min-[1280px]:gap-7'>
              <main className='flex min-w-0 flex-col'>{children}</main>
              {rail && (
                <div className='sticky top-24 hidden min-[1280px]:block'>
                  {rail}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutProvider>
  );
};
