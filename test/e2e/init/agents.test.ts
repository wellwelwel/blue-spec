import type { CommandFormat } from '../../../src/types/core.js';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { loadAssets } from '../../../src/core/assets.js';
import { SKILL_GROUPS } from '../../../src/hooks/skills/groups.js';
import { getProvider } from '../../../src/providers/registry.js';
import { AGENT_SPECS } from '../../../src/providers/specs.js';
import { initInto, newWorkspace, packageRoot } from './__utils__.js';

const assets = await loadAssets(packageRoot);

const stateFiles = [
  '.lagune/tracking.json',
  '.lagune/skills.json',
  '.lagune/specializations.md',
];

const templateFiles = [
  '.lagune/templates/charter-template.md',
  '.lagune/templates/detect-template.md',
  '.lagune/templates/plan-template.md',
  '.lagune/templates/harden-template.md',
  '.lagune/templates/specialize-template.md',
  '.lagune/templates/proof-template.md',
];

const hookFiles = assets.hooks.map((hook) => `.lagune/hooks/${hook.fileName}`);

const skillFiles = assets.skills.map(
  (skill) => `.lagune/skills/${skill.fileName}`
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
    present: [
      '$ARGUMENTS',
      'name: lagune.charter',
      'user-invocable: true',
      'internal: true',
    ],
    absent: [],
  },
  'copilot-prompt': {
    present: ['$ARGUMENTS', 'name: lagune.charter'],
    absent: ['user-invocable', 'internal: true'],
  },
  markdown: { present: ['$ARGUMENTS'], absent: ['internal: true'] },
  forge: {
    present: ['{{parameters}}'],
    absent: ['$ARGUMENTS', 'internal: true'],
  },
  'gemini-toml': {
    present: ['{{args}}'],
    absent: ['$ARGUMENTS', 'internal: true'],
  },
  'goose-yaml': {
    present: ['{{ args }}'],
    absent: ['$ARGUMENTS', 'internal: true'],
  },
};

for (const spec of AGENT_SPECS) {
  await describe(`init into an empty workspace (${spec.key})`, async () => {
    await it('writes exactly what the provider declares', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, {
        init: true,
        agent: spec.key,
        skills: SKILL_GROUPS.map((group) => group.key),
      });

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
        await readFile(join(workspace, '.lagune/manifest.json'), 'utf8')
      );

      strict.strictEqual(manifest.agent, spec.key, 'the agent is recorded');
      strict.deepStrictEqual(
        manifest.files.slice().sort(),
        expectedFiles.slice().sort(),
        'the manifest lists exactly the created files'
      );
    });

    await it('scaffolds the charter command pointing at its template', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const command = await readFile(
        join(workspace, commandPathFor(spec.key, 'lagune.charter')),
        'utf8'
      );

      strict(
        command.includes('.lagune/templates/charter-template.md'),
        'the template path points into .lagune'
      );
      strict(
        !command.includes('`templates/charter-template.md`'),
        'the bare template path does not leak'
      );
    });

    await it('scaffolds the detect command pointing at its template', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const command = await readFile(
        join(workspace, commandPathFor(spec.key, 'lagune.detect')),
        'utf8'
      );

      strict(
        command.includes('.lagune/templates/detect-template.md'),
        'the detect template path points into .lagune'
      );
      strict(
        !command.includes('`templates/detect-template.md`'),
        'the bare detect template path does not leak'
      );
    });

    await it('scaffolds the plan command pointing at its template', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const command = await readFile(
        join(workspace, commandPathFor(spec.key, 'lagune.plan')),
        'utf8'
      );

      strict(
        command.includes('.lagune/templates/plan-template.md'),
        'the plan template path points into .lagune'
      );
      strict(
        !command.includes('`templates/plan-template.md`'),
        'the bare plan template path does not leak'
      );
    });

    await it('scaffolds the harden command pointing at its template', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const command = await readFile(
        join(workspace, commandPathFor(spec.key, 'lagune.harden')),
        'utf8'
      );

      strict(
        command.includes('.lagune/templates/harden-template.md'),
        'the harden template path points into .lagune'
      );
      strict(
        !command.includes('`templates/harden-template.md`'),
        'the bare harden template path does not leak'
      );
    });

    await it('scaffolds the verify command without a template', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const command = await readFile(
        join(workspace, commandPathFor(spec.key, 'lagune.verify')),
        'utf8'
      );

      strict(
        !command.includes('verify-template.md'),
        'the verify command references no template of its own'
      );
    });

    await it(`uses the ${spec.format} placeholders`, async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const command = await readFile(
        join(workspace, commandPathFor(spec.key, 'lagune.charter')),
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
