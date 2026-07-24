import type { LanguageId } from '../../types/hooks/regex.js';
import type { FileAnalysis } from '../../types/scan.js';
import { languageOf } from './language.js';

const EMPTY: FileAnalysis = { findings: [], review: [], advisory: [] };

export const forLanguage =
  (language: LanguageId, analyze: (content: string) => FileAnalysis) =>
  (file: string, content: string): FileAnalysis =>
    languageOf(file) === language ? analyze(content) : EMPTY;
