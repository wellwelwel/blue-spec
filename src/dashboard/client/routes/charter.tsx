import type { PromptSpec } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { BANNER_CHIP, PageHeader } from '../components/page-header';
import { Admonition } from '../components/primitives/admonition';
import { CopyButton } from '../components/primitives/copy-button';
import { Icon } from '../components/primitives/icons';
import { Inline } from '../components/primitives/inline';
import { PromptPreview } from '../components/prompt/preview';
import { useData } from '../data/state';
import { BADGE_MUTED, EMPTY } from '../utils/tailwind-classes';

const CHARTER_PROMPT: PromptSpec = {
  task: 'Create a login page.',
  mention: '@.bluespec/memory/charter.md',
  readPath: 'charter.md',
  tone: 'tip',
  reply: [{ text: 'On it!' }],
};

export const Charter = (): VNode => {
  const data = useData();
  const { principles, baseline } = data.charter;

  const fixesFor = (name: string): number =>
    data.findings.filter((finding) =>
      finding.upholds.some((uphold) => uphold.full === name)
    ).length;
  const mostFixes = Math.max(
    1,
    ...principles.map((principle) => fixesFor(principle.name))
  );

  return (
    <>
      <PageHeader
        background='https://bluespec.weslley.io/img/docs/banner-3.png'
        eyebrow='Governance'
        title='Charter'
        description={`The governing principles every phase respects · v${data.version}.`}
        actions={
          <span class={BANNER_CHIP}>
            Principles
            <span class='tabular-nums text-white/70'>{principles.length}</span>
          </span>
        }
      />

      <div class='route-rise'>
        <Admonition kind='info' title='What is this?'>
          <p class='text-pretty'>
            The charter is the set of security rules designed to fit the nature
            and purpose of your project.
          </p>
          <p class='text-pretty'>
            Think of it as the <code>AGENTS.md</code> of{' '}
            <strong>Blue Spec</strong>: every phase reads and follows it.
          </p>
        </Admonition>

        <div class='group/eg-host mt-4'>
          <Admonition kind='tip' title='Safety everywhere'>
            <p class='text-pretty'>
              Tag the charter file in your prompt so your agent follows the
              security rules from development onward:{' '}
              <code>@.bluespec/memory/charter.md</code>{' '}
              <CopyButton
                text='@.bluespec/memory/charter.md'
                label='Copy charter path'
                inline
              />
            </p>
            <div class='mt-1.5'>
              <PromptPreview spec={CHARTER_PROMPT} seed={2} />
            </div>
          </Admonition>
        </div>

        <div class='mt-6 mb-3 flex items-center justify-between'>
          <div class='flex items-center gap-2.5'>
            <h2 class='text-[1rem] font-extrabold tracking-[-0.02em]'>
              Principles
            </h2>
            <span class={BADGE_MUTED}>Project Scope</span>
          </div>
        </div>
        <div class='mt-6 mb-6 grid grid-cols-2 gap-4 min-[1720px]:grid-cols-3'>
          {principles.length === 0 ? (
            <div class={EMPTY}>No principles.</div>
          ) : (
            principles.map((principle, index) => {
              const numeral =
                principle.name.match(/^([IVXLC]+)\./)?.[1] ?? String(index + 1);
              const title = principle.name.replace(/^([IVXLC]+)\.\s*/, '');
              const fixes = fixesFor(principle.name);
              return (
                <article class='flex min-h-37.5 items-start gap-4 rounded-lg bg-surface p-4.5 shadow-card'>
                  <span class='grid size-11 flex-none place-items-center rounded-md bg-accent-soft text-[0.9rem] font-extrabold text-accent'>
                    {numeral}
                  </span>
                  <div class='flex min-w-0 flex-1 flex-col gap-2.5'>
                    <div>
                      <h3 class='mb-2 text-[0.9rem] font-bold tracking-[-0.01em]'>
                        {title}
                      </h3>
                      <p class='max-w-[78ch] text-[0.85rem] leading-[1.55] text-muted'>
                        <Inline text={principle.rule} />
                      </p>
                    </div>
                    <div class='mt-auto flex items-center gap-2.5'>
                      <span class='block h-1.25 flex-1 overflow-hidden rounded-full bg-surface-3'>
                        <span
                          class='block h-full rounded-full bg-accent'
                          style={`width:${Math.round((fixes / mostFixes) * 100)}%`}
                        />
                      </span>
                      <span class='flex-none text-[0.76rem] font-bold tabular-nums'>
                        {fixes} {fixes === 1 ? 'fix' : 'fixes'}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {baseline.items.length > 0 && (
          <section class='mb-6'>
            <div class='mb-3 flex items-center justify-between'>
              <div class='flex items-center gap-2.5'>
                <h2 class='text-[1rem] font-extrabold tracking-[-0.02em]'>
                  Baseline discipline
                </h2>
                <span class={BADGE_MUTED}>Universal</span>
              </div>
            </div>
            {baseline.intro && (
              <p class='mb-3 max-w-[74ch] text-[0.9rem] text-muted'>
                <Inline text={baseline.intro} />
              </p>
            )}
            <div class='grid grid-cols-3 gap-4 max-[1180px]:grid-cols-2'>
              {baseline.items.map((item) => (
                <article class='min-h-[150px] rounded-lg bg-surface p-4.5 shadow-card'>
                  <div class='mb-2.5 flex items-center gap-2.5'>
                    <span class='grid size-8.5 place-items-center rounded-sm bg-accent-soft text-[1.05rem] text-accent'>
                      <Icon name='shieldCheck' />
                    </span>
                    <h4 class='text-[0.82rem] font-bold'>{item.name}</h4>
                  </div>
                  {item.rule && (
                    <p class='text-[0.85rem] leading-[1.55] text-muted'>
                      <Inline text={item.rule} />
                    </p>
                  )}
                  {item.bullets.length > 0 && (
                    <ul class='mt-2.5 flex list-disc flex-col gap-1.5 pl-4.5 marker:text-blue'>
                      {item.bullets.map((bullet) => (
                        <li class='text-[0.85rem] text-muted'>
                          <Inline text={bullet} />
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
};
