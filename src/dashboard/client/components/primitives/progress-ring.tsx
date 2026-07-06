import type { IconName } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { Icon } from './icons';

export const ProgressRing = (props: {
  percent: number;
  centerIcon: IconName;
}): VNode => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, props.percent));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div class='relative size-39'>
      <svg
        viewBox='0 0 128 128'
        class='size-full -rotate-90'
        aria-hidden='true'
      >
        <circle
          class='fill-none stroke-surface-3 [stroke-width:11]'
          cx='64'
          cy='64'
          r={radius}
        />
        <circle
          class='ring-anim fill-none stroke-accent [stroke-linecap:round] [stroke-width:11]'
          cx='64'
          cy='64'
          r={radius}
          stroke-dasharray={circumference.toFixed(2)}
          stroke-dashoffset={offset.toFixed(2)}
        />
      </svg>
      <span class='absolute inset-0 grid place-items-center text-[2.6rem] text-accent'>
        <Icon name={props.centerIcon} />
      </span>
      <span class='absolute top-2 right-1 rounded-full bg-accent px-2.5 py-0.75 text-[0.76rem] font-bold tabular-nums text-white'>
        {props.percent}%
      </span>
    </div>
  );
};
