import type { SkillCatalogEntry, SkillsCatalogFile } from '../../types/core.js';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const USER_CATALOG_PATH = '.lagune/skills.json';
const SKILLS_DIR = '.lagune/skills';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isValidEntry = (value: Record<string, unknown>): boolean =>
  typeof value.name === 'string' &&
  isStringArray(value.tags) &&
  (value.groups === undefined || isStringArray(value.groups));

const toEntry = (value: Record<string, unknown>): SkillCatalogEntry => ({
  name: String(value.name),
  tags: isStringArray(value.tags) ? [...value.tags] : [],
  groups: isStringArray(value.groups) ? [...value.groups] : [],
});

const asRecords = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null
      )
    : [];

const parseUserCatalog = (raw: string): SkillCatalogEntry[] => {
  const parsed: Partial<SkillsCatalogFile> = JSON.parse(raw);

  return asRecords(parsed.entries).filter(isValidEntry).map(toEntry);
};

/** Reads the user's own sub-skills from .lagune/skills.json, failing closed to [] */
export const discoverSkills = async (
  targetDir: string
): Promise<SkillCatalogEntry[]> => {
  try {
    const raw = await readFile(join(targetDir, USER_CATALOG_PATH), 'utf8');

    return parseUserCatalog(raw);
  } catch {
    return [];
  }
};

/** The sub-skill names whose .lagune/skills/<name>.md file is present, failing closed to [] */
export const presentSkillNames = async (
  targetDir: string
): Promise<string[]> => {
  try {
    const entries = await readdir(join(targetDir, SKILLS_DIR));

    return entries
      .filter((entry) => entry.endsWith('.md'))
      .map((entry) => entry.slice(0, -'.md'.length));
  } catch {
    return [];
  }
};
