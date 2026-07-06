import type { Hotspot } from '@/types/dashboard/client';
import type { Finding, Severity } from '@/types/dashboard/dashboard';
import { severityRank } from '@/dashboard/shared/severity';

export const hotspots = (findings: Finding[]): Hotspot[] => {
  const pairs = findings.flatMap((finding) =>
    finding.files.map((path) => ({ path, severity: finding.severity }))
  );
  const grouped = new Map<string, Severity[]>();
  for (const { path, severity } of pairs)
    grouped.set(path, [...(grouped.get(path) ?? []), severity]);

  return [...grouped]
    .map(([path, severities]) => ({
      path,
      severities: [...severities].sort(
        (left, right) => severityRank(left) - severityRank(right)
      ),
    }))
    .sort(
      (left, right) =>
        right.severities.length - left.severities.length ||
        severityRank(left.severities[0]) - severityRank(right.severities[0])
    );
};
