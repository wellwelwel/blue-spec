import type { LanguageId } from './hooks/regex.js';

export type WalkFilter = {
  ignoredDirs: ReadonlySet<string>;
  ignoredDirPatterns: readonly RegExp[];
  accept: (relativePath: string) => boolean;
};

export type ScanFinding = { file: string; detail: string };

export type ScanNote = { file: string; detail: string };

export type ScanReport = {
  findings: ScanFinding[];
  review: ScanNote[];
  advisory: ScanNote[];
};

export type ReportHeadings = {
  sentinel: string;
  findings: string;
  review?: string;
  advisory?: string;
};

export type FileAnalysis = {
  findings: string[];
  review: string[];
  advisory: string[];
};

export type SourceHook = {
  language: LanguageId;
  headings: ReportHeadings;
  findingVerdict: string;
  analyze: (content: string) => FileAnalysis;
  classify: (snippet: string) => string;
};

export type CommentSpec = {
  line: readonly string[];
  block?: readonly [open: string, close: string];
};

export type CommentScan = { text: string; inBlock: boolean };

export type LineRule = { regex: RegExp; detail: string };

export type WindowRule = {
  call: RegExp;
  guard: RegExp;
  window: number;
  detail: string;
};

export type AnalyzedFile = {
  file: string;
  analysis: FileAnalysis;
};
