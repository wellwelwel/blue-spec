import type { TrackingEntry, TrackingMap } from '../../../src/types/core.js';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach } from 'poku';

const workspaces: string[] = [];

export const newWorkspace = async (): Promise<string> => {
  const workspace = await mkdtemp(join(tmpdir(), 'lagune-track-'));

  workspaces.push(workspace);
  return workspace;
};

export const mapOf = (entries: TrackingEntry[]): TrackingMap => ({
  name: 'lagune',
  entries,
});

export const seedMemoryFile = async (
  workspace: string,
  relativePath: string,
  content: string
): Promise<void> => {
  const path = join(workspace, relativePath);

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
};

afterEach(async () => {
  await Promise.all(
    workspaces.map((workspace) =>
      rm(workspace, { recursive: true, force: true })
    )
  );

  workspaces.length = 0;
});
