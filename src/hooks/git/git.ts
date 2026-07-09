import { allowSkillInGitignore } from '../../core/gitignore.js';

const KEEP_SKILL_FLAG = '--keep-skill';

const keepSkill = async (targetDir: string, skill: string): Promise<string> => {
  if (skill.length === 0)
    throw new Error(`${KEEP_SKILL_FLAG} needs a sub-skill name`);

  const outcome = await allowSkillInGitignore(targetDir, skill);

  return outcome === 'unchanged'
    ? `${skill} is already tracked\n`
    : `keeping .lagune/skills/${skill}.md under version control\n`;
};

/** Edits the project .gitignore: --keep-skill <name> re-includes a sub-skill */
export const git = async (
  targetDir: string,
  args: string[]
): Promise<string> => {
  const [flag, value] = args;

  if (flag === KEEP_SKILL_FLAG) return keepSkill(targetDir, value ?? '');

  throw new Error(`git hook expects ${KEEP_SKILL_FLAG} <name>`);
};
