import type { StepState } from '@/types/dashboard/client';
import type { Finding } from '@/types/dashboard/dashboard';
import type { VNode } from 'preact';
import { pipeline } from '../../selectors/derive';
import { SOFT_TONE } from '../../utils/tailwind-classes';
import { Icon } from '../primitives/icons';

const NODE_STATE: Record<StepState, string> = {
  done: 'bg-accent text-white',
  active: SOFT_TONE.accent,
  reproved: SOFT_TONE.red,
  pending: 'bg-surface text-faint',
};

export const Stepper = (props: { finding: Finding }): VNode => {
  const steps = pipeline(props.finding);

  return (
    <div class='mt-4.5 mb-6 flex flex-wrap items-center gap-x-0 gap-y-1.5'>
      {steps.map((step, index) => (
        <>
          <div class='flex items-center gap-2.5'>
            <span
              class={`grid size-8.5 place-items-center rounded-full text-[0.85rem] font-bold shadow-card ${NODE_STATE[step.state]}`}
            >
              {step.state === 'done' ? <Icon name='check' /> : index + 1}
            </span>
            <span class='flex flex-col leading-[1.2]'>
              <span class='text-[0.82rem] font-bold'>{step.label}</span>
              <span class='text-[0.76rem] text-muted'>{step.detail}</span>
            </span>
          </div>
          {index < steps.length - 1 && (
            <span
              class={`mx-3.5 h-0.5 min-w-6.5 flex-1 rounded-[2px] ${
                step.state === 'done' ? 'bg-accent' : 'bg-line-2'
              }`}
            />
          )}
        </>
      ))}
    </div>
  );
};
