import type { AdmonitionKind, AdmonitionTone } from '@/types/dashboard/client';
import type { ComponentChildren, VNode } from 'preact';
import { Icon } from './icons';

const TONES: Record<AdmonitionKind, AdmonitionTone> = {
  note: { icon: 'pencil', accent: '[--adm:var(--muted)]' },
  info: { icon: 'info', accent: '[--adm:var(--blue)]' },
  tip: { icon: 'bulb', accent: '[--adm:var(--teal)]' },
  warning: { icon: 'alertTriangle', accent: '[--adm:var(--amber)]' },
  danger: { icon: 'flame', accent: '[--adm:var(--red)]' },
};

export const Admonition = (props: {
  kind: AdmonitionKind;
  title: string;
  meta?: ComponentChildren;
  children: ComponentChildren;
}): VNode => {
  const tone = TONES[props.kind];

  return (
    <div class={`admonition rounded-lg p-4.5 ${tone.accent}`}>
      <div class='mb-2.5 flex flex-wrap items-center justify-between gap-3'>
        <span class='inline-flex items-center gap-2 text-[0.8rem] font-bold uppercase tracking-[0.08em] text-(--adm)'>
          <span class='inline-flex text-[1.2em]'>
            <Icon name={tone.icon} />
          </span>
          {props.title}
        </span>
        {props.meta}
      </div>
      <div class='flex flex-col gap-0.75 text-[0.85rem] leading-[1.6]'>
        {props.children}
      </div>
    </div>
  );
};
