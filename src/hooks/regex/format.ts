import type {
  RegexScanResult,
  UnsafeFinding,
} from '../../types/hooks/regex.js';

const EMPTY = 'no unsafe patterns found\n';

const UNSAFE_HEADER = 'Vulnerable regular expressions found:';

const DYNAMIC_HEADER =
  'Dynamically built regular expressions (review manually by simulating a constructed regex):';

const STATIC_WRAP_HEADER =
  'Static regex wrapped in a constructor (use a literal instead):';

const groupByFile = (findings: UnsafeFinding[]): Map<string, string[]> => {
  const groups = new Map<string, string[]>();

  for (const { file, source } of findings) {
    const sources = groups.get(file) ?? [];

    sources.push(source);
    groups.set(file, sources);
  }

  return groups;
};

const groupedSection = (header: string, findings: UnsafeFinding[]): string => {
  const groups = groupByFile(findings);
  const blocks = [...groups.keys()]
    .toSorted((a, b) => a.localeCompare(b))
    .map((file) => {
      const lines = groups
        .get(file)!
        .map((source) => `  ${source}`)
        .join('\n');

      return `${file}\n${lines}`;
    });

  return `${header}\n\n${blocks.join('\n\n')}`;
};

const fileSection = (header: string, files: string[]): string =>
  `${header}\n\n${files.join('\n')}`;

export const format = ({
  unsafe,
  dynamic,
  staticWrap,
}: RegexScanResult): string => {
  const sections: string[] = [];

  if (unsafe.length > 0) sections.push(groupedSection(UNSAFE_HEADER, unsafe));
  if (dynamic.length > 0) sections.push(fileSection(DYNAMIC_HEADER, dynamic));
  if (staticWrap.length > 0)
    sections.push(fileSection(STATIC_WRAP_HEADER, staticWrap));

  if (sections.length === 0) return EMPTY;

  return `${sections.join('\n\n')}\n`;
};
