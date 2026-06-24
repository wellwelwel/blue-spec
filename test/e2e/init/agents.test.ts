import type { CommandFormat } from '../../../src/types/core.js';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { loadAssets } from '../../../src/core/assets.js';
import { AGENT_SPECS, getProvider } from '../../../src/providers/registry.js';
import { initInto, newWorkspace, packageRoot } from './__utils__.js';

const assets = await loadAssets(packageRoot);

const stateFiles = ['.bluespec/tracking.json', '.bluespec/skills.json'];

const templateFiles = [
  '.bluespec/templates/charter-template.md',
  '.bluespec/templates/detect-template.md',
  '.bluespec/templates/plan-template.md',
  '.bluespec/templates/harden-template.md',
  '.bluespec/templates/verify-template.md',
  '.bluespec/templates/specialize-template.md',
  '.bluespec/templates/proof-template.md',
];

const hookFiles = assets.hooks.map(
  (hook) => `.bluespec/hooks/${hook.fileName}`
);

const skillFiles = assets.skills.map(
  (skill) => `.bluespec/skills/${skill.fileName}`
);

const commandPathsOf = (key: string): string[] =>
  getProvider(key)
    .buildCommands(assets)
    .map((command) => command.relativePath);

const commandPathFor = (key: string, command: string): string => {
  const path = commandPathsOf(key).find((relativePath) =>
    relativePath.includes(command)
  );

  if (path === undefined)
    throw new Error(`${key} should produce a ${command} command`);

  return path;
};

const placeholderExpectations: Record<
  CommandFormat,
  { present: string[]; absent: string[] }
> = {
  skill: {
    present: ['$ARGUMENTS', 'name: bluespec.charter', 'user-invocable: true'],
    absent: [],
  },
  'copilot-prompt': {
    present: ['$ARGUMENTS', 'name: bluespec.charter'],
    absent: ['user-invocable'],
  },
  markdown: { present: ['$ARGUMENTS'], absent: [] },
  forge: { present: ['{{parameters}}'], absent: ['$ARGUMENTS'] },
  'gemini-toml': { present: ['{{args}}'], absent: ['$ARGUMENTS'] },
  'goose-yaml': { present: ['{{ args }}'], absent: ['$ARGUMENTS'] },
};

for (const spec of AGENT_SPECS) {
  await describe(`init into an empty workspace (${spec.key})`, async () => {
    await it('writes exactly what the provider declares', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const expectedFiles = [
        ...templateFiles,
        ...hookFiles,
        ...skillFiles,
        ...stateFiles,
        ...commandPathsOf(spec.key),
      ];

      for (const relativePath of expectedFiles) {
        const file = await stat(join(workspace, relativePath));

        strict(file.isFile(), `${relativePath} should be a file`);
      }

      const manifest: { agent: string; files: string[] } = JSON.parse(
        await readFile(join(workspace, '.bluespec/manifest.json'), 'utf8')
      );

      strict.strictEqual(manifest.agent, spec.key, 'the agent is recorded');
      strict.deepStrictEqual(
        manifest.files.slice().sort(),
        expectedFiles.slice().sort(),
        'the manifest lists exactly the created files'
      );
    });

    await it('rewrites the template path into .bluespec', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const command = await readFile(
        join(workspace, commandPathFor(spec.key, 'bluespec.charter')),
        'utf8'
      );

      strict(
        command.includes('.bluespec/templates/charter-template.md'),
        'the template path points into .bluespec'
      );
      strict(
        !command.includes('`templates/charter-template.md`'),
        'the bare template path does not remain'
      );
    });

    await it('scaffolds the plan command with its template path rewritten', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const command = await readFile(
        join(workspace, commandPathFor(spec.key, 'bluespec.plan')),
        'utf8'
      );

      strict(
        command.includes('.bluespec/templates/plan-template.md'),
        'the plan template path points into .bluespec'
      );
      strict(
        !command.includes('`templates/plan-template.md`'),
        'the bare plan template path does not remain'
      );
    });

    await it('scaffolds the harden command with its template path rewritten', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const command = await readFile(
        join(workspace, commandPathFor(spec.key, 'bluespec.harden')),
        'utf8'
      );

      strict(
        command.includes('.bluespec/templates/harden-template.md'),
        'the harden template path points into .bluespec'
      );
      strict(
        !command.includes('`templates/harden-template.md`'),
        'the bare harden template path does not remain'
      );
    });

    await it('scaffolds the verify command with its template path rewritten', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const command = await readFile(
        join(workspace, commandPathFor(spec.key, 'bluespec.verify')),
        'utf8'
      );

      strict(
        command.includes('.bluespec/templates/verify-template.md'),
        'the verify template path points into .bluespec'
      );
      strict(
        !command.includes('`templates/verify-template.md`'),
        'the bare verify template path does not remain'
      );
    });

    await it(`uses the ${spec.format} placeholders`, async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const command = await readFile(
        join(workspace, commandPathFor(spec.key, 'bluespec.charter')),
        'utf8'
      );

      const { present, absent } = placeholderExpectations[spec.format];

      for (const token of present)
        strict(command.includes(token), `${token} should be present`);

      for (const token of absent)
        strict(!command.includes(token), `${token} should not be present`);
    });
  });
}
