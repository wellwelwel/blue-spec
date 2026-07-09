import { readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { listAgentKeys } from '../../../src/providers/registry.js';
import {
  initInto,
  newWorkspace,
  readManifest,
  updateInto,
} from './__utils__.js';

const claudeCharter = '.claude/skills/lagune.charter/SKILL.md';
const copilotCharter = '.github/prompts/lagune.charter.prompt.md';

await describe('the manifest records every agent installed', async () => {
  await it('keeps a single agent as a string', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    strict.strictEqual((await readManifest(workspace)).agent, 'claude');
  });

  await it('migrates to an array when a second agent is added', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await initInto(workspace, { init: true, agent: 'copilot' });

    const manifest = await readManifest(workspace);

    strict.deepStrictEqual(manifest.agent, ['claude', 'copilot']);
    await stat(join(workspace, claudeCharter));
    await stat(join(workspace, copilotCharter));
    strict(
      Array.isArray(manifest.files) && manifest.files.includes(copilotCharter),
      "the second agent's commands are recorded in files"
    );
  });

  await it('does not duplicate an agent on a repeated init', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await initInto(workspace, { init: true, agent: 'claude' });

    strict.strictEqual((await readManifest(workspace)).agent, 'claude');
  });

  await it('refreshes every recorded agent on update', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await initInto(workspace, { init: true, agent: 'copilot' });

    const claudeShipped = await readFile(
      join(workspace, claudeCharter),
      'utf8'
    );
    const copilotShipped = await readFile(
      join(workspace, copilotCharter),
      'utf8'
    );
    await writeFile(join(workspace, claudeCharter), 'edited', 'utf8');
    await writeFile(join(workspace, copilotCharter), 'edited', 'utf8');

    const before = await readManifest(workspace);

    await updateInto(workspace);

    strict.strictEqual(
      await readFile(join(workspace, claudeCharter), 'utf8'),
      claudeShipped,
      "claude's command is refreshed"
    );
    strict.strictEqual(
      await readFile(join(workspace, copilotCharter), 'utf8'),
      copilotShipped,
      "copilot's command is refreshed"
    );
    strict.deepStrictEqual(
      (await readManifest(workspace)).agent,
      before.agent,
      'the agent list is preserved across update'
    );
  });
});

await describe('re-running init when everything is already installed', async () => {
  await it('skips the agent step without recording a new agent', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    const seeded = {
      ...(await readManifest(workspace)),
      agent: listAgentKeys(),
    };
    await writeFile(
      join(workspace, '.lagune/manifest.json'),
      `${JSON.stringify(seeded, null, 2)}\n`,
      'utf8'
    );

    await initInto(workspace, { init: true });

    strict.deepStrictEqual(
      (await readManifest(workspace)).agent,
      listAgentKeys(),
      'no empty or extra agent is recorded when all are installed'
    );
  });
});
