import type { Counts } from '@/types/dashboard/client';
import type { Finding, Phase, Severity } from '@/types/dashboard/dashboard';
import { hardenState, verdictKind } from './derive';

export const countFindings = (findings: Finding[]): Counts => ({
  total: findings.length,
  applied: findings.filter((finding) => hardenState(finding.status) === 'done')
    .length,
  verified: findings.filter(
    (finding) => verdictKind(finding.verdict) === 'passed'
  ).length,
});

export const countsBySeverity = (
  findings: Finding[]
): Record<Severity, number> => {
  const counts: Record<Severity, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Unranked: 0,
  };
  for (const finding of findings) counts[finding.severity] += 1;
  return counts;
};

export const phasePercent = (phases: Phase[]): number => {
  if (phases.length === 0) return 0;
  const done = phases.filter((phase) => phase.state === 'done').length;
  return Math.round((done / phases.length) * 100);
};
