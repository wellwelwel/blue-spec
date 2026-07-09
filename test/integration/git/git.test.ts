import { describe, it, strict } from 'poku';
import { git } from '../../../src/hooks/git/git.js';
import { newWorkspace, readGitignore } from './__utils__.js';

await describe('the git hook', async () => {
  await it('routes --keep-skill to a re-include in .gitignore', async () => {
    const workspace = await newWorkspace();

    const output = await git(workspace, ['--keep-skill', 'graphql']);

    strict(output.includes('graphql'), 'reports the kept sub-skill');
    strict(
      (await readGitignore(workspace)).includes('!/.lagune/skills/graphql.md'),
      'the sub-skill is re-included'
    );
  });

  await it('reports a no-op for a sub-skill already kept', async () => {
    const workspace = await newWorkspace();

    await git(workspace, ['--keep-skill', 'graphql']);
    const output = await git(workspace, ['--keep-skill', 'graphql']);

    strict(output.includes('already tracked'), 'reports the no-op');
  });

  await it('rejects --keep-skill with no name', async () => {
    const workspace = await newWorkspace();

    await strict.rejects(git(workspace, ['--keep-skill']), /sub-skill name/);
  });

  await it('rejects an unknown flag', async () => {
    const workspace = await newWorkspace();

    await strict.rejects(git(workspace, ['--bogus']), /--keep-skill/);
  });
});
