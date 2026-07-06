import type { VerdictKind } from '@/types/dashboard/client';
import type { Finding } from '@/types/dashboard/dashboard';
import type { VNode } from 'preact';
import { verdictKind } from '../../selectors/derive';
import { findingHref } from '../../utils/links';
import { BADGE, MICRO_LABEL, VPILL_TONE } from '../../utils/tailwind-classes';
import { Icon } from '../primitives/icons';
import { SeverityDot, SeverityTag } from './severity';

const ROW =
  'grid grid-cols-[minmax(0,1fr)_132px_116px_118px_44px] items-center gap-3 px-4.5';

export const VerdictPill = (props: {
  kind: VerdictKind;
  label: string;
}): VNode => (
  <span class={`${BADGE} font-bold ${VPILL_TONE[props.kind]}`}>
    {props.label}
  </span>
);

export const RowOpenBadge = (): VNode => (
  <span class='ml-auto grid size-8.5 place-items-center rounded-full bg-surface-2 text-[0.95rem] text-accent transition-colors group-hover:bg-accent group-hover:text-white'>
    <Icon name='arrowUpRight' />
  </span>
);

const FindingRow = (props: { finding: Finding }): VNode => {
  const { finding } = props;
  return (
    <a
      class={`${ROW} group border-t border-line py-3 text-inherit no-underline transition-colors last:pb-4.5 hover:bg-surface-2`}
      href={findingHref(finding.id)}
    >
      <span class='flex min-w-0 items-center gap-3'>
        <SeverityDot severity={finding.severity} />
        <span class='min-w-0 truncate text-[0.82rem] font-bold'>
          {finding.name}
        </span>
      </span>
      <span>
        <SeverityTag severity={finding.severity} />
      </span>
      <span class='text-[0.8rem] font-semibold text-muted'>
        {finding.status}
      </span>
      <span>
        <VerdictPill
          kind={verdictKind(finding.verdict)}
          label={finding.verdict ?? 'Pending'}
        />
      </span>
      <RowOpenBadge />
    </a>
  );
};

export const FindingTable = (props: { findings: Finding[] }): VNode => (
  <div class='overflow-hidden rounded-lg bg-surface shadow-card'>
    <div class={`${ROW} pt-4.5 pb-3 ${MICRO_LABEL}`}>
      <span>Finding</span>
      <span>Severity</span>
      <span>Harden</span>
      <span>Verify</span>
      <span />
    </div>
    <div class='scroll-none max-h-44.25 overflow-y-auto'>
      {props.findings.map((finding) => (
        <FindingRow finding={finding} />
      ))}
    </div>
  </div>
);
