import type {
  ActionRunState,
  IconName,
  RunButton,
} from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { Icon } from '../primitives/icons';

export const ActionCard = (props: {
  icon: IconName;
  title: string;
  body: string;
  action: string;
  run?: ActionRunState;
  runButton?: Record<ActionRunState, RunButton>;
  onRun?: () => void;
  errorText?: string;
}): VNode => {
  const run = props.run ?? 'idle';
  const pending = run === 'pending';
  const button = props.runButton?.[run];

  return (
    <div class='route-rise flex min-h-105 flex-col items-center justify-center gap-5 rounded-xl bg-surface p-12 text-center shadow-card'>
      <span class='grid size-16 place-items-center rounded-xl bg-accent-soft text-[1.8rem] text-accent'>
        <Icon name={props.icon} />
      </span>
      <div class='max-w-105'>
        <h2 class='text-[1.15rem] font-extrabold tracking-[-0.02em] text-ink text-balance'>
          {props.title}
        </h2>
        <p class='mt-2 text-[0.85rem] leading-[1.55] text-muted text-pretty'>
          {props.body}
        </p>
      </div>
      <button
        class='flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-lg border-0 bg-accent pr-5 pl-5.5 text-[0.9rem] font-bold text-white transition-[background-color] duration-200 hover:bg-accent-3 disabled:cursor-default disabled:opacity-70'
        type='button'
        disabled={pending}
        onClick={props.onRun}
      >
        <span
          class={`inline-flex text-[1rem] ${pending ? 'animate-spin' : ''}`}
        >
          <Icon name={button?.icon ?? props.icon} />
        </span>
        {button?.label ?? props.action}
      </button>
      {run === 'error' && props.errorText && (
        <p class='text-[0.8rem] text-red'>{props.errorText}</p>
      )}
    </div>
  );
};
