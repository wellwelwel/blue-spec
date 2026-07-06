import type { Skill } from '../../../../types/dashboard/dashboard';
import { skillLabel } from '../../../shared/skill-meta';
import { parseSkills } from '../parsers';

export const buildSkills = (
  detect: string | null,
  installed: string[]
): Skill[] => {
  const applied = parseSkills(detect);
  const appliedByName = new Map(applied.map((skill) => [skill.name, skill]));

  const rest = installed
    .filter((name) => !appliedByName.has(name))
    .sort((left, right) => left.localeCompare(right))
    .map<Skill>((name) => ({
      name,
      label: skillLabel(name),
      applied: false,
    }));

  return [...applied, ...rest];
};
