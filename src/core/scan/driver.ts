import type {
  AnalyzedFile,
  FileAnalysis,
  ScanReport,
  WalkFilter,
} from '../../types/scan.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { walk } from './walk.js';

const readText = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
};

const isPresent = (entry: AnalyzedFile | null): entry is AnalyzedFile =>
  entry !== null;

const details = (
  analyzed: AnalyzedFile[],
  pick: (analysis: FileAnalysis) => string[]
): { file: string; detail: string }[] =>
  analyzed.flatMap(({ file, analysis }) =>
    pick(analysis).map((detail) => ({ file, detail }))
  );

export const scanReport = async (
  root: string,
  targets: string[],
  filter: WalkFilter,
  analyze: (file: string, content: string) => FileAnalysis
): Promise<ScanReport> => {
  const walked = await Promise.all(
    targets.map((target) => walk(root, target, filter))
  );
  const files = [...new Set(walked.flat())].toSorted((a, b) =>
    a.localeCompare(b)
  );
  const analyzed = await Promise.all(
    files.map(async (file): Promise<AnalyzedFile | null> => {
      const content = await readText(join(root, file));

      return content === null
        ? null
        : { file, analysis: analyze(file, content) };
    })
  );
  const present = analyzed.filter(isPresent);

  return {
    findings: details(present, (analysis) => analysis.findings),
    review: details(present, (analysis) => analysis.review),
    advisory: details(present, (analysis) => analysis.advisory),
  };
};
