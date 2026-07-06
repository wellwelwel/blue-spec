import type { PhaseCommand } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { commandDocHref } from '../utils/links';
import { CARD_TITLE, TILE_MD } from '../utils/tailwind-classes';
import { CopyButton } from './primitives/copy-button';
import { Icon } from './primitives/icons';

export const NextStepCard = (props: { step: PhaseCommand }): VNode => {
  const { step } = props;

  return (
    <div class='flex items-center gap-3.5 rounded-lg bg-surface p-4.5 shadow-card'>
      <span class={`${TILE_MD} ${step.tone}`}>
        <Icon name={step.icon} />
      </span>
      <div class='flex min-w-0 flex-1 flex-col gap-1'>
        <span class='flex items-center gap-1.5'>
          <span class={CARD_TITLE}>{step.command}</span>
          <span class='inline-flex text-muted'>
            <CopyButton
              inline
              text={step.command}
              label={`Copy ${step.command}`}
            />
          </span>
        </span>
        <span class='text-[0.8rem] text-muted'>{step.purpose}</span>
      </div>
      <a
        class='group/doc inline-flex flex-none items-center gap-1.5 rounded-lg bg-surface-2 px-4.5 py-2.5 text-[0.82rem] font-bold text-accent no-underline transition-[background-color] duration-200 hover:bg-accent-soft'
        href={commandDocHref(step.key)}
        target='_blank'
        rel='noreferrer'
      >
        Read the docs
        <span class='relative grid size-[0.9rem] flex-none place-items-center overflow-hidden text-[0.9rem]'>
          <span class='col-start-1 row-start-1 inline-flex transition-transform duration-300 ease-house group-hover/doc:translate-x-[120%] group-hover/doc:translate-y-[-120%]'>
            <Icon name='arrowUpRight' />
          </span>
          <span class='col-start-1 row-start-1 inline-flex translate-x-[-120%] translate-y-[120%] transition-transform duration-300 ease-house group-hover/doc:translate-x-0 group-hover/doc:translate-y-0'>
            <Icon name='arrowUpRight' />
          </span>
        </span>
      </a>
    </div>
  );
};
