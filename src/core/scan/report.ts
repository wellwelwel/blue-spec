import type {
  ReportHeadings,
  ScanFinding,
  ScanNote,
  ScanReport,
} from '../../types/scan.js';

const groupByFile = (
  items: (ScanFinding | ScanNote)[]
): Map<string, string[]> => {
  const groups = new Map<string, string[]>();

  for (const { file, detail } of items) {
    const details = groups.get(file) ?? [];

    details.push(detail);
    groups.set(file, details);
  }

  return groups;
};

const section = (header: string, items: (ScanFinding | ScanNote)[]): string => {
  const groups = groupByFile(items);
  const blocks = [...groups.keys()]
    .toSorted((a, b) => a.localeCompare(b))
    .map((file) => {
      const lines = groups
        .get(file)!
        .map((detail) => `  ${detail}`)
        .join('\n');

      return `${file}\n${lines}`;
    });

  return `${header}\n\n${blocks.join('\n\n')}`;
};

export const formatReport = (
  report: ScanReport,
  headings: ReportHeadings
): string => {
  const sections: string[] = [];

  if (report.findings.length > 0)
    sections.push(section(headings.findings, report.findings));

  if (report.review.length > 0 && headings.review !== undefined)
    sections.push(section(headings.review, report.review));

  if (report.advisory.length > 0 && headings.advisory !== undefined)
    sections.push(section(headings.advisory, report.advisory));

  if (sections.length === 0) return headings.sentinel;

  return `${sections.join('\n\n')}\n`;
};
