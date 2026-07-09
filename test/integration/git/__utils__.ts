import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach } from 'poku';

const workspaces: string[] = [];

export const newWorkspace = async (): Promise<string> => {
  const workspace = await mkdtemp(join(tmpdir(), 'lagune-git-'));

  workspaces.push(workspace);
  return workspace;
};

export const readGitignore = (workspace: string): Promise<string> =>
  readFile(join(workspace, '.gitignore'), 'utf8');

afterEach(async () => {
  await Promise.all(
    workspaces.map((workspace) =>
      rm(workspace, { recursive: true, force: true })
    )
  );

  workspaces.length = 0;
});
