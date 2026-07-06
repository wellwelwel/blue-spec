import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { loadVersion } from '../../../src/core/assets.js';
import { buildData } from '../../../src/dashboard/server/data/build/data.js';

const packageRoot = new URL('../../../', import.meta.url);

const installOf = async (manifest: string | null) => {
  const dir = await mkdtemp(join(tmpdir(), 'bluespec-dashboard-'));

  try {
    if (manifest !== null)
      await writeFile(join(dir, 'manifest.json'), manifest);

    return (await buildData(dir, packageRoot)).install;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

describe('install parsing accepts both manifest agent shapes', () => {
  it('reads a single agent stored as a string', async () => {
    const install = await installOf(
      '{"agent":"claude","version":"0.7.0","createdAt":"2026-07-01T00:00:00.000Z","categories":["owasp"]}'
    );

    strict.deepStrictEqual(install.agents, ['claude']);
    strict.strictEqual(install.version, '0.7.0');
  });

  it('reports the running package version alongside the installed one', async () => {
    const install = await installOf('{"agent":"claude","version":"0.7.0"}');

    strict.strictEqual(install.running, await loadVersion(packageRoot));
  });

  it('reads multiple agents stored as an array', async () => {
    const install = await installOf(
      '{"agent":["claude","codex"],"version":"0.7.0","categories":[]}'
    );

    strict.deepStrictEqual(install.agents, ['claude', 'codex']);
  });

  it('treats an empty agent as none', async () => {
    const install = await installOf('{"agent":"","version":"0.7.0"}');

    strict.deepStrictEqual(install.agents, []);
  });

  it('ignores agent entries that are not strings', async () => {
    const install = await installOf('{"agent":["claude",42]}');

    strict.deepStrictEqual(install.agents, []);
  });

  it('returns the empty install when the manifest is missing', async () => {
    const install = await installOf(null);

    strict.deepStrictEqual(install, {
      agents: [],
      version: null,
      running: await loadVersion(packageRoot),
      createdAt: null,
      categories: [],
      present: false,
      filesTotal: 0,
      missing: [],
    });
  });

  it('returns the empty install when the manifest is malformed', async () => {
    const install = await installOf('{not json');

    strict.deepStrictEqual(install.agents, []);
  });
});
