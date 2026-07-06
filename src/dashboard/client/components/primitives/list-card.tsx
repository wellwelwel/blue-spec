import type { ComponentChildren, VNode } from 'preact';
import { CARD } from '../../utils/tailwind-classes';

export const ListCard = (props: { children: ComponentChildren }): VNode => (
  <div class={`scroll-none max-h-45.5 flex-1 overflow-y-auto ${CARD}`}>
    {props.children}
  </div>
);

export const ListRow = (props: {
  title?: string;
  children: ComponentChildren;
}): VNode => (
  <div
    class='flex items-center gap-3 border-t border-line px-4.5 py-3 first:border-t-0 first:pt-4.5 last:pb-4.5'
    title={props.title}
  >
    {props.children}
  </div>
);
