import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it, strict } from 'poku';
import { loadVersion } from '../../../src/core/assets.js';
import { buildData } from '../../../src/dashboard/server/data/build/data.js';

const packageRoot = new URL('../../../', import.meta.url);

const installOf = async (manifest: string | null) => {
  const dir = await mkdtemp(join(tmpdir(), 'lagune-dashboard-'));

  try {
    if (manifest !== null)
      await writeFile(join(dir, 'manifest.json'), manifest);

    return (await buildData(dir, packageRoot)).install;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

const installWithFiles = async (manifestFiles: string[], onDisk: string[]) => {
  const workspace = await mkdtemp(join(tmpdir(), 'lagune-workspace-'));
  const laguneDir = join(workspace, '.lagune');

  try {
    await mkdir(laguneDir, { recursive: true });
    await writeFile(
      join(laguneDir, 'manifest.json'),
      JSON.stringify({
        agent: 'claude',
        version: '0.7.0',
        files: manifestFiles,
      })
    );
    for (const file of onDisk) {
      const full = join(workspace, file);

      await mkdir(dirname(full), { recursive: true });
      await writeFile(full, 'x');
    }

    return (await buildData(laguneDir, packageRoot)).install;
  } finally {
    await rm(workspace, { recursive: true, force: true });
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

describe('the internal specializations listing is tracked like any manifest file', () => {
  const files = ['.lagune/tracking.json', '.lagune/specializations.md'];

  it('counts it in the total and reports none missing when it is present', async () => {
    const install = await installWithFiles(files, files);

    strict.strictEqual(
      install.filesTotal,
      2,
      'the listing is one of the total'
    );
    strict.deepStrictEqual(install.missing, [], 'nothing is missing');
  });

  it('reports it missing when the file is absent, so Pull can rebuild it', async () => {
    const install = await installWithFiles(files, ['.lagune/tracking.json']);

    strict.strictEqual(install.filesTotal, 2);
    strict.deepStrictEqual(
      install.missing,
      ['.lagune/specializations.md'],
      'an absent listing surfaces as missing'
    );
  });
});
