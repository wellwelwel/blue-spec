import type { ManifestSeed } from '../../../src/types/test.js';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach } from 'poku';

const MANIFEST_PATH = '.lagune/manifest.json';

const workspaces: string[] = [];

export const newWorkspace = async (): Promise<string> => {
  const workspace = await mkdtemp(join(tmpdir(), 'lagune-manifest-'));

  workspaces.push(workspace);
  return workspace;
};

export const readManifest = async (
  workspace: string
): Promise<Record<string, unknown>> =>
  JSON.parse(await readFile(join(workspace, MANIFEST_PATH), 'utf8'));

export const writeManifest = async (
  workspace: string,
  contents: string
): Promise<void> => {
  await mkdir(join(workspace, '.lagune'), { recursive: true });
  await writeFile(join(workspace, MANIFEST_PATH), contents, 'utf8');
};

export const seedManifest = (
  workspace: string,
  seed: ManifestSeed
): Promise<void> =>
  writeManifest(
    workspace,
    JSON.stringify({
      name: 'lagune',
      version: '1.0.0',
      agent: 'claude',
      createdAt: '2020-01-01T00:00:00.000Z',
      files: [],
      categories: ['owasp'],
      ...seed,
    })
  );

afterEach(async () => {
  await Promise.all(
    workspaces.map((workspace) =>
      rm(workspace, { recursive: true, force: true })
    )
  );

  workspaces.length = 0;
});
