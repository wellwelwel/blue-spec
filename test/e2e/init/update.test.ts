import { readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { loadVersion } from '../../../src/core/assets.js';
import {
  initInto,
  newWorkspace,
  packageRoot,
  updateInto,
} from './__utils__.js';

const read = (workspace: string, relativePath: string): Promise<string> =>
  readFile(join(workspace, relativePath), 'utf8');

const charterCommand = '.claude/skills/lagune.charter/SKILL.md';
const charterMemory = '.lagune/memory/charter.md';
const tracking = '.lagune/tracking.json';

await describe('update refreshes managed files to the installed version', async () => {
  await it('overwrites a hand-edited managed command file', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    const shipped = await read(workspace, charterCommand);
    await writeFile(
      join(workspace, charterCommand),
      'user edited this',
      'utf8'
    );

    await updateInto(workspace);

    strict.strictEqual(
      await read(workspace, charterCommand),
      shipped,
      'the managed command should be restored to the shipped content'
    );
  });

  await it('refreshes a built-in sub-skill for an installed category', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });
    const shipped = await read(workspace, '.lagune/skills/regex.md');
    await writeFile(
      join(workspace, '.lagune/skills/regex.md'),
      'edited',
      'utf8'
    );

    await updateInto(workspace);

    strict.strictEqual(
      await read(workspace, '.lagune/skills/regex.md'),
      shipped,
      'an installed built-in sub-skill should be refreshed'
    );
  });

  await it('leaves the memory artifacts and the tracking map untouched', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await writeFile(join(workspace, charterMemory), '# my charter', 'utf8');
    await writeFile(join(workspace, tracking), '{ "mine": true }', 'utf8');

    await updateInto(workspace);

    strict.strictEqual(
      await read(workspace, charterMemory),
      '# my charter',
      'the user charter artifact should survive'
    );
    strict.strictEqual(
      await read(workspace, tracking),
      '{ "mine": true }',
      'the tracking map should survive'
    );
  });

  await it('keeps a user-authored sub-skill while refreshing built-ins', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });
    await writeFile(
      join(workspace, '.lagune/skills/graphql.md'),
      'my own sub-skill',
      'utf8'
    );

    await updateInto(workspace);

    strict.strictEqual(
      await read(workspace, '.lagune/skills/graphql.md'),
      'my own sub-skill',
      'a self-authored sub-skill should never be touched'
    );
  });

  await it('restamps the version and preserves createdAt', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });

    const before: { createdAt: string } = JSON.parse(
      await read(workspace, '.lagune/manifest.json')
    );
    await writeFile(
      join(workspace, '.lagune/manifest.json'),
      JSON.stringify({ ...before, version: '0.0.0-old' }, null, 2),
      'utf8'
    );

    await updateInto(workspace);

    const after: { version: string; createdAt: string; agent: string } =
      JSON.parse(await read(workspace, '.lagune/manifest.json'));
    const version = await loadVersion(packageRoot);

    strict.strictEqual(after.version, version, 'version is restamped');
    strict.strictEqual(
      after.createdAt,
      before.createdAt,
      'the original createdAt is preserved'
    );
    strict.strictEqual(after.agent, 'claude', 'the agent is preserved');
  });

  await it('does nothing in a project that was never initialized', async () => {
    const workspace = await newWorkspace();

    await updateInto(workspace);

    await strict.rejects(
      stat(join(workspace, '.lagune/manifest.json')),
      'no manifest should be written without a prior init'
    );
  });
});
