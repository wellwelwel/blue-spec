import type { Finding } from '@/types/dashboard/dashboard';
import { severityRank } from '@/dashboard/shared/severity';
import { hardenState, verdictKind } from './derive';

export const nextToVerify = (
  findings: Finding[]
): { next: Finding; pending: Finding[]; blocking: number } | null => {
  const pending = findings.filter(
    (finding) =>
      hardenState(finding.status) === 'done' &&
      verdictKind(finding.verdict) === 'pending'
  );
  if (pending.length === 0) return null;

  const dependedOn = new Set(
    findings
      .map((finding) => finding.dependsOn?.id)
      .filter((id): id is string => Boolean(id))
  );
  const [next] = [...pending].sort(
    (left, right) =>
      Number(dependedOn.has(right.id)) - Number(dependedOn.has(left.id)) ||
      severityRank(left.severity) - severityRank(right.severity)
  );
  const blocking = findings.filter(
    (finding) => finding.dependsOn?.id === next.id
  ).length;

  return { next, pending, blocking };
};
