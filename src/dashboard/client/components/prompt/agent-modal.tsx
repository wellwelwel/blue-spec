import type { PromptModalContent, TypeSegment } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { AGENT_REPLY } from '@/dashboard/shared/skill-meta';
import { useEffect, useState } from 'preact/hooks';
import { GLYPH_SWAP } from '../../utils/tailwind-classes';
import { agentThemeAt } from '../agent-themes';
import { Icon } from '../primitives/icons';
import { MaskIcon } from '../primitives/mask-icon';
import { Modal } from '../primitives/modal';
import { TypedText } from './typed-text';

const AGENT_CHIPS = [0, 1, 2, 3, 4]
  .map(agentThemeAt)
  .filter((theme) => !theme.coloredIcon)
  .slice(0, 4);

const HINT =
  'col-start-1 row-start-1 text-[0.72rem] font-semibold transition-opacity duration-300';

const THINKING_DOTS_HOLD_MS = 700;

const Segments = (props: { parts: TypeSegment[]; strong: string }): VNode => (
  <>
    {props.parts.map((part) =>
      part.bold ? <span class={props.strong}>{part.text}</span> : part.text
    )}
  </>
);

export const PromptAgentModal = (
  props: PromptModalContent & { onClose: () => void }
): VNode => {
  const [copied, setCopied] = useState(false);
  const [promptDone, setPromptDone] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyDone, setReplyDone] = useState(false);

  useEffect(() => {
    if (!promptDone) {
      setReplying(false);
      return;
    }
    const timer = setTimeout(() => setReplying(true), THINKING_DOTS_HOLD_MS);
    return () => clearTimeout(timer);
  }, [promptDone]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    const text = props.prompt.map((part) => part.text).join('');
    void navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopied(true);
  };

  return (
    <Modal onClose={props.onClose} label={props.title}>
      <div class='relative flex-none overflow-hidden bg-banner px-6 py-5 text-white'>
        <img
          class='pointer-events-none absolute inset-0 z-0 size-full object-cover mask-[linear-gradient(to_right,transparent,rgba(0,0,0,0.35)_38%,black)]'
          src={props.banner}
          alt=''
          aria-hidden='true'
        />
        <span class='pointer-events-none absolute inset-0 z-1 bg-linear-to-r from-banner via-banner/85 to-banner/40' />
        <div class='relative z-2'>
          <div class='flex items-start justify-between gap-4'>
            <span class='flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-white/82'>
              <span class='inline-flex text-[0.95rem]'>
                <Icon name={props.eyebrowIcon} />
              </span>
              {props.eyebrow}
            </span>
            <button
              class='relative -mt-2 -mr-2 grid size-9 cursor-pointer place-items-center rounded-full text-[1.1rem] text-white/80 transition-[color,background-color] duration-200 after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-1/2 hover:bg-white/15 hover:text-white'
              type='button'
              aria-label='Close'
              onClick={props.onClose}
            >
              <Icon name='x' />
            </button>
          </div>
          <h2 class='mt-1 text-[1.25rem] font-extrabold leading-[1.15] tracking-[-0.02em]'>
            {props.title}
          </h2>
          <p class='mt-1.5 text-[0.85rem] text-white/90'>{props.subtitle}</p>
        </div>
      </div>

      <div class='flex flex-col gap-4 bg-canvas pl-2 pr-6 py-6'>
        <div class='flex flex-col items-end gap-1'>
          <div class='grid max-w-[85%] rounded-xl rounded-br-[3px] px-4 py-4 text-left text-[0.84rem] leading-[1.6] whitespace-pre-wrap text-white shadow-[0_1px_2px_rgba(18,22,45,0.2),0_4px_10px_-6px_rgba(18,22,45,0.4)] [background:linear-gradient(180deg,#1f7bff_0%,var(--color-accent)_100%)]'>
            <p class='invisible col-start-1 row-start-1' aria-hidden='true'>
              <Segments parts={props.prompt} strong='font-bold' />
            </p>
            <p
              class={`col-start-1 row-start-1 [&_.typed-cursor]:text-white ${
                promptDone ? '[&_.typed-cursor]:hidden' : ''
              }`}
            >
              <TypedText
                segments={props.prompt}
                strong='font-bold'
                typeSpeed={5}
                startDelay={100}
                onDone={() => setPromptDone(true)}
              />
            </p>
          </div>
          <span class='pr-1 text-[0.62rem] font-semibold text-muted'>You</span>
        </div>

        <div
          class={`flex items-start gap-2.5 transition-[opacity,translate] duration-300 ease-house ${
            promptDone ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
          }`}
        >
          <span class='grid size-7 flex-none place-items-center rounded-full bg-accent-soft text-[0.95rem] text-accent'>
            <Icon name='robot' />
          </span>
          <span class='flex flex-col items-start gap-1'>
            <span class='text-[0.74rem] font-bold text-ink'>Your agent</span>
            <span class='flex items-center gap-1 rounded-xl rounded-tl-[3px] bg-surface px-3 py-2.5 shadow-card'>
              {replying ? (
                <span
                  class={`text-left text-[0.84rem] leading-[1.5] text-ink [&_.typed-cursor]:text-ink ${
                    replyDone ? '[&_.typed-cursor]:hidden' : ''
                  }`}
                >
                  <TypedText
                    segments={AGENT_REPLY}
                    strong='font-semibold'
                    typeSpeed={45}
                    startDelay={80}
                    onDone={() => setReplyDone(true)}
                  />
                </span>
              ) : (
                <>
                  <span class='size-1.5 rounded-full bg-muted animate-[lagune-typing_1.1s_ease-in-out_infinite]' />
                  <span class='size-1.5 rounded-full bg-muted animate-[lagune-typing_1.1s_ease-in-out_0.15s_infinite]' />
                  <span class='size-1.5 rounded-full bg-muted animate-[lagune-typing_1.1s_ease-in-out_0.3s_infinite]' />
                </>
              )}
            </span>
          </span>
        </div>
      </div>

      <div class='flex items-center justify-between gap-3 border-t border-line-2 px-6 py-3.5 bg-surface'>
        <span class='flex min-w-0 items-center gap-2.5'>
          <span class='flex flex-none -space-x-1.5'>
            {AGENT_CHIPS.map((theme) => (
              <span class='grid size-6 place-items-center rounded-full bg-accent-soft ring-2 ring-surface'>
                <MaskIcon src={theme.icon} class='size-3 bg-accent' />
              </span>
            ))}
            <span class='grid size-6 place-items-center rounded-full bg-accent-soft text-[0.75rem] text-accent ring-2 ring-surface'>
              <Icon name='plus' />
            </span>
          </span>
          <span class='grid min-w-0'>
            <span
              class={`${HINT} text-muted ${copied ? 'opacity-0' : 'opacity-100'}`}
            >
              {props.hint}
            </span>
            <span
              class={`${HINT} text-accent ${copied ? 'opacity-100' : 'opacity-0'}`}
              aria-live='polite'
            >
              Copied, paste it in your agent's chat
            </span>
          </span>
        </span>
        <span class='group/copy relative flex-none'>
          <button
            class='lagune-cta relative grid size-10 cursor-pointer place-items-center overflow-hidden rounded-md text-[1rem] text-white transition-shadow duration-300 ease-out [background:linear-gradient(180deg,#1f7bff_0%,var(--color-accent)_100%)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.35),0_2px_6px_-2px_rgba(0,0,0,0.35)] hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.45),0_6px_14px_-4px_rgba(0,0,0,0.4)] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2'
            type='button'
            aria-label={copied ? 'Copied' : 'Copy prompt'}
            onClick={copy}
          >
            <span class='grid [text-shadow:0_1px_1px_rgba(0,0,0,0.5)]'>
              <span
                class={`${GLYPH_SWAP} ${copied ? 'scale-[0.25] opacity-0 blur-xs' : 'scale-100 opacity-100 blur-0'}`}
              >
                <Icon name='copy' />
              </span>
              <span
                class={`${GLYPH_SWAP} ${copied ? 'scale-100 opacity-100 blur-0' : 'scale-[0.25] opacity-0 blur-xs'}`}
              >
                <Icon name='check' />
              </span>
            </span>
          </button>
          <span class='pointer-events-none absolute bottom-[calc(100%+0.375rem)] right-0 translate-y-1 scale-95 whitespace-nowrap rounded-sm bg-dark px-2 py-1 text-[0.68rem] font-bold text-white opacity-0 transition-[opacity,scale,translate] duration-200 ease-house group-hover/copy:translate-y-0 group-hover/copy:scale-100 group-hover/copy:opacity-100'>
            Copy this prompt
          </span>
        </span>
      </div>
    </Modal>
  );
};
