import type { GitignoreOutcome } from '../types/core.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { writeFileOverwrite } from './fs-actions.js';

const SKILLS_EXCLUDE = '/.bluespec/skills/*';

const BLUESPEC_ENTRIES = [
  '/.bluespec/templates/',
  '/.bluespec/hooks/',
  SKILLS_EXCLUDE,
  '/**/bluespec.*',
];

const SECTION_HEADER = '# Blue Spec';

const gitignorePathOf = (cwd: string): string => join(cwd, '.gitignore');

const readGitignore = async (path: string): Promise<string> => {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
};

export const ensureGitignoreEntries = async (
  cwd: string
): Promise<GitignoreOutcome> => {
  const gitignorePath = gitignorePathOf(cwd);
  const existing = await readGitignore(gitignorePath);
  const missing = BLUESPEC_ENTRIES.filter((entry) => !existing.includes(entry));

  if (missing.length === 0) return 'unchanged';

  const block = [SECTION_HEADER, ...missing].join('\n');
  const updated =
    existing.length > 0 ? `${existing.trimEnd()}\n\n${block}\n` : `${block}\n`;

  await writeFileOverwrite(gitignorePath, updated);

  return existing.length === 0 ? 'created' : 'updated';
};

const negationFor = (skill: string): string => `!/.bluespec/skills/${skill}.md`;

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
