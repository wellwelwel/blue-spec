import type { Severity } from '../../types/dashboard/dashboard';

export const SEVERITY_ORDER: Severity[] = [
  'Critical',
  'High',
  'Medium',
  'Low',
  'Unranked',
];

export const severityRank = (severity: Severity): number => {
  const index = SEVERITY_ORDER.indexOf(severity);
  return index === -1 ? SEVERITY_ORDER.length : index;
};

export const toSeverity = (value: string | null): Severity =>
  SEVERITY_ORDER.find((severity) => severity === value) ?? 'Unranked';
