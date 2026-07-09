import type {
  BundledAssets,
  FileOutcome,
  SkillsChange,
} from '../types/core.js';
import { join } from 'node:path';
import { SKILLS_CATALOG } from '../hooks/skills/catalog.js';
import { SKILL_GROUPS } from '../hooks/skills/groups.js';
import {
  assertKnownCategories,
  groupKeysForSkill,
  skillNamesForGroups,
} from '../hooks/skills/skills.js';
import { appendUnique } from './collections.js';
import {
  ensureDir,
  removeFileIfPresent,
  writeFileIfAbsent,
} from './fs-actions.js';

const SKILLS_DIR = '.lagune/skills';

const relativePath = (name: string): string => `${SKILLS_DIR}/${name}`;

export const selectSkillAssets = (
  assets: BundledAssets,
  keys: string[]
): BundledAssets['skills'] => {
  const chosen = new Set(
    skillNamesForGroups(SKILLS_CATALOG, keys).map((name) => `${name}.md`)
  );

  return assets.skills.filter((skill) => chosen.has(skill.fileName));
};

export const addSkills = async (
  targetDir: string,
  assets: BundledAssets,
  installed: string[],
  categories: string[]
): Promise<SkillsChange> => {
  assertKnownCategories(SKILL_GROUPS, categories);

  const jobs = selectSkillAssets(assets, categories);
  if (jobs.length === 0) return { outcomes: [], categories: installed };

  await ensureDir(join(targetDir, SKILLS_DIR));

  const outcomes = await Promise.all(
    jobs.map(async (skill): Promise<FileOutcome> => {
      const path = relativePath(skill.fileName);
      const outcome = await writeFileIfAbsent(
        join(targetDir, path),
        skill.contents
      );

      return { path, status: outcome.status };
    })
  );

  return { outcomes, categories: appendUnique(installed, categories) };
};

export const removeSkills = async (
  targetDir: string,
  installed: string[],
  categories: string[]
): Promise<SkillsChange> => {
  assertKnownCategories(SKILL_GROUPS, categories);

  const remaining = installed.filter((key) => !categories.includes(key));
  const names = skillNamesForGroups(SKILLS_CATALOG, categories);

  const outcomes = await Promise.all(
    names.map(async (name): Promise<FileOutcome> => {
      const path = relativePath(`${name}.md`);
      const keptBy = groupKeysForSkill(SKILLS_CATALOG, name, remaining);

      if (keptBy.length > 0) return { path, status: 'kept', keptBy: keptBy[0] };

      const outcome = await removeFileIfPresent(join(targetDir, path));

      return { path, status: outcome.status };
    })
  );

  return { outcomes, categories: remaining };
};
