import type { VNode } from 'preact';
import { Icon } from './icons';

export const SearchField = (props: {
  placeholder: string;
  query: string;
  onQuery: (value: string) => void;
}): VNode => (
  <label class='mb-4 flex h-11 items-center gap-2.5 rounded-lg border border-line-2 bg-surface-2 px-3.5 transition-[border-color,background-color] duration-200 focus-within:border-accent/45 focus-within:bg-accent-100'>
    <span class='inline-flex text-[1.1rem] text-faint'>
      <Icon name='search' />
    </span>
    <input
      class='min-w-0 flex-1 border-0 bg-transparent text-[0.85rem] text-ink outline-none placeholder:text-faint'
      type='search'
      placeholder={props.placeholder}
      autocomplete='off'
      spellcheck={false}
      value={props.query}
      onInput={(event) => props.onQuery(event.currentTarget.value)}
    />
  </label>
);
