import type { FindingTreeRow } from '@/types/dashboard/client';
import type { Severity } from '@/types/dashboard/dashboard';
import type { VNode } from 'preact';
import {
  RowOpenBadge,
  VerdictPill,
} from '../components/findings/finding-table';
import { SeverityDot } from '../components/findings/severity';
import { PageHeader } from '../components/page-header';
import { Admonition } from '../components/primitives/admonition';
import { SectionCard } from '../components/primitives/section-card';
import { query, severityFilter, useData } from '../data/state';
import {
  SEVERITY_FILTERS,
  severityIcon,
  severityTone,
} from '../domain/severity';
import { countsBySeverity } from '../selectors/counts';
import { chainStep } from '../selectors/derive';
import { matchesQuery } from '../selectors/filter';
import { findingTree } from '../selectors/finding-tree';
import { findingHref } from '../utils/links';
import { classes, EMPTY, MICRO_LABEL } from '../utils/tailwind-classes';

const SEVERITY_BLURB: Record<Severity, string> = {
  Critical: 'Exploitable today. Fix these before anything else.',
  High: 'Likely targets. Fix these next.',
  Medium: 'Real risk with less exposure.',
  Low: 'Small risk, still worth closing.',
  Unranked: 'Waiting for Plan to set a priority.',
};

const ROW =
  'grid grid-cols-[minmax(0,1fr)_116px_118px_44px] items-center gap-3 px-4.5';

const DOT_WIDTH = 9;
const ELBOW_WIDTH = 14;
const ELBOW_GAP = 6;
const LEVEL_STEP = DOT_WIDTH / 2 + ELBOW_WIDTH + ELBOW_GAP;
const parentDotCenterX = (depth: number): number =>
  DOT_WIDTH / 2 + (depth - 1) * LEVEL_STEP;

const FindingRow = ({ finding, depth }: FindingTreeRow): VNode => {
  const step = chainStep(finding);

  return (
    <a
      class={`${ROW} group border-t border-line py-3 text-inherit no-underline transition-colors last:pb-4.5 hover:bg-surface-2`}
      href={findingHref(finding.id)}
    >
      <span
        class='flex min-w-0 items-center gap-3'
        style={
          depth > 0 ? `padding-left:${parentDotCenterX(depth)}px` : undefined
        }
      >
        <span class='flex flex-none items-center gap-1.5'>
          {depth > 0 && (
            <span
              class='h-6 w-3.5 flex-none -translate-y-1/2 rounded-bl-md border-b border-l border-line-2'
              aria-hidden='true'
            />
          )}
          <SeverityDot severity={finding.severity} />
        </span>
        <span class='flex min-w-0 flex-col gap-0.5'>
          <span class='truncate text-[0.82rem] font-bold'>{finding.name}</span>
          {(finding.fix || finding.whatItIs) && (
            <span class='truncate text-[0.76rem] text-muted'>
              {finding.fix || finding.whatItIs}
            </span>
          )}
        </span>
      </span>
      <span class='text-[0.8rem] font-semibold text-muted'>{step.phase}</span>
      <span>
        <VerdictPill kind={step.kind} label={step.next} />
      </span>
      <RowOpenBadge />
    </a>
  );
};

const FindingsList = (): VNode => {
  const data = useData();
  const visible = data.findings
    .filter(
      (finding) =>
        severityFilter.value === 'All' ||
        finding.severity === severityFilter.value
    )
    .filter((finding) => matchesQuery(finding, query.value));

  if (visible.length === 0)
    return <div class={EMPTY}>No findings match this filter.</div>;

  return (
    <div class='mt-6 flex flex-col gap-6'>
      {findingTree(visible).map((section) => (
        <SectionCard
          icon={severityIcon(section.severity)}
          tone={severityTone(section.severity)}
          title={section.severity}
          blurb={SEVERITY_BLURB[section.severity]}
          count={section.rows.length}
        >
          <div class={`${ROW} border-t border-line py-2.5 ${MICRO_LABEL}`}>
            <span>Finding</span>
            <span>Phase</span>
            <span>Next</span>
            <span />
          </div>
          {section.rows.map((row) => (
            <FindingRow finding={row.finding} depth={row.depth} />
          ))}
        </SectionCard>
      ))}
    </div>
  );
};

export const Findings = (): VNode => {
  const data = useData();
  const bySeverity = countsBySeverity(data.findings);
  const pills = SEVERITY_FILTERS.filter(
    (filter) => filter === 'All' || bySeverity[filter] > 0
  );

  return (
    <>
      <PageHeader
        background='https://bluespec.weslley.io/img/docs/banner-2.png'
        eyebrow='The chain'
        title='Findings'
        description='Detect → plan → harden → verify · one tracked item each.'
        actions={pills.map((filter) => {
          const on = severityFilter.value === filter;
          const count =
            filter === 'All' ? data.findings.length : bySeverity[filter];
          return (
            <button
              class={classes(
                'inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.25 text-[0.8rem] font-bold transition-[background,border-color,color]',
                on
                  ? 'border-white bg-white text-accent'
                  : 'border-white/30 bg-white/10 text-white hover:border-white/60 hover:bg-white/20'
              )}
              type='button'
              onClick={() => (severityFilter.value = filter)}
            >
              {filter}{' '}
              <span
                class={classes(
                  'tabular-nums',
                  on ? 'text-accent/60' : 'text-white/70'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      />
      <div class='route-rise'>
        <Admonition kind='info' title='What is this?'>
          <p class='text-pretty'>
            These are the security risks Detect mapped in your project, each
            described in plain language: what it is, why it matters, and how to
            fix it.
          </p>
          <p class='text-pretty'>
            Each finding is one tracked item through the chain: Plan prioritizes
            it, Harden applies the fix, and Verify proves the fix holds. A
            finding proven closed is stood down.
          </p>
        </Admonition>
        <div class='mt-4'>
          <Admonition kind='tip' title='Know the terms'>
            <p class='text-pretty'>
              <strong>Blue Spec</strong> tracks what each finding here
              represents:
            </p>
            <ul>
              <li>
                A <strong>security flaw</strong> is a mistake in how the
                software was built or set up that weakens its protection.
              </li>
              <li>
                An <strong>attack vector</strong> is the path an attacker can
                take to reach your system, like a login form, a file upload, or
                a URL the server fetches.
              </li>
              <li>
                A <strong>vulnerability</strong> is a flaw an attacker can
                actually reach through one of those paths.
              </li>
            </ul>
          </Admonition>
        </div>
        <FindingsList />
      </div>
    </>
  );
};
