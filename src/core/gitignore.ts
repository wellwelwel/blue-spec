import type { GitignoreOutcome } from '../types/core.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { writeFileOverwrite } from './fs-actions.js';

const SKILLS_EXCLUDE = '/.lagune/skills/*';

const LAGUNE_ENTRIES = [
  '/.lagune/templates/',
  '/.lagune/hooks/',
  '/.lagune/proofs/',
  '/.lagune/specializations.md',
  SKILLS_EXCLUDE,
  '/**/lagune.*',
  '/**/lagune/',
];

const SECTION_HEADER = '# Lagune';

const gitignorePathOf = (cwd: string): string => join(cwd, '.gitignore');

const readGitignore = async (path: string): Promise<string> => {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
};

const isLaguneLine = (line: string): boolean =>
  LAGUNE_ENTRIES.includes(line) || line.startsWith('!/.lagune/skills/');

const lastLaguneIndex = (lines: string[]): number =>
  lines.reduce((last, line, index) => (isLaguneLine(line) ? index : last), -1);

const insertMissingInBlock = (existing: string, missing: string[]): string => {
  const lines = existing.trimEnd().split('\n');
  const at = lastLaguneIndex(lines);
  const merged = [
    ...lines.slice(0, at + 1),
    ...missing,
    ...lines.slice(at + 1),
  ];

  return `${merged.join('\n')}\n`;
};

const appendNewBlock = (existing: string, missing: string[]): string => {
  const block = [SECTION_HEADER, ...missing].join('\n');

  return existing.length > 0
    ? `${existing.trimEnd()}\n\n${block}\n`
    : `${block}\n`;
};

export const ensureGitignoreEntries = async (
  cwd: string
): Promise<GitignoreOutcome> => {
  const gitignorePath = gitignorePathOf(cwd);
  const existing = await readGitignore(gitignorePath);
  const missing = LAGUNE_ENTRIES.filter((entry) => !existing.includes(entry));

  if (missing.length === 0) return 'unchanged';

  const updated = existing.includes(SECTION_HEADER)
    ? insertMissingInBlock(existing, missing)
    : appendNewBlock(existing, missing);

  await writeFileOverwrite(gitignorePath, updated);

  return existing.length === 0 ? 'created' : 'updated';
};

const negationFor = (skill: string): string => `!/.lagune/skills/${skill}.md`;

const insertAfterExclude = (lines: string[], negation: string): string[] => {
  const at = lines.indexOf(SKILLS_EXCLUDE);

  return [...lines.slice(0, at + 1), negation, ...lines.slice(at + 1)];
};

export const allowSkillInGitignore = async (
  cwd: string,
  skill: string
): Promise<GitignoreOutcome> => {
  await ensureGitignoreEntries(cwd);

  const gitignorePath = gitignorePathOf(cwd);
  const existing = await readGitignore(gitignorePath);
  const negation = negationFor(skill);

  if (existing.includes(negation)) return 'unchanged';

  const lines = existing.replace(/\n$/, '').split('\n');
  const updated = `${insertAfterExclude(lines, negation).join('\n')}\n`;

  await writeFileOverwrite(gitignorePath, updated);

  return 'updated';
};
