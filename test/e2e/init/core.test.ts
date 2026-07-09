import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { initInto, newWorkspace, packageRoot } from './__utils__.js';

await describe('init scaffolds the agent-agnostic core', async () => {
  await it('creates an empty memory directory', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    const entries = await readdir(join(workspace, '.lagune/memory'));

    strict.strictEqual(entries.length, 0, 'memory should be empty');
  });

  await it('copies the templates byte-for-byte from the package', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    for (const template of [
      'charter-template.md',
      'detect-template.md',
      'plan-template.md',
      'harden-template.md',
    ]) {
      const source = await readFile(
        new URL(`spec/templates/${template}`, packageRoot),
        'utf8'
      );
      const scaffolded = await readFile(
        join(workspace, `.lagune/templates/${template}`),
        'utf8'
      );

      strict.strictEqual(scaffolded, source, `${template} should match`);
    }
  });

  await it('copies the sub-skills byte-for-byte from the package', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });

    for (const skill of ['regex.md']) {
      const source = await readFile(
        new URL(`spec/skills/${skill}`, packageRoot),
        'utf8'
      );
      const scaffolded = await readFile(
        join(workspace, `.lagune/skills/${skill}`),
        'utf8'
      );

      strict.strictEqual(scaffolded, source, `${skill} should match`);
    }
  });

  await it('renders a command for both skill and markdown agents', async () => {
    const skillWorkspace = await newWorkspace();
    await initInto(skillWorkspace, { init: true, agent: 'claude' });
    await stat(join(skillWorkspace, '.claude/skills/lagune.charter/SKILL.md'));

    const markdownWorkspace = await newWorkspace();
    await initInto(markdownWorkspace, { init: true, agent: 'opencode' });
    await stat(join(markdownWorkspace, '.opencode/commands/lagune.charter.md'));
  });

  await it('creates an empty tracking map at init', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    const tracking: { name: string; entries: unknown[] } = JSON.parse(
      await readFile(join(workspace, '.lagune/tracking.json'), 'utf8')
    );

    strict.strictEqual(tracking.name, 'lagune');
    strict.deepStrictEqual(tracking.entries, [], 'entries should start empty');
  });

  await it('creates an empty sub-skills catalog at init', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    const catalog: { name: string; entries: unknown[] } = JSON.parse(
      await readFile(join(workspace, '.lagune/skills.json'), 'utf8')
    );

    strict.strictEqual(catalog.name, 'lagune');
    strict.deepStrictEqual(catalog.entries, [], 'entries should start empty');
  });
});
