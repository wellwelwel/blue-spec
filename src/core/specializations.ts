import { join } from 'node:path';
import { SKILLS_CATALOG } from '../hooks/skills/catalog.js';
import { discoverSkills, presentSkillNames } from '../hooks/skills/discover.js';
import { keepPresent, list, merge } from '../hooks/skills/skills.js';
import { writeFileOverwrite } from './fs-actions.js';

export const SPECIALIZATIONS_PATH = '.lagune/specializations.md';

export const renderSpecializations = async (
  targetDir: string
): Promise<string> => {
  const [userCatalog, present] = await Promise.all([
    discoverSkills(targetDir),
    presentSkillNames(targetDir),
  ]);

  await writeFileOverwrite(
    join(targetDir, SPECIALIZATIONS_PATH),
    list(keepPresent(merge(SKILLS_CATALOG, userCatalog), present))
  );

  return SPECIALIZATIONS_PATH;
};
