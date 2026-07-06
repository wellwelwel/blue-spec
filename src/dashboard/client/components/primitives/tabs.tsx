import type { TabItem } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { classes } from '../../utils/tailwind-classes';
import { Icon } from './icons';

export const Tabs = (props: {
  items: TabItem[];
  active: string;
  only?: string;
  numbered?: boolean;
  onSelect: (key: string) => void;
}): VNode => (
  <div class='flex flex-wrap gap-1.5 rounded-xl bg-surface p-1.5 shadow-card'>
    {props.items.map((item, index) => {
      const on = props.active === item.key;
      const disabled = props.only !== undefined && item.key !== props.only;
      return (
        <button
          key={item.key}
          class={classes(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[0.82rem] font-bold whitespace-nowrap transition-[background-color,color,box-shadow] duration-200',
            on
              ? 'cursor-pointer bg-accent-soft text-accent shadow-card-half'
              : disabled
                ? 'cursor-not-allowed text-faint opacity-50'
                : 'cursor-pointer text-muted hover:bg-surface-2 hover:text-ink-2'
          )}
          type='button'
          aria-pressed={on}
          disabled={disabled}
          onClick={() => props.onSelect(item.key)}
        >
          {props.numbered ? (
            <span class='inline-flex size-5 items-center justify-center rounded-full bg-current/12 text-[0.72rem] tabular-nums'>
              {index + 1}
            </span>
          ) : (
            <span class='inline-flex text-[1.05rem]'>
              <Icon name={item.icon} />
            </span>
          )}
          {item.label}
        </button>
      );
    })}
  </div>
);
