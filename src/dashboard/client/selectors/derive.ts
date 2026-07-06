import type {
  ChainStep,
  HardenState,
  PipelineStep,
  StepState,
  VerdictKind,
} from '@/types/dashboard/client';
import type { Finding } from '@/types/dashboard/dashboard';

export const verdictKind = (verdict: string | null): VerdictKind => {
  if (!verdict || /^pending$/i.test(verdict)) return 'pending';
  if (/reprov|fail|open|block/i.test(verdict)) return 'reproved';
  return 'passed';
};

export const hardenState = (status: string): HardenState => {
  if (/^applied$/i.test(status)) return 'done';
  if (/partial/i.test(status)) return 'active';
  return 'pending';
};

export const chainStep = (finding: Finding): ChainStep => {
  const kind = verdictKind(finding.verdict);
  if (kind === 'passed') return { phase: 'Verify', next: 'Stand down', kind };
  if (kind === 'reproved') return { phase: 'Verify', next: 'Harden', kind };
  if (hardenState(finding.status) === 'done')
    return { phase: 'Harden', next: 'Verify', kind };
  if (finding.planned) return { phase: 'Plan', next: 'Harden', kind };
  return { phase: 'Detect', next: 'Plan', kind };
};

const VERIFY_STEP_STATE: Record<VerdictKind, StepState> = {
  pending: 'pending',
  reproved: 'reproved',
  passed: 'done',
};

export const pipeline = (finding: Finding): PipelineStep[] => {
  const harden = hardenState(finding.status);
  const verdict = verdictKind(finding.verdict);
  const verifyState = VERIFY_STEP_STATE[verdict];
  return [
    { label: 'Detect', detail: 'Mapped', state: 'done' },
    {
      label: 'Plan',
      detail: finding.planned ? 'Prioritised' : 'Pending',
      state: finding.planned ? 'done' : 'pending',
    },
    { label: 'Harden', detail: finding.status, state: harden },
    {
      label: 'Verify',
      detail: finding.verdict ?? 'Pending',
      state: verifyState,
    },
  ];
};
