import { describe, it, strict } from 'poku';
import {
  applyManifestChange,
  readManifestAgents,
  readManifestCategories,
  recordManifestInstall,
  serializeAgents,
} from '../../../src/core/manifest.js';
import {
  newWorkspace,
  readManifest,
  seedManifest,
  writeManifest,
} from './__utils__.js';

const now = new Date('2026-01-01T00:00:00.000Z');

await describe('readManifestCategories', async () => {
  await it('returns [] when the manifest is absent', async () => {
    strict.deepStrictEqual(
      await readManifestCategories(await newWorkspace()),
      []
    );
  });

  await it('returns [] when the manifest is malformed JSON', async () => {
    const workspace = await newWorkspace();
    await writeManifest(workspace, 'not json{');

    strict.deepStrictEqual(await readManifestCategories(workspace), []);
  });

  await it('returns [] when categories is missing', async () => {
    const workspace = await newWorkspace();
    await writeManifest(
      workspace,
      JSON.stringify({ name: 'lagune', files: [] })
    );

    strict.deepStrictEqual(await readManifestCategories(workspace), []);
  });

  await it('returns [] when categories is not a string array', async () => {
    const workspace = await newWorkspace();
    await writeManifest(
      workspace,
      JSON.stringify({ name: 'lagune', categories: [1, 2, 3] })
    );

    strict.deepStrictEqual(await readManifestCategories(workspace), []);
  });

  await it('returns the categories array when present', async () => {
    const workspace = await newWorkspace();
    await seedManifest(workspace, { categories: ['owasp'] });

    strict.deepStrictEqual(await readManifestCategories(workspace), ['owasp']);
  });
});

await describe('applyManifestChange', async () => {
  await it('creates a minimal manifest when none exists', async () => {
    const workspace = await newWorkspace();

    await applyManifestChange(
      workspace,
      {
        categories: ['owasp'],
        addFiles: ['.lagune/skills/regex.md', '.lagune/skills/network.md'],
        removeFiles: [],
      },
      { version: '9.9.9', now }
    );

    const manifest = await readManifest(workspace);

    strict.strictEqual(manifest.name, 'lagune');
    strict.strictEqual(manifest.version, '9.9.9');
    strict.strictEqual(manifest.agent, '');
    strict.strictEqual(manifest.createdAt, '2026-01-01T00:00:00.000Z');
    strict.deepStrictEqual(manifest.categories, ['owasp']);
    strict.deepStrictEqual(manifest.files, [
      '.lagune/skills/regex.md',
      '.lagune/skills/network.md',
    ]);
  });

  await it('preserves other fields when the manifest exists', async () => {
    const workspace = await newWorkspace();
    await seedManifest(workspace, {
      files: ['.lagune/templates/x.md', '.lagune/skills/regex.md'],
    });

    await applyManifestChange(
      workspace,
      {
        categories: [],
        addFiles: [],
        removeFiles: ['.lagune/skills/regex.md'],
      },
      { version: '9.9.9', now }
    );

    const manifest = await readManifest(workspace);

    strict.strictEqual(manifest.agent, 'claude');
    strict.strictEqual(manifest.version, '1.0.0');
    strict.strictEqual(manifest.createdAt, '2020-01-01T00:00:00.000Z');
    strict.deepStrictEqual(manifest.categories, []);
    strict.deepStrictEqual(manifest.files, ['.lagune/templates/x.md']);
  });

  await it('merges addFiles without duplicating', async () => {
    const workspace = await newWorkspace();
    await seedManifest(workspace, { files: ['.lagune/skills/regex.md'] });

    await applyManifestChange(
      workspace,
      {
        categories: ['owasp'],
        addFiles: ['.lagune/skills/regex.md', '.lagune/skills/network.md'],
        removeFiles: [],
      },
      { version: '9.9.9', now }
    );

    strict.deepStrictEqual((await readManifest(workspace)).files, [
      '.lagune/skills/regex.md',
      '.lagune/skills/network.md',
    ]);
  });
});

await describe('serializeAgents', async () => {
  it('keeps a single agent as a string', () => {
    strict.strictEqual(serializeAgents(['claude']), 'claude');
  });

  it('keeps two or more agents as an array', () => {
    strict.deepStrictEqual(serializeAgents(['claude', 'copilot']), [
      'claude',
      'copilot',
    ]);
  });
});

await describe('readManifestAgents', async () => {
  await it('returns [] when the manifest is absent', async () => {
    strict.deepStrictEqual(await readManifestAgents(await newWorkspace()), []);
  });

  await it('wraps a string agent into a list', async () => {
    const workspace = await newWorkspace();
    await seedManifest(workspace, { agent: 'claude' });

    strict.deepStrictEqual(await readManifestAgents(workspace), ['claude']);
  });

  await it('returns an array agent as is', async () => {
    const workspace = await newWorkspace();
    await seedManifest(workspace, { agent: ['claude', 'copilot'] });

    strict.deepStrictEqual(await readManifestAgents(workspace), [
      'claude',
      'copilot',
    ]);
  });

  await it('returns [] when agent is not a string or string array', async () => {
    const workspace = await newWorkspace();
    await writeManifest(
      workspace,
      JSON.stringify({ name: 'lagune', agent: [1, 2] })
    );

    strict.deepStrictEqual(await readManifestAgents(workspace), []);
  });
});

await describe('recordManifestInstall', async () => {
  await it('seeds a string agent when no manifest exists', async () => {
    const workspace = await newWorkspace();

    await recordManifestInstall(workspace, {
      agent: 'claude',
      categories: ['owasp'],
      version: '9.9.9',
      now,
      addFiles: ['.claude/skills/lagune.charter/SKILL.md'],
    });

    const manifest = await readManifest(workspace);

    strict.strictEqual(manifest.agent, 'claude');
    strict.deepStrictEqual(manifest.categories, ['owasp']);
    strict.deepStrictEqual(manifest.files, [
      '.claude/skills/lagune.charter/SKILL.md',
    ]);
  });

  await it('migrates string to array and unions categories on a second agent', async () => {
    const workspace = await newWorkspace();
    await seedManifest(workspace, {
      files: ['.claude/skills/lagune.charter/SKILL.md'],
    });

    await recordManifestInstall(workspace, {
      agent: 'copilot',
      categories: ['python'],
      version: '9.9.9',
      now,
      addFiles: ['.github/prompts/lagune.charter.prompt.md'],
    });

    const manifest = await readManifest(workspace);

    strict.deepStrictEqual(manifest.agent, ['claude', 'copilot']);
    strict.deepStrictEqual(manifest.categories, ['owasp', 'python']);
    strict.strictEqual(
      manifest.createdAt,
      '2020-01-01T00:00:00.000Z',
      'createdAt is preserved'
    );
  });

  await it('is idempotent for an already recorded agent', async () => {
    const workspace = await newWorkspace();

    await seedManifest(workspace, Object.create(null));
    await recordManifestInstall(workspace, {
      agent: 'claude',
      categories: ['owasp'],
      version: '9.9.9',
      now,
      addFiles: [],
    });

    const manifest = await readManifest(workspace);

    strict.strictEqual(manifest.agent, 'claude');
    strict.deepStrictEqual(manifest.categories, ['owasp']);
  });

  await it('records categories without an agent, preserving the agent list', async () => {
    const workspace = await newWorkspace();
    await seedManifest(workspace, { agent: ['claude', 'copilot'] });

    await recordManifestInstall(workspace, {
      categories: ['python'],
      version: '9.9.9',
      now,
      addFiles: ['.lagune/skills/python.md'],
    });

    const manifest = await readManifest(workspace);

    strict.deepStrictEqual(
      manifest.agent,
      ['claude', 'copilot'],
      'the agent list is preserved when no agent is recorded'
    );
    strict.deepStrictEqual(manifest.categories, ['owasp', 'python']);
    strict.deepStrictEqual(manifest.files, ['.lagune/skills/python.md']);
  });
});
