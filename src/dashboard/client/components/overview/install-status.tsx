import type { InstallPresentation } from '@/types/dashboard/client';
import type { Install } from '@/types/dashboard/dashboard';
import type { VNode } from 'preact';
import { BADGE_MUTED } from '../../utils/tailwind-classes';
import { Icon } from '../primitives/icons';
import { SectionHead } from './section-head';

const presentation = (install: Install): InstallPresentation => {
  if (!install.present)
    return {
      icon: 'package',
      tile: 'bg-accent-soft text-accent',
      title: 'Lagune is not installed here',
      detail:
        'No manifest was found. Install scaffolds the commands, templates, and hooks into this project.',
      action: { href: '/settings?tab=install', label: 'Install' },
    };
  if (install.missing.length > 0)
    return {
      icon: 'pullDown',
      tile: 'bg-amber-soft text-amber',
      title: 'This checkout needs a pull',
      detail: `${install.missing.length} of ${install.filesTotal} manifest files are missing. Pull rebuilds them from the committed manifest.`,
      action: { href: '/settings?tab=pull', label: 'Run pull' },
    };
  return {
    icon: 'shieldCheck',
    tile: 'bg-teal-soft text-teal',
    title: 'Ready to run',
    detail: `All ${install.filesTotal} manifest files are in place. Every phase can run.`,
    action: null,
  };
};

export const InstallStatus = (props: { install: Install }): VNode => {
  const { install } = props;
  const state = presentation(install);

  return (
    <section class='mb-6'>
      <SectionHead
        title='Installation'
        link={{ href: '/settings', label: 'Manage' }}
      />
      <div class='flex items-center gap-3.5 rounded-lg bg-surface p-4.5 shadow-card'>
        <span
          class={`grid size-11 flex-none place-items-center rounded-md text-[1.25rem] ${state.tile}`}
        >
          <Icon name={state.icon} />
        </span>
        <span class='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span class='text-[0.9rem] font-bold tracking-[-0.01em]'>
            {state.title}
          </span>
          <span class='truncate text-[0.8rem] text-muted'>{state.detail}</span>
        </span>
        {state.action ? (
          <a
            class='flex flex-none cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-4.5 py-2.5 text-[0.82rem] font-bold text-white no-underline transition-[background-color] duration-200 hover:bg-accent-3'
            href={state.action.href}
          >
            {state.action.label}
            <span class='inline-flex'>
              <Icon name='arrowRight' />
            </span>
          </a>
        ) : (
          <span class='flex flex-none items-center gap-2'>
            {install.version && (
              <span class={BADGE_MUTED}>v{install.version}</span>
            )}
            <span class={BADGE_MUTED}>
              <span class='tabular-nums'>{install.agents.length}</span>
              {install.agents.length === 1 ? 'agent' : 'agents'}
            </span>
          </span>
        )}
      </div>
    </section>
  );
};
