import type {
  SelectCategoriesDeps,
  SkillGroup,
} from '../../../src/types/core.js';
import { describe, it, strict } from 'poku';
import { selectCategories } from '../../../src/cli/select-categories.js';

const GROUPS: SkillGroup[] = [
  { key: 'owasp', label: 'OWASP', description: 'OWASP risks' },
  { key: 'python', label: 'Python', description: 'Python risks' },
];

const spyDeps = (
  picked: string[]
): { deps: SelectCategoriesDeps; wasPrompted: () => boolean } => {
  let prompted = false;

  return {
    deps: {
      isInteractive: () => true,
      promptForSkills: () => {
        prompted = true;
        return Promise.resolve(picked);
      },
    },
    wasPrompted: () => prompted,
  };
};

await describe('selectCategories', async () => {
  await it('returns the requested categories without prompting', async () => {
    const { deps, wasPrompted } = spyDeps([]);

    const result = await selectCategories(
      {
        requested: ['owasp'],
        shouldPrompt: true,
        groups: GROUPS,
        preselected: [],
        locked: [],
      },
      deps
    );

    strict.deepStrictEqual(result, ['owasp']);
    strict(!wasPrompted(), 'an explicit request should skip the prompt');
  });

  await it('skips the prompt when every group is already installed', async () => {
    const { deps, wasPrompted } = spyDeps([]);

    const result = await selectCategories(
      {
        requested: [],
        shouldPrompt: true,
        groups: GROUPS,
        preselected: [],
        locked: ['owasp', 'python'],
      },
      deps
    );

    strict(!wasPrompted(), 'the picker should not open when all are locked');
    strict.deepStrictEqual(
      result,
      ['owasp', 'python'],
      'the installed set is returned unchanged'
    );
  });

  await it('still prompts when some groups remain available', async () => {
    const { deps, wasPrompted } = spyDeps(['owasp']);

    await selectCategories(
      {
        requested: [],
        shouldPrompt: true,
        groups: GROUPS,
        preselected: [],
        locked: ['owasp'],
      },
      deps
    );

    strict(
      wasPrompted(),
      'a partly-installed set should still open the picker'
    );
  });
});
