import type { PromptModalContent, TypeSegment } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { useState } from 'preact/hooks';
import { Icon } from '../primitives/icons';
import { PromptAgentModal } from './agent-modal';

const SIDE_QUEST_PROMPT: TypeSegment[] = [
  { text: 'Build a plan to address this recommendation made by Blue Spec:' },
  { text: '\n\n' },
  {
    text: 'The /api/orders/{id} endpoint returns an order to any signed-in user without checking who owns it, so anyone can read orders that belong to other customers by changing the ID in the URL. Add an ownership check before returning the order.',
    bold: true,
  },
];

const SIDE_QUEST_MODAL: PromptModalContent = {
  eyebrow: 'Side quests',
  eyebrowIcon: 'compass',
  title: 'One side quest at a time',
  subtitle: 'Copy this prompt to your agent:',
  banner: 'https://bluespec.weslley.io/img/docs/banner-5.png',
  hint: 'Works with any coding agent',
  prompt: SIDE_QUEST_PROMPT,
};

export const PromptAgentButton = (props: {
  modal?: PromptModalContent;
  robotClass?: string;
}): VNode => {
  const modal = props.modal ?? SIDE_QUEST_MODAL;
  const robotClass = props.robotClass ?? 'text-accent';
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        class='group/eg-host inline-flex h-8 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0'
      >
        <span class={`bs-robot-hop inline-flex text-[1.75rem] ${robotClass}`}>
          <Icon name='messageAi' />
        </span>
        <span class='relative inline-flex items-center gap-1.5 rounded-md border border-line-2 bg-surface-2 px-4 py-1.5 text-[0.7rem] font-bold text-ink-2 transition-colors before:absolute before:top-1/2 before:-left-1.25 before:size-2.5 before:-translate-y-1/2 before:rotate-45 before:rounded-bl-xs before:border-b before:border-l before:border-line-2 before:bg-surface-2 before:transition-colors'>
          Prompt to your agent
          <span class='relative grid size-[0.85rem] flex-none place-items-center overflow-hidden text-[0.85rem]'>
            <span class='col-start-1 row-start-1 inline-flex transition-transform duration-300 ease-house group-hover/eg-host:translate-x-[120%] group-hover/eg-host:translate-y-[-120%]'>
              <Icon name='arrowUpRight' />
            </span>
            <span class='col-start-1 row-start-1 inline-flex text-accent translate-x-[-120%] translate-y-[120%] transition-transform duration-300 ease-house group-hover/eg-host:translate-x-0 group-hover/eg-host:translate-y-0'>
              <Icon name='arrowUpRight' />
            </span>
          </span>
        </span>
      </button>
      {open && <PromptAgentModal onClose={() => setOpen(false)} {...modal} />}
    </>
  );
};
