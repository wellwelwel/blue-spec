import type { Finding, Phase } from '../../../../types/dashboard/dashboard';

export const buildPhases = (
  charter: string | null,
  detect: string | null,
  plan: string | null,
  harden: string | null,
  findings: Finding[]
): Phase[] => [
  { name: 'Charter', state: charter ? 'done' : 'todo' },
  { name: 'Detect', state: detect ? 'done' : 'todo' },
  { name: 'Plan', state: plan ? 'done' : 'todo' },
  { name: 'Harden', state: harden ? 'done' : 'todo' },
  {
    name: 'Verify',
    state: findings.some(
      (finding) => finding.verdict && finding.verdict !== 'Pending'
    )
      ? 'done'
      : 'current',
  },
];
