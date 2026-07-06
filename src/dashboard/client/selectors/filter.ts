import type { Finding } from '@/types/dashboard/dashboard';

export const matchesQuery = (finding: Finding, query: string): boolean => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    finding.name.toLowerCase().includes(needle) ||
    finding.severity.toLowerCase().includes(needle) ||
    finding.files.some((file) => file.toLowerCase().includes(needle))
  );
};
