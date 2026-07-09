import { readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { loadVersion } from '../../../src/core/assets.js';
import { initInto, newWorkspace, packageRoot, pullInto } from './__utils__.js';

const read = (workspace: string, relativePath: string): Promise<string> =>
  readFile(join(workspace, relativePath), 'utf8');

const remove = (workspace: string, relativePath: string): Promise<void> =>
  rm(join(workspace, relativePath), { recursive: true, force: true });

const charterCommand = '.claude/skills/lagune.charter/SKILL.md';
const charterMemory = '.lagune/memory/charter.md';
const tracking = '.lagune/tracking.json';
const skillsCatalog = '.lagune/skills.json';
const regexSkill = '.lagune/skills/regex.md';
const userSkill = '.lagune/skills/graphql.md';
const specializations = '.lagune/specializations.md';

const stripGenerated = async (workspace: string): Promise<void> => {
  await remove(workspace, '.lagune/templates');
  await remove(workspace, '.lagune/hooks');
  await remove(workspace, regexSkill);
  await remove(workspace, specializations);
  await remove(workspace, '.claude/skills/lagune.charter');
};

await describe('pull rebuilds generated files from a committed manifest', async () => {
  await it('restores the generated files a clone is missing', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });
    const shippedCommand = await read(workspace, charterCommand);
    const shippedSkill = await read(workspace, regexSkill);

    await stripGenerated(workspace);
    await pullInto(workspace);

    strict.strictEqual(
      await read(workspace, charterCommand),
      shippedCommand,
      'an agent command is reconstructed'
    );
    strict.strictEqual(
      await read(workspace, regexSkill),
      shippedSkill,
      'an installed built-in sub-skill is reconstructed'
    );
    strict(
      (await read(workspace, specializations)).length > 0,
      'the internal specializations listing is rebuilt'
    );
  });

  await it('leaves committed user state untouched', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });
    await writeFile(join(workspace, charterMemory), '# my charter', 'utf8');
    await writeFile(join(workspace, tracking), '{ "mine": true }', 'utf8');
    await writeFile(join(workspace, skillsCatalog), '{ "mine": true }', 'utf8');
    await writeFile(join(workspace, userSkill), 'my own sub-skill', 'utf8');

    await stripGenerated(workspace);
    await pullInto(workspace);

    strict.strictEqual(
      await read(workspace, charterMemory),
      '# my charter',
      'the user charter artifact survives'
    );
    strict.strictEqual(
      await read(workspace, tracking),
      '{ "mine": true }',
      'the tracking map survives'
    );
    strict.strictEqual(
      await read(workspace, skillsCatalog),
      '{ "mine": true }',
      'the user catalog survives'
    );
    strict.strictEqual(
      await read(workspace, userSkill),
      'my own sub-skill',
      'a self-authored sub-skill is never touched'
    );
  });

  await it('does not restamp the manifest version', async () => {
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
      JSON.stringify({ ...before, version: '0.0.0-clone' }, null, 2),
      'utf8'
    );

    await stripGenerated(workspace);
    await pullInto(workspace);

    const after: { version: string } = JSON.parse(
      await read(workspace, '.lagune/manifest.json')
    );
    const version = await loadVersion(packageRoot);

    strict.strictEqual(
      after.version,
      '0.0.0-clone',
      'pull reconstructs the committed version, never the package version'
    );
    strict.notStrictEqual(
      after.version,
      version,
      'pull does not bump to the running package version'
    );
  });

  await it('repairs a missing .gitignore on pull', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await remove(workspace, '.gitignore');

    await pullInto(workspace);

    const contents = await read(workspace, '.gitignore');
    strict(
      contents.includes('/.lagune/skills/*'),
      'the Lagune block is restored'
    );
  });

  await it('rebuilds the commands of every recorded agent', async () => {
    const workspace = await newWorkspace();
    const copilotCharter = '.github/prompts/lagune.charter.prompt.md';

    await initInto(workspace, { init: true, agent: 'claude' });
    await initInto(workspace, { init: true, agent: 'copilot' });

    await remove(workspace, '.claude/skills/lagune.charter');
    await remove(workspace, copilotCharter);
    await pullInto(workspace);

    await stat(join(workspace, charterCommand));
    await stat(join(workspace, copilotCharter));
  });

  await it('does nothing in a project that was never initialized', async () => {
    const workspace = await newWorkspace();

    await pullInto(workspace);

    await strict.rejects(
      stat(join(workspace, '.lagune/manifest.json')),
      'no manifest is written without a prior init'
    );
  });
});
