import type { AgentSpec, CommandFormat } from '../../../src/types/core.js';
import { readFile, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { describe, it, strict } from 'poku';
import { loadAssets } from '../../../src/core/assets.js';
import { getProvider } from '../../../src/providers/registry.js';
import { AGENT_SPECS } from '../../../src/providers/specs.js';
import { initInto, newWorkspace, packageRoot } from './__utils__.js';

const assets = await loadAssets(packageRoot);

const commandPathsOf = (key: string): string[] =>
  getProvider(key)
    .buildCommands(assets)
    .map((command) => command.relativePath);

const rootCommandPath = (spec: AgentSpec): string => {
  const paths = commandPathsOf(spec.key);
  const roots = paths.filter((relativePath) => {
    const name =
      spec.layout === 'skill'
        ? basename(relativePath.slice(0, relativePath.lastIndexOf('/')))
        : basename(relativePath, spec.extension ?? '.md');

    return name === 'lagune';
  });

  strict.strictEqual(
    roots.length,
    1,
    `${spec.key} should declare exactly one root /lagune command, found ${roots.length}`
  );

  return roots[0];
};

const rootNameToken: Record<CommandFormat, string> = {
  skill: 'name: lagune\n',
  'copilot-prompt': 'name: lagune\n',
  markdown: '',
  forge: '',
  'gemini-toml': '',
  'goose-yaml': 'title: "lagune"',
};

const placeholderToken: Record<CommandFormat, string> = {
  skill: '$ARGUMENTS',
  'copilot-prompt': '$ARGUMENTS',
  markdown: '$ARGUMENTS',
  forge: '{{parameters}}',
  'gemini-toml': '{{args}}',
  'goose-yaml': '{{ args }}',
};

for (const spec of AGENT_SPECS) {
  await describe(`the root /lagune command (${spec.key})`, async () => {
    await it('renders with the bare name, never lagune.lagune', () => {
      const path = rootCommandPath(spec);

      strict(
        !path.includes('lagune.lagune'),
        `${path} must not double the prefix`
      );
    });

    await it('is distinct from every phase command', () => {
      const rootPath = rootCommandPath(spec);
      const others = commandPathsOf(spec.key).filter(
        (relativePath) => relativePath !== rootPath
      );

      strict(others.length > 0, 'the phase commands are still declared');

      for (const other of others)
        strict(
          other !== rootPath,
          `${other} collides with the root command path`
        );
    });

    await it('scaffolds into the workspace and enters the manifest', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const rootPath = rootCommandPath(spec);
      const file = await stat(join(workspace, rootPath));

      strict(file.isFile(), `${rootPath} should be a file`);

      const manifest: { files: string[] } = JSON.parse(
        await readFile(join(workspace, '.lagune/manifest.json'), 'utf8')
      );

      strict(
        manifest.files.includes(rootPath),
        `the manifest should list ${rootPath}`
      );
    });

    await it('carries the right name and placeholder for its format', async () => {
      const workspace = await newWorkspace();

      await initInto(workspace, { init: true, agent: spec.key });

      const contents = await readFile(
        join(workspace, rootCommandPath(spec)),
        'utf8'
      );

      const nameToken = rootNameToken[spec.format];

      if (nameToken.length > 0) {
        strict(
          contents.includes(nameToken),
          `${spec.key} should render the bare name (${nameToken.trim()})`
        );
        strict(
          !contents.includes('lagune.lagune'),
          'the doubled name must not appear in the rendered command'
        );
      }

      strict(
        contents.includes(placeholderToken[spec.format]),
        `${spec.key} should carry the ${spec.format} argument placeholder`
      );
    });
  });
}
