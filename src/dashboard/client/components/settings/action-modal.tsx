import type {
  ActionModalHeader,
  ActionRunState,
  InstallModalState,
  ModalState,
  PullModalState,
  SpecializeModalState,
  UpdateModalState,
} from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { useLocation } from 'preact-iso';
import { useState } from 'preact/hooks';
import { modal } from '../../data/state';
import { PHASE_COMMANDS, phaseCommand } from '../../domain/commands';
import { actionFailed } from '../../hooks/use/run-action';
import { GROUP_HEAD, TILE_SM } from '../../utils/tailwind-classes';
import { NextStepCard } from '../next-step-card';
import { Admonition } from '../primitives/admonition';
import { Icon } from '../primitives/icons';
import { Modal } from '../primitives/modal';
import { Tabs } from '../primitives/tabs';

const INSTALL_HEADER: Record<ActionRunState, ActionModalHeader> = {
  idle: {
    eyebrow: 'Install',
    icon: 'play',
    title: 'Ready to install',
    subtitle: 'Scaffolding Lagune into this project.',
  },
  pending: {
    eyebrow: 'Install',
    icon: 'refresh',
    title: 'Installing Lagune',
    subtitle: 'Scaffolding the commands, templates, and hooks.',
  },
  success: {
    eyebrow: 'Install',
    icon: 'checkCircle',
    title: 'Lagune is installed',
    subtitle: 'Here is what to run next in your agent.',
  },
  error: {
    eyebrow: 'Install',
    icon: 'alertTriangle',
    title: 'Install failed',
    subtitle: 'Nothing was scaffolded. Check the terminal and retry.',
  },
};

const PULL_HEADER: Record<ActionRunState, ActionModalHeader> = {
  idle: {
    eyebrow: 'Pull',
    icon: 'pullDown',
    title: 'Ready to pull',
    subtitle: 'Rebuilding Lagune from the committed manifest.',
  },
  pending: {
    eyebrow: 'Pull',
    icon: 'refresh',
    title: 'Pulling Lagune',
    subtitle: 'Restoring files from .lagune/manifest.json.',
  },
  success: {
    eyebrow: 'Pull',
    icon: 'checkCircle',
    title: 'This checkout is ready',
    subtitle: 'Pick up the chain where it left off in your agent.',
  },
  error: {
    eyebrow: 'Pull',
    icon: 'alertTriangle',
    title: 'Pull failed',
    subtitle: 'Nothing was rebuilt. Check the terminal and retry.',
  },
};

const UPDATE_HEADER: Record<ActionRunState, ActionModalHeader> = {
  idle: {
    eyebrow: 'Update',
    icon: 'upgrade',
    title: 'Ready to update',
    subtitle: 'Refreshing Lagune to its newest version.',
  },
  pending: {
    eyebrow: 'Update',
    icon: 'refresh',
    title: 'Updating Lagune',
    subtitle: 'Refreshing the commands, templates, and hooks.',
  },
  success: {
    eyebrow: 'Update',
    icon: 'checkCircle',
    title: 'Lagune is up to date',
    subtitle: 'Your charter, findings, and tracking were left untouched.',
  },
  error: {
    eyebrow: 'Update',
    icon: 'alertTriangle',
    title: 'Update failed',
    subtitle: 'Nothing was refreshed. Check the terminal and retry.',
  },
};

const SPECIALIZE_HEADER: Record<ActionRunState, ActionModalHeader> = {
  idle: {
    eyebrow: 'Specializations',
    icon: 'graduationCap',
    title: 'Ready to apply',
    subtitle: 'Updating the on-demand security knowledge for this project.',
  },
  pending: {
    eyebrow: 'Specializations',
    icon: 'refresh',
    title: 'Applying specializations',
    subtitle: 'Writing the sub-skills this project can load on demand.',
  },
  success: {
    eyebrow: 'Specializations',
    icon: 'checkCircle',
    title: 'Specializations updated',
    subtitle: 'The knowledge detect can draw on has changed.',
  },
  error: {
    eyebrow: 'Specializations',
    icon: 'alertTriangle',
    title: 'Update failed',
    subtitle: 'Nothing changed. Check the terminal and retry.',
  },
};

const HEADERS: Record<
  ModalState['kind'],
  Record<ActionRunState, ActionModalHeader>
> = {
  install: INSTALL_HEADER,
  pull: PULL_HEADER,
  update: UPDATE_HEADER,
  specialize: SPECIALIZE_HEADER,
};

const NextSteps = (props: { defaultKey: string }): VNode => {
  const [active, setActive] = useState(props.defaultKey);
  const phase =
    PHASE_COMMANDS.find((item) => item.key === active) ?? PHASE_COMMANDS[0];

  return (
    <div>
      <div class={GROUP_HEAD}>Next steps</div>
      <div class='flex flex-col gap-3'>
        <Tabs
          items={PHASE_COMMANDS}
          active={phase.key}
          numbered
          onSelect={setActive}
        />

        <NextStepCard step={phase} />
      </div>
    </div>
  );
};

const FileCount = (props: { value: number; verb: string }): VNode => (
  <>
    <span class='tabular-nums font-semibold text-ink-2'>{props.value}</span>{' '}
    {props.value === 1 ? 'file' : 'files'} {props.verb}
  </>
);

const InstallSummary = (props: { state: InstallModalState }): VNode => {
  const { state } = props;
  return (
    <span class='text-[0.85rem] text-muted'>
      Initialized for{' '}
      <span class='font-semibold text-ink-2'>{state.agentName}</span>
      {' · '}
      <FileCount value={state.created} verb='created' />
      {state.skipped > 0 && (
        <>
          {', '}
          <span class='tabular-nums font-semibold text-ink-2'>
            {state.skipped}
          </span>{' '}
          skipped
        </>
      )}
    </span>
  );
};

const PullSummary = (props: { state: PullModalState }): VNode => {
  const { state } = props;
  return (
    <span class='text-[0.85rem] text-muted'>
      Rebuilt from the committed manifest
      {' · '}
      <FileCount value={state.created} verb='restored' />
      {state.skipped > 0 && (
        <>
          {', '}
          <span class='tabular-nums font-semibold text-ink-2'>
            {state.skipped}
          </span>{' '}
          already in place
        </>
      )}
    </span>
  );
};

const UpdateSummary = (props: { state: UpdateModalState }): VNode => {
  const { state } = props;
  return (
    <span class='text-[0.85rem] text-muted'>
      Refreshed to the newest version
      {' · '}
      <FileCount value={state.refreshed} verb='updated' />
    </span>
  );
};

const SkillCount = (props: { value: number; verb: string }): VNode => (
  <>
    <span class='tabular-nums font-semibold text-ink-2'>{props.value}</span>{' '}
    {props.value === 1 ? 'skill' : 'skills'} {props.verb}
  </>
);

const SpecializeSummary = (props: { state: SpecializeModalState }): VNode => {
  const { added, removed } = props.state;

  if (added === 0 && removed === 0)
    return <span class='text-[0.85rem] text-muted'>No skills changed</span>;

  return (
    <span class='text-[0.85rem] text-muted'>
      {added > 0 && <SkillCount value={added} verb='added' />}
      {added > 0 && removed > 0 && ', '}
      {removed > 0 && <SkillCount value={removed} verb='removed' />}
    </span>
  );
};

const SpecializeNext = (): VNode => {
  const detect = phaseCommand('Detect') ?? PHASE_COMMANDS[1];

  return (
    <div class='flex flex-col gap-4'>
      <Admonition kind='tip' title='Re-run detect'>
        <p>
          Detect is the phase that loads these sub-skills and matches them
          against your code. Run it again so the knowledge you just changed
          shapes what gets surfaced.
        </p>
      </Admonition>
      <NextStepCard step={detect} />
    </div>
  );
};

export const ActionModal = (): VNode | null => {
  const { route } = useLocation();
  const state = modal.value;

  if (state === null) return null;

  const header = HEADERS[state.kind][state.run];
  const close = () => (modal.value = null);
  const done = () => {
    close();
    route('/');
  };

  return (
    <Modal onClose={done} label={header.title} width='max-w-170'>
      <div class='relative flex-none overflow-hidden bg-banner px-6 py-5 text-white'>
        <img
          class='pointer-events-none absolute inset-0 z-0 size-full object-cover mask-[linear-gradient(to_right,transparent,rgba(0,0,0,0.35)_38%,black)]'
          src='https://lagune.weslley.io/img/docs/banner-5.png'
          alt=''
          aria-hidden='true'
        />
        <span class='pointer-events-none absolute inset-0 z-1 bg-linear-to-r from-banner via-banner/85 to-banner/40' />
        <div class='relative z-2'>
          <span class='flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-white/82'>
            <span
              class={`inline-flex text-[0.95rem] ${state.run === 'pending' ? 'animate-spin' : ''}`}
            >
              <Icon name={header.icon} />
            </span>
            {header.eyebrow}
          </span>
          <h2 class='mt-1 text-[1.25rem] font-extrabold leading-[1.15] tracking-[-0.02em]'>
            {header.title}
          </h2>
          <p class='mt-1.5 text-[0.85rem] text-white/90'>{header.subtitle}</p>
        </div>
      </div>

      <div class='flex flex-col gap-4 bg-canvas px-6 py-5'>
        {state.run === 'pending' && (
          <div class='flex items-center gap-3 rounded-lg bg-surface p-4.5 shadow-card'>
            <span class={`${TILE_SM} bg-accent-soft text-accent`}>
              <span class='inline-flex animate-spin'>
                <Icon name='refresh' />
              </span>
            </span>
            <span class='text-[0.85rem] text-muted'>
              {state.kind === 'install' && (
                <>
                  Writing Lagune files for{' '}
                  <span class='font-semibold text-ink-2'>
                    {state.agentName}
                  </span>
                  …
                </>
              )}
              {state.kind === 'pull' &&
                'Restoring Lagune files from the committed manifest…'}
              {state.kind === 'update' &&
                'Refreshing Lagune files to the newest version…'}
              {state.kind === 'specialize' &&
                'Writing the sub-skills for this project…'}
            </span>
          </div>
        )}

        {state.run === 'error' && (
          <div class='flex items-center gap-3 rounded-lg bg-surface p-4.5 shadow-card'>
            <span class={`${TILE_SM} bg-red-soft text-red`}>
              <Icon name='alertTriangle' />
            </span>
            <span class='text-[0.85rem] text-muted'>
              {actionFailed(header.eyebrow)}
            </span>
          </div>
        )}

        {state.run === 'success' && (
          <>
            <div class='flex items-center gap-3 rounded-lg bg-surface p-4.5 shadow-card'>
              <span class={`${TILE_SM} bg-teal-soft text-teal`}>
                <Icon
                  name={state.kind === 'specialize' ? 'brain' : 'checkCircle'}
                />
              </span>
              {state.kind === 'install' && <InstallSummary state={state} />}
              {state.kind === 'pull' && <PullSummary state={state} />}
              {state.kind === 'update' && <UpdateSummary state={state} />}
              {state.kind === 'specialize' && (
                <SpecializeSummary state={state} />
              )}
            </div>

            {state.kind === 'install' && (
              <NextSteps defaultKey={PHASE_COMMANDS[0].key} />
            )}
            {(state.kind === 'pull' || state.kind === 'update') && (
              <NextSteps defaultKey={state.defaultKey} />
            )}
            {state.kind === 'specialize' && <SpecializeNext />}
          </>
        )}
      </div>

      {state.run === 'success' && (
        <div class='flex items-center justify-end gap-3 border-t border-line-2 px-6 py-3.5 bg-surface'>
          <button
            class='flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-4.5 py-2.5 text-[0.82rem] font-bold text-white transition-[background-color] duration-200 hover:bg-accent-3'
            type='button'
            onClick={done}
          >
            Done
            <span class='inline-flex'>
              <Icon name='arrowRight' />
            </span>
          </button>
        </div>
      )}
    </Modal>
  );
};
