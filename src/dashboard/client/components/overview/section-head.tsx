import type { VNode } from 'preact';
import { LINK } from '../../utils/tailwind-classes';
import { Icon } from '../primitives/icons';

export const SectionHead = (props: {
  title: string;
  hint?: string;
  link?: { href: string; label: string };
}): VNode => (
  <div class='mb-3 flex items-center justify-between gap-3'>
    <div class='flex min-w-0 items-baseline gap-2.5'>
      <h2 class='text-[1rem] font-extrabold tracking-[-0.02em]'>
        {props.title}
      </h2>
      {props.hint && (
        <span class='truncate text-[0.76rem] font-semibold text-muted'>
          {props.hint}
        </span>
      )}
    </div>
    {props.link && (
      <a class={`${LINK} flex-none`} href={props.link.href}>
        {props.link.label}
        <span class='inline-flex'>
          <Icon name='arrowRight' />
        </span>
      </a>
    )}
  </div>
);
