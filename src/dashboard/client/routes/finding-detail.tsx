import type {
  AdmonitionKind,
  NavDirection,
  StepHint,
  TypeSegment,
} from '@/types/dashboard/client';
import type { Finding, PhaseName } from '@/types/dashboard/dashboard';
import type { VNode } from 'preact';
import { skillLabel } from '@/dashboard/shared/skill-meta';
import { useRoute } from 'preact-iso';
import { SeverityTag } from '../components/findings/severity';
import { Stepper } from '../components/findings/stepper';
import { Admonition } from '../components/primitives/admonition';
import { Icon } from '../components/primitives/icons';
import { Inline } from '../components/primitives/inline';
import { SectionCard } from '../components/primitives/section-card';
import { PromptAgentButton } from '../components/prompt/agent-button';
import { useData } from '../data/state';
import { chainStep, hardenState, verdictKind } from '../selectors/derive';
import { findingHref } from '../utils/links';
import { LINK } from '../utils/tailwind-classes';

const META_ROW =
  'flex items-start gap-3 border-t border-line px-4.5 py-3 last:pb-4.5';

const chainView = (
  finding: Finding
): { kind: AdmonitionKind; title: string; body: string } => {
  const verdict = verdictKind(finding.verdict);

  if (verdict === 'passed')
    return {
      kind: 'tip',
      title: 'Fix proven',
      body: 'Verify proved this fix holds. Standing it down removes it from the chain and closes the loop.',
    };

  if (verdict === 'reproved')
    return {
      kind: 'danger',
      title: 'Fix reproved',
      body: 'Verify could not prove this fix holds. Run `/bluespec.harden` to rework it, then verify again.',
    };

  const harden = hardenState(finding.status);

  if (harden === 'done')
    return {
      kind: 'tip',
      title: 'Applied, not yet proven',
      body: 'Harden applied this fix, but nothing has proven it holds yet. Run `/bluespec.verify` to prove it and close this finding.',
    };

  if (harden === 'active')
    return {
      kind: 'info',
      title: 'Fix in progress',
      body: 'Harden started this fix but has not finished it. Run `/bluespec.harden` to complete it.',
    };

  if (finding.planned)
    return {
      kind: 'info',
      title: 'Planned, not yet applied',
      body: 'Plan prioritized this finding, but the fix is not applied yet. Run `/bluespec.harden` to apply it.',
    };

  return {
    kind: 'info',
    title: 'Mapped, not yet planned',
    body: 'Detect mapped this finding, but it has no priority or shaped fix yet. Run `/bluespec.plan` to prioritize it and shape the fix.',
  };
};

const fixTitle = (finding: Finding): string =>
  hardenState(finding.status) === 'done' ? 'What changed' : 'Planned fix';

const STEP_HINT: Partial<Record<PhaseName, StepHint>> = {
  Plan: {
    command: '/bluespec.harden',
    verb: 'fix',
    eyebrow: 'Harden this finding',
    eyebrowIcon: 'shield',
    title: 'Fix only this finding',
  },
  Harden: {
    command: '/bluespec.verify',
    verb: 'verify',
    eyebrow: 'Verify this finding',
    eyebrowIcon: 'shieldCheck',
    title: 'Verify only this finding',
  },
};

const stepPrompt = (finding: Finding, hint: StepHint): TypeSegment[] => [
  { text: hint.command, bold: true },
  { text: ` ${hint.verb} only "${finding.name}"` },
  { text: finding.dependsOn ? ' and what it depends on.' : '.' },
];

const NextStepHint = (props: { finding: Finding }): VNode | null => {
  const hint = STEP_HINT[chainStep(props.finding).phase];
  if (!hint) return null;
  return (
    <span class='mt-3 flex'>
      <PromptAgentButton
        robotClass='text-muted'
        modal={{
          eyebrow: hint.eyebrow,
          eyebrowIcon: hint.eyebrowIcon,
          title: hint.title,
          subtitle: 'Copy this prompt to your agent:',
          banner: 'https://bluespec.weslley.io/img/docs/banner-5.png',
          hint: 'Works with any coding agent',
          prompt: stepPrompt(props.finding, hint),
        }}
      />
    </span>
  );
};

const NavLink = (props: {
  direction: NavDirection;
  finding: { id: string; name: string };
}): VNode => {
  const isPrev = props.direction === 'previous';
  const icon = (
    <span class='grid size-11 shrink-0 place-items-center rounded-md bg-surface-2 text-[1.1rem] text-muted transition-colors duration-300 ease-house group-hover:bg-accent group-hover:text-white'>
      <Icon name={isPrev ? 'chevronLeft' : 'chevronRight'} />
    </span>
  );
  const label = (
    <span
      class={`flex min-w-0 flex-col gap-1.5 ${isPrev ? 'items-start' : 'items-end'}`}
    >
      <span class='text-[0.66rem] font-bold uppercase leading-none tracking-[0.08em] text-faint'>
        {isPrev ? 'Previous' : 'Next'}
      </span>
      <span class='max-w-full truncate text-[0.85rem] font-semibold leading-none transition-colors duration-300 ease-house group-hover:text-accent'>
        {props.finding.name}
      </span>
    </span>
  );

  return (
    <a
      class={`group flex min-w-0 items-center gap-4 rounded-lg bg-surface p-4.5 text-ink-2 no-underline shadow-card transition-[box-shadow,translate] duration-300 ease-house hover:-translate-y-px hover:shadow-pop ${isPrev ? '' : 'justify-end'}`}
      href={findingHref(props.finding.id)}
    >
      {isPrev ? (
        <>
          {icon}
          {label}
        </>
      ) : (
        <>
          {label}
          {icon}
        </>
      )}
    </a>
  );
};

export const FindingDetail = (): VNode => {
  const data = useData();
  const { params } = useRoute();
  const index = data.findings.findIndex((finding) => finding.id === params.id);

  if (index < 0)
    return (
      <div class='py-16 text-center text-[0.85rem] text-faint'>
        Finding not found.{' '}
        <a class={LINK} href='/findings'>
          Back to findings
        </a>
      </div>
    );

  const finding = data.findings[index];
  const previous = data.findings[index - 1];
  const next = data.findings[index + 1];
  const chain = chainView(finding);

  return (
    <div key={finding.id} class='route-rise'>
      <nav class='flex items-center gap-2 pb-1 text-[0.8rem] font-semibold text-muted'>
        <a class='text-accent no-underline' href='/findings'>
          Findings
        </a>
        <span class='inline-flex text-[0.9rem] text-faint'>
          <Icon name='chevronRight' />
        </span>
        {finding.severity}
      </nav>

      <Stepper finding={finding} />

      <div class='mt-12 mb-6 flex flex-wrap items-center gap-3.5'>
        <h1 class='text-[1.3rem] font-extrabold tracking-[-0.02em]'>
          {finding.name}
        </h1>
        <SeverityTag severity={finding.severity} />
      </div>

      <div class='flex flex-col gap-4'>
        {finding.whatItIs && (
          <Admonition kind='note' title='What it is'>
            <p class='text-pretty'>
              <Inline text={finding.whatItIs} />
            </p>
            <NextStepHint finding={finding} />
          </Admonition>
        )}
        {finding.whyItMatters && (
          <Admonition
            kind={finding.severity === 'Critical' ? 'danger' : 'warning'}
            title='Why it matters'
          >
            <p class='text-pretty'>
              <Inline text={finding.whyItMatters} />
            </p>
          </Admonition>
        )}
        {finding.fix && (
          <Admonition kind='info' title={fixTitle(finding)}>
            <p class='text-pretty'>
              <Inline text={finding.fix} />
            </p>
            {finding.where && (
              <p class='mt-2.5 text-[0.8rem]'>
                <b class='mr-1'>Where:</b> <Inline text={finding.where} />
              </p>
            )}
          </Admonition>
        )}
        <Admonition kind={chain.kind} title={chain.title}>
          <p class='text-pretty'>
            <Inline text={chain.body} />
          </p>
        </Admonition>

        <SectionCard
          icon='charter'
          tone='bg-accent-soft text-accent'
          title='Upholds'
          blurb='Charter principles this fix upholds.'
          count={finding.upholds.length}
        >
          {finding.upholds.length > 0 ? (
            finding.upholds.map((uphold) => (
              <div class={META_ROW}>
                <span
                  class={`mt-2 size-1.75 flex-none rounded-full ${
                    uphold.baseline ? 'border border-accent' : 'bg-accent'
                  }`}
                />
                <p class='min-w-0 flex-1 text-[0.82rem] leading-[1.55] text-ink-2 text-pretty'>
                  {uphold.full}
                </p>
              </div>
            ))
          ) : (
            <div class={`${META_ROW} text-[0.8rem] italic text-faint`}>
              No principle directly.
            </div>
          )}
        </SectionCard>
        {finding.skills.length > 0 && (
          <SectionCard
            icon='brain'
            tone='bg-blue-soft text-blue'
            title='Surfaced by'
            blurb='The sub-skills that spotted this finding.'
            count={finding.skills.length}
          >
            {finding.skills.map((skill) => (
              <div class={META_ROW}>
                <span class='mt-2 size-1.75 flex-none rounded-full bg-blue' />
                <div class='flex min-w-0 flex-1 flex-col gap-1'>
                  <a
                    class='text-[0.82rem] font-bold text-ink-2 no-underline transition-colors hover:text-accent'
                    href='/skills'
                  >
                    {skillLabel(skill.name)}
                  </a>
                  {skill.surfaced && (
                    <p class='text-[0.8rem] leading-normal text-muted text-pretty'>
                      <Inline text={skill.surfaced} />
                    </p>
                  )}
                </div>
              </div>
            ))}
          </SectionCard>
        )}
        {finding.dependsOn && (
          <SectionCard
            icon='link'
            tone='bg-amber-soft text-amber'
            title='Depends on'
            blurb='Fix that finding first, this one builds on it.'
            count={1}
          >
            <div class={META_ROW}>
              <span class='mt-2 size-1.75 flex-none rounded-full bg-amber' />
              <a
                class='min-w-0 flex-1 text-[0.82rem] font-bold text-accent no-underline hover:underline'
                href={findingHref(finding.dependsOn.id)}
              >
                {finding.dependsOn.name}
              </a>
            </div>
          </SectionCard>
        )}
        <SectionCard
          icon='file'
          tone='bg-surface-2 text-muted'
          title='Files'
          blurb='The paths the tracking map follows for this finding.'
          count={finding.files.length}
        >
          {finding.files.length > 0 ? (
            finding.files.map((file) => (
              <div class={META_ROW}>
                <span class='mt-2 size-1.75 flex-none rounded-full bg-faint' />
                <span class='min-w-0 flex-1 font-mono text-[0.78rem] font-semibold text-ink-2'>
                  {file}
                </span>
              </div>
            ))
          ) : (
            <div class={`${META_ROW} text-[0.8rem] italic text-faint`}>
              No tracked paths yet.
            </div>
          )}
        </SectionCard>

        <nav class='grid grid-cols-2 gap-4'>
          {previous ? (
            <NavLink direction='previous' finding={previous} />
          ) : (
            <span />
          )}
          {next ? <NavLink direction='next' finding={next} /> : <span />}
        </nav>
      </div>
    </div>
  );
};
