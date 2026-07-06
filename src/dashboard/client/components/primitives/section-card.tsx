import type { IconName } from '@/types/dashboard/client';
import type { ComponentChildren, VNode } from 'preact';
import {
  BADGE,
  CARD,
  CARD_BLURB,
  CARD_TITLE,
  TILE_SM,
} from '../../utils/tailwind-classes';
import { Icon } from './icons';

export const SectionCard = (props: {
  icon: IconName;
  tone: string;
  title: string;
  blurb: string;
  count: number;
  children: ComponentChildren;
}): VNode => (
  <section class={`overflow-hidden ${CARD}`}>
    <div class='flex items-center gap-3 px-4.5 pt-4.5 pb-3'>
      <span class={`${TILE_SM} ${props.tone}`}>
        <Icon name={props.icon} />
      </span>
      <div class='flex min-w-0 flex-1 items-baseline gap-2.5'>
        <h2 class={CARD_TITLE}>{props.title}</h2>
        <span class={CARD_BLURB}>{props.blurb}</span>
      </div>
      <span class={`${BADGE} flex-none font-bold tabular-nums ${props.tone}`}>
        {props.count}
      </span>
    </div>
    {props.children}
  </section>
);
