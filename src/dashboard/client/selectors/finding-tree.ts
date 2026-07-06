import type { FindingTreeRow } from '@/types/dashboard/client';
import type { Finding, Severity } from '@/types/dashboard/dashboard';
import { SEVERITY_ORDER } from '@/dashboard/shared/severity';

export const findingTree = (
  visible: Finding[]
): { severity: Severity; rows: FindingTreeRow[] }[] => {
  const byId = new Map(visible.map((finding) => [finding.id, finding]));
  const children = new Map<string, Finding[]>();
  const roots: Finding[] = [];

  for (const finding of visible) {
    const parent = finding.dependsOn
      ? byId.get(finding.dependsOn.id)
      : undefined;
    if (parent && parent.id !== finding.id) {
      children.set(parent.id, [...(children.get(parent.id) ?? []), finding]);
    } else {
      roots.push(finding);
    }
  }

  const rowsBySeverity: Record<Severity, FindingTreeRow[]> = {
    Critical: [],
    High: [],
    Medium: [],
    Low: [],
    Unranked: [],
  };
  const seen = new Set<string>();
  const collectOnce = (
    finding: Finding,
    depth: number,
    rows: FindingTreeRow[]
  ): void => {
    if (seen.has(finding.id)) return;
    seen.add(finding.id);
    rows.push({ finding, depth });
    for (const child of children.get(finding.id) ?? [])
      collectOnce(child, depth + 1, rows);
  };

  for (const root of roots) collectOnce(root, 0, rowsBySeverity[root.severity]);
  for (const strandedInCycle of visible)
    collectOnce(strandedInCycle, 0, rowsBySeverity[strandedInCycle.severity]);

  return SEVERITY_ORDER.map((severity) => ({
    severity,
    rows: rowsBySeverity[severity],
  })).filter((section) => section.rows.length > 0);
};
