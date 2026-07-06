import type { NavItem, RouteScope } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { useLocation } from 'preact-iso';
import { useData } from '../../data/state';
import { isLocked } from '../../domain/install';
import { LINKS } from '../../utils/links';
import { classes, MICRO_LABEL, SOFT_TONE } from '../../utils/tailwind-classes';
import { Icon } from '../primitives/icons';

const scopeForPath = (path: string): RouteScope => {
  if (path.startsWith('/findings')) return 'findings';
  if (path.startsWith('/sidequests')) return 'sidequests';
  if (path.startsWith('/charter')) return 'charter';
  if (path.startsWith('/skills')) return 'skills';
  if (path.startsWith('/settings')) return 'settings';
  return 'overview';
};

const GROUP = `px-2.5 pt-4 pb-2 ${MICRO_LABEL}`;

const FOOT_LINK =
  'flex items-center gap-3 rounded-md px-3 py-2.25 text-[0.85rem] font-semibold text-muted no-underline transition-colors hover:bg-canvas hover:text-ink-2';

export const Sidebar = (): VNode => {
  const data = useData();
  const { path } = useLocation();
  const active = scopeForPath(path);
  const locked = isLocked(data.install);

  const items: NavItem[] = [
    { scope: 'overview', href: '/', label: 'Overview', icon: 'grid' },

    {
      scope: 'charter',
      href: '/charter',
      label: 'Charter',
      icon: 'charter',
      badge: data.charter.principles.length,
    },
    {
      scope: 'findings',
      href: '/findings',
      label: 'Findings',
      icon: 'shield',
      badge: data.findings.length,
    },
    {
      scope: 'sidequests',
      href: '/sidequests',
      label: 'Side Quests',
      icon: 'compass',
      badge: data.sidequests.length,
    },
    {
      scope: 'skills',
      href: '/skills',
      label: 'Skills',
      icon: 'brain',
      badge: data.skills.length,
    },
    {
      scope: 'settings',
      href: '/settings',
      label: 'Settings',
      icon: 'settings',
    },
  ];

  return (
    <aside class='scroll-slim flex flex-col overflow-y-auto bg-surface px-4 py-6'>
      <a
        class='flex items-center gap-3 px-2 pt-1.5 pb-5 text-ink no-underline'
        href='/'
      >
        <img
          class='size-9.5 flex-none rounded-md object-contain'
          src='/assets/images/favicon.png'
          alt=''
          width={38}
          height={38}
        />
        <span class='flex flex-col gap-1 text-[1.25rem] font-extrabold leading-none tracking-[-0.02em]'>
          Blue Spec
          <span class='text-[0.75rem] font-semibold leading-none tracking-wide text-muted'>
            Dashboard Preview
          </span>
        </span>
      </a>
      <nav class='flex flex-col gap-0.75'>
        <span class={GROUP}>Workspace</span>
        {items.map((item) => {
          const on = active === item.scope;
          const disabled = locked && item.scope !== 'settings';
          return (
            <a
              class={classes(
                'flex items-center gap-3 rounded-md px-3 py-2.75 text-[0.85rem] font-semibold no-underline transition-colors',
                on
                  ? SOFT_TONE.accent
                  : disabled
                    ? 'pointer-events-none cursor-not-allowed text-faint opacity-50'
                    : 'text-muted hover:bg-canvas hover:text-ink-2'
              )}
              href={disabled ? undefined : item.href}
              aria-disabled={disabled || undefined}
              tabIndex={disabled ? -1 : undefined}
            >
              <span class='inline-flex text-[1.2rem]'>
                <Icon name={item.icon} />
              </span>
              <span class='flex-1'>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  class={classes(
                    'min-w-6 rounded-full px-2 py-px text-center text-[0.72rem] font-bold tabular-nums',
                    on ? 'bg-surface text-accent' : 'bg-canvas text-faint'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>
      <a
        class='group mt-auto mb-4 flex items-center gap-2 no-underline'
        href={LINKS.repo}
        target='_blank'
        rel='noreferrer'
      >
        <span class='grid size-19 flex-none transition-transform duration-300 ease-out group-hover:scale-102'>
          <img
            class='col-start-1 row-start-1 size-19 object-contain mix-blend-multiply transition-[opacity,scale,filter] duration-200 ease-house scale-100 opacity-100 [filter:blur(0)] dark:scale-[0.25] dark:opacity-0 dark:[filter:blur(4px)]'
            src='https://bluespec.weslley.io/img/docs/octocat.gif'
            alt=''
            width={76}
            height={76}
          />
          <img
            class='col-start-1 row-start-1 size-19 object-contain transition-[opacity,scale,filter] duration-200 ease-house scale-[0.25] opacity-0 [filter:drop-shadow(0_2px_6px_rgba(0,0,0,0.55))_blur(4px)] dark:scale-[0.85] dark:opacity-100 dark:[filter:drop-shadow(0_2px_6px_rgba(0,0,0,0.55))_blur(0)]'
            src='https://bluespec.weslley.io/img/docs/octocat-2.png'
            alt=''
            width={76}
            height={76}
          />
        </span>
        <span class='relative flex min-w-0 flex-1 flex-col gap-0.5'>
          <span class='pointer-events-none absolute -top-7 -right-2.5 text-[5rem] leading-none text-slate-200 opacity-30 [clip-path:inset(0_0_0_33%)] dark:opacity-[.05]'>
            <Icon name='star' />
          </span>
          <span class='relative z-10 text-[0.9rem] font-extrabold leading-tight text-ink'>
            Star on GitHub
          </span>
          <span class='relative z-10 text-[0.75rem] font-semibold leading-tight text-muted'>
            Support Blue Spec
          </span>
        </span>
        <span class='relative grid size-[0.85rem] flex-none place-items-center overflow-hidden text-[0.85rem] text-accent'>
          <span class='col-start-1 row-start-1 inline-flex transition-transform duration-300 ease-house group-hover:translate-x-[120%] group-hover:-translate-y-[120%]'>
            <Icon name='arrowUpRight' />
          </span>
          <span class='col-start-1 row-start-1 inline-flex -translate-x-[120%] translate-y-[120%] transition-transform duration-300 ease-house group-hover:translate-x-0 group-hover:translate-y-0'>
            <Icon name='arrowUpRight' />
          </span>
        </span>
      </a>
      <div class='flex flex-col gap-0.5 border-t border-line pt-3'>
        <a class={FOOT_LINK} href={LINKS.repo} target='_blank' rel='noreferrer'>
          <span class='inline-flex text-[1.15rem]'>
            <Icon name='github' />
          </span>
          <span class='flex-1'>GitHub</span>
          <span class='inline-flex text-[0.8rem] text-faint'>
            <Icon name='arrowUpRight' />
          </span>
        </a>
        <a
          class={FOOT_LINK}
          href={LINKS.sponsor}
          target='_blank'
          rel='noreferrer'
        >
          <span class='inline-flex text-[1.15rem] text-pink'>
            <Icon name='heart' />
          </span>
          <span class='flex-1'>Sponsor</span>
          <span class='inline-flex text-[0.8rem] text-faint'>
            <Icon name='arrowUpRight' />
          </span>
        </a>
      </div>
    </aside>
  );
};
