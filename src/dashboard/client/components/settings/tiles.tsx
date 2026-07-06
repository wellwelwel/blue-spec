import type { InstallAgent, InstallCategory } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { classes } from '../../utils/tailwind-classes';
import { Icon } from '../primitives/icons';
import { MaskIcon } from '../primitives/mask-icon';

export const AgentButton = (props: {
  agent: InstallAgent;
  on: boolean;
  locked?: boolean;
  onClick: () => void;
}): VNode => (
  <button
    class={classes(
      'flex items-center gap-3 rounded-lg py-2.5 pr-2.5 pl-3 text-left transition-[background-color,color,box-shadow] duration-200',
      props.locked
        ? 'cursor-default bg-surface-2 text-muted opacity-70 grayscale'
        : props.on
          ? 'cursor-pointer bg-accent-soft text-accent shadow-card-half'
          : 'cursor-pointer bg-surface-2 text-ink-2 hover:text-ink hover:shadow-card-half'
    )}
    type='button'
    role='radio'
    aria-checked={props.on || props.locked === true}
    aria-disabled={props.locked}
    disabled={props.locked}
    onClick={props.locked ? undefined : props.onClick}
  >
    <span
      class={classes(
        'grid size-8 flex-none place-items-center rounded-md bg-surface',
        props.on || props.locked ? 'text-accent' : 'text-muted'
      )}
    >
      {props.agent.icon ? (
        <MaskIcon src={props.agent.icon} class='size-4.5 bg-current' />
      ) : (
        <span class='inline-flex text-[1.05rem]'>
          <Icon name='terminal' />
        </span>
      )}
    </span>
    <span class='min-w-0 flex-1 truncate text-[0.85rem] font-semibold'>
      {props.agent.name}
    </span>
    <span
      class={classes(
        'inline-flex flex-none text-[1.05rem] transition-[opacity,scale,filter] duration-300 ease-house',
        props.on || props.locked
          ? 'scale-100 text-accent opacity-100 blur-0'
          : 'scale-[0.25] opacity-0 blur-[4px]'
      )}
    >
      <Icon name='checkCircle' />
    </span>
  </button>
);

export const ManageCategoryRow = (props: {
  category: InstallCategory;
  on: boolean;
  locked?: boolean;
  onToggle: () => void;
}): VNode => {
  const checked = props.on || props.locked === true;
  return (
    <button
      class={classes(
        'flex h-full items-start gap-3 rounded-lg p-3.5 text-left transition-[background-color,box-shadow] duration-200',
        props.locked
          ? 'cursor-default bg-accent-soft opacity-70 grayscale'
          : props.on
            ? 'cursor-pointer bg-accent-soft shadow-card-half'
            : 'cursor-pointer bg-surface-2 hover:shadow-card-half'
      )}
      type='button'
      role='checkbox'
      aria-checked={checked}
      aria-disabled={props.locked}
      disabled={props.locked}
      onClick={props.locked ? undefined : props.onToggle}
    >
      <span class='relative grid flex-none text-[1.2rem]'>
        <span
          class={classes(
            'col-start-1 row-start-1 inline-flex text-accent transition-[opacity,scale,filter] duration-300 ease-house',
            checked
              ? 'scale-100 opacity-100 blur-0'
              : 'scale-[0.25] opacity-0 blur-[4px]'
          )}
        >
          <Icon name='checkSquare' />
        </span>
        <span
          class={classes(
            'col-start-1 row-start-1 inline-flex text-faint transition-[opacity,scale,filter] duration-300 ease-house',
            checked
              ? 'scale-[0.25] opacity-0 blur-[4px]'
              : 'scale-100 opacity-100 blur-0'
          )}
        >
          <Icon name='square' />
        </span>
      </span>
      <span class='flex min-w-0 flex-1 flex-col gap-1'>
        <span class='flex items-center gap-2'>
          <MaskIcon
            src={props.category.icon}
            class={classes(
              'size-4.5 flex-none bg-current transition-colors duration-200',
              checked ? 'text-accent' : 'text-faint'
            )}
          />
          <span
            class={classes(
              'min-w-0 flex-1 truncate text-[0.83rem] font-bold',
              checked ? 'text-accent' : 'text-ink'
            )}
          >
            {props.category.name}
          </span>
        </span>
        <span class='clamp-2 text-[0.72rem] leading-[1.45] text-muted text-pretty'>
          {props.category.description}
        </span>
      </span>
    </button>
  );
};
