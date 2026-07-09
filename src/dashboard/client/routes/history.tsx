import type { VNode } from 'preact';
import { SeverityTag } from '../components/findings/severity';
import { PageHeader } from '../components/page-header';
import { Admonition } from '../components/primitives/admonition';
import { Inline } from '../components/primitives/inline';
import { SectionCard } from '../components/primitives/section-card';
import { useData } from '../data/state';
import { BADGE_MUTED, EMPTY } from '../utils/tailwind-classes';

export const History = (): VNode => {
  const items = useData().history;

  return (
    <>
      <PageHeader
        background='https://lagune.weslley.io/img/docs/banner-2.png'
        eyebrow='History'
        title='What the chain has closed'
        description='Findings verify proved closed and stood down. Their live memory is gone, this is the trace they left behind.'
      />

      <div class='route-rise'>
        <Admonition kind='tip' title='Why is this here?'>
          <p class='text-pretty'>
            A proven-closed finding leaves the live chain entirely, that erasure
            is intentional. This log keeps a distilled record so you can still
            see what was resolved and when.
          </p>
        </Admonition>

        {items.length === 0 ? (
          <div class={EMPTY}>
            Nothing stood down yet. Closed findings will land here.
          </div>
        ) : (
          <div class='mt-6'>
            <SectionCard
              icon='checkCircle'
              tone='bg-teal-soft text-teal'
              title='Closed findings'
              blurb='Stood down, out of the chain'
              count={items.length}
            >
              {items.map((item) => (
                <div class='flex flex-col gap-2 border-t border-line px-4.5 py-3'>
                  <div class='flex items-center gap-2.5'>
                    <SeverityTag severity={item.classification} />
                    {item.category && (
                      <span
                        class={`${BADGE_MUTED} min-w-0 shrink uppercase tracking-[0.03em]`}
                        title={item.category}
                      >
                        <span class='truncate'>{item.category}</span>
                      </span>
                    )}
                    <span class='ml-auto flex-none text-[0.75rem] font-semibold tabular-nums text-faint'>
                      {item.closed}
                    </span>
                  </div>
                  <h3 class='text-[0.9rem] font-bold tracking-[-0.01em] text-ink text-pretty'>
                    {item.name}
                  </h3>
                  <p class='text-[0.82rem] leading-[1.55] text-ink-2 text-pretty'>
                    <Inline text={item.whatItIs} />
                  </p>
                </div>
              ))}
            </SectionCard>
          </div>
        )}
      </div>
    </>
  );
};
