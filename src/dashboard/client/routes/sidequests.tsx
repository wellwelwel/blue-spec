import type { PhaseMeta } from '@/types/dashboard/client';
import type { SideQuestPhase } from '@/types/dashboard/dashboard';
import type { VNode } from 'preact';
import { BANNER_CHIP, PageHeader } from '../components/page-header';
import { Admonition } from '../components/primitives/admonition';
import { Inline } from '../components/primitives/inline';
import { SectionCard } from '../components/primitives/section-card';
import { PromptAgentButton } from '../components/prompt/agent-button';
import { useData } from '../data/state';
import { EMPTY } from '../utils/tailwind-classes';

const PHASE_META: Record<SideQuestPhase, PhaseMeta> = {
  Detect: {
    label: 'Detect',
    blurb: 'Clear it and Detect maps the system more accurately.',
    icon: 'search',
    tile: 'bg-blue-soft text-blue',
    dot: 'bg-blue',
    badge: 'bg-blue-soft text-blue',
  },
  Plan: {
    label: 'Plan',
    blurb: 'Clear it and Plan prioritizes the right fixes.',
    icon: 'layers',
    tile: 'bg-accent-soft text-accent',
    dot: 'bg-accent',
    badge: 'bg-accent-soft text-accent',
  },
  Harden: {
    label: 'Harden',
    blurb: 'Clear it and Harden applies fixes with more confidence.',
    icon: 'shield',
    tile: 'bg-amber-soft text-amber',
    dot: 'bg-amber',
    badge: 'bg-amber-soft text-amber',
  },
};

const PHASE_ORDER: SideQuestPhase[] = ['Detect', 'Plan', 'Harden'];

export const SideQuests = (): VNode => {
  const data = useData();
  const items = data.sidequests;

  return (
    <>
      <PageHeader
        background='https://bluespec.weslley.io/img/docs/banner-2.png'
        eyebrow='Side Quests'
        title='Optional runs that level up the chain'
        description="Objectives outside Blue Spec's main quest. It won't clear them for you, but completing one makes the phase it feeds land better."
        actions={
          <span class={BANNER_CHIP}>
            Quests
            <span class='tabular-nums text-white/70'>{items.length}</span>
          </span>
        }
      />

      <div class='route-rise'>
        <Admonition kind='info' title='What is this?'>
          <p class='text-pretty'>
            These are optional objectives it spotted while reading your project,
            outside Blue Spec's scope by nature.
          </p>
          <p class='text-pretty'>
            For example: Blue Spec doesn't write your tests, but when they
            exist, Harden applies fixes with far more confidence and less
            regression risk.
          </p>
        </Admonition>

        {items.length === 0 ? (
          <div class={EMPTY}>
            No side quests. The chain cleared everything on its own.
          </div>
        ) : (
          <div class='mt-6 flex flex-col gap-6'>
            {PHASE_ORDER.map((phase) => {
              const group = items.filter((item) => item.phase === phase);
              if (group.length === 0) return null;
              const meta = PHASE_META[phase];

              return (
                <SectionCard
                  icon={meta.icon}
                  tone={meta.tile}
                  title={meta.label}
                  blurb={meta.blurb}
                  count={group.length}
                >
                  {group.map((item) => (
                    <div class='flex items-start gap-3 border-t border-line px-4.5 py-3'>
                      <span
                        class={`mt-2 size-1.75 flex-none rounded-full ${meta.dot}`}
                      />
                      <p class='min-w-0 flex-1 text-[0.82rem] leading-[1.55] text-ink-2 text-pretty'>
                        <Inline text={item.text} />
                      </p>
                    </div>
                  ))}
                  <div class='px-4.5 py-2.5 last:pb-4'>
                    <PromptAgentButton />
                  </div>
                </SectionCard>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
