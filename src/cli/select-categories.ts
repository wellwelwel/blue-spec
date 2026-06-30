import type {
  SelectCategoriesDeps,
  SelectCategoriesInput,
} from '../types/core.js';
import { isInteractive, promptForSkills } from './prompt.js';

const defaultDeps: SelectCategoriesDeps = { isInteractive, promptForSkills };

const allLocked = (input: SelectCategoriesInput): boolean =>
  input.groups.length > 0 &&
  input.groups.every((group) => input.locked.includes(group.key));

export const selectCategories = async (
  input: SelectCategoriesInput,
  deps: SelectCategoriesDeps = defaultDeps
): Promise<string[]> => {
  if (input.requested.length > 0) return input.requested;

  if (!input.shouldPrompt || !deps.isInteractive()) return [];

  if (allLocked(input)) return input.locked;

  return deps.promptForSkills(input.groups, {
    preselected: input.preselected,
    locked: input.locked,
  });
};
