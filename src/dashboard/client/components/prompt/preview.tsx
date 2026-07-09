import type {
  AgentTheme,
  PromptSpec,
  PromptTone,
} from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { classes } from '../../utils/tailwind-classes';
import { agentThemeAt } from '../agent-themes';
import { HoverPopover } from '../primitives/hover-popover';
import { Icon } from '../primitives/icons';
import { MaskIcon } from '../primitives/mask-icon';
import { TypedText } from './typed-text';

const REPLY_ACTIONS = [
  'copy',
  'play',
  'thumbsUp',
  'thumbsDown',
  'refresh',
] as const;

const TRIGGER_TONES: Record<PromptTone, string> = {
  neutral:
    'px-2.5 text-muted group-hover/eg:bg-accent-soft group-hover/eg:text-accent',
  tip: 'text-teal/100 group-hover/eg:text-teal',
};

const AgentReply = ({
  spec,
  theme,
  active,
}: {
  spec: PromptSpec;
  theme: AgentTheme;
  active: boolean;
}): VNode => {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) setDone(false);
  }, [active]);

  return (
    <span class='flex translate-y-1 items-start gap-2.5 opacity-0 transition-[opacity,translate] delay-150 duration-300 ease-house group-data-[open=true]/pop:translate-y-0 group-data-[open=true]/pop:opacity-100'>
      {theme.coloredIcon ? (
        <img src={theme.icon} alt='' class='mt-0.5 size-5 flex-none' />
      ) : (
        <MaskIcon
          src={theme.icon}
          class={classes('mt-0.5 size-5 flex-none', theme.avatar)}
        />
      )}
      <span class='flex min-w-0 flex-col items-start'>
        <span class={classes('text-[0.74rem] font-bold', theme.agentName)}>
          {theme.name}
        </span>
        <span class='mt-2 flex translate-y-1 items-center gap-2 opacity-0 transition-[opacity,translate] delay-300 duration-300 ease-house group-data-[open=true]/pop:translate-y-0 group-data-[open=true]/pop:opacity-100'>
          <span
            class={classes('size-2 flex-none rounded-full', theme.readDot)}
          />
          <span class={classes('font-bold text-[0.74rem]', theme.readLabel)}>
            Read
          </span>
          <span
            class={classes('truncate font-mono text-[0.72rem]', theme.readPath)}
          >
            {spec.readPath}
          </span>
        </span>
        <span
          class={classes(
            'mt-3 text-left text-[0.78rem] leading-relaxed',
            theme.body,
            theme.cursor,
            done && '[&_.typed-cursor]:hidden'
          )}
        >
          <TypedText
            segments={spec.reply}
            strong={classes('font-semibold', theme.bodyStrong)}
            typeSpeed={45}
            startDelay={500}
            active={active}
            onDone={() => setDone(true)}
          />
        </span>
        <span
          class={classes(
            'mt-3 flex items-center gap-0.5 transition-opacity duration-200',
            theme.actions,
            done ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
        >
          {REPLY_ACTIONS.map((action) => (
            <span
              class={classes(
                'grid size-6 place-items-center rounded-md text-[0.82rem] transition-colors',
                theme.actionsHover
              )}
            >
              <Icon name={action} />
            </span>
          ))}
        </span>
      </span>
    </span>
  );
};

export const PromptPreview = ({
  spec,
  seed,
}: {
  spec: PromptSpec;
  seed: number;
}): VNode => {
  const theme = agentThemeAt(seed);
  return (
    <HoverPopover
      width={364}
      triggerClass='group/eg relative inline-flex'
      panelClass={classes(
        'overflow-hidden rounded-[15px]',
        theme.panel,
        theme.ring,
        theme.shadow
      )}
      trigger={
        <span
          class={classes(
            'inline-flex h-8 cursor-help items-center gap-1.5 rounded-sm text-[0.8rem] font-bold transition-colors',
            TRIGGER_TONES[spec.tone ?? 'neutral']
          )}
        >
          <span class='lagune-robot-hop inline-flex text-[1.25rem]'>
            <Icon name='messageAi' />
          </span>
          Hover me
        </span>
      }
    >
      {(open) => (
        <>
          <span class='flex gap-1.5 px-4 pt-3.5 pb-1'>
            <span class='size-3 rounded-full bg-[#ff5f57]' />
            <span class='size-3 rounded-full bg-[#febc2e]' />
            <span class='size-3 rounded-full bg-[#28c840]' />
          </span>
          <span class='flex flex-col gap-4 px-6 pt-3 pb-6'>
            <span class='flex translate-y-1 flex-col items-end gap-1 opacity-0 transition-[opacity,translate] duration-300 ease-house group-data-[open=true]/pop:translate-y-0 group-data-[open=true]/pop:opacity-100'>
              <span
                class={classes(
                  'flex max-w-[86%] flex-col gap-1.5 rounded-xl rounded-br-[3px] px-3.5 py-2.5 text-left text-[0.78rem] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_10px_-6px_rgba(0,0,0,0.5)]',
                  theme.userBubble,
                  theme.userText
                )}
              >
                <span>{spec.task}</span>
                <span>
                  Use{' '}
                  <span class={classes('font-bold', theme.mention)}>
                    {spec.mention}
                  </span>
                </span>
              </span>
              <span
                class={classes(
                  'pr-1 text-[0.62rem] font-semibold tabular-nums',
                  theme.userLabel
                )}
              >
                You
              </span>
            </span>
            <AgentReply spec={spec} theme={theme} active={open} />
          </span>
        </>
      )}
    </HoverPopover>
  );
};
