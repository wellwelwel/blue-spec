import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach } from 'poku';

const GITIGNORE_PATH = '.gitignore';

const workspaces: string[] = [];

export const newWorkspace = async (): Promise<string> => {
  const workspace = await mkdtemp(join(tmpdir(), 'lagune-core-'));

  workspaces.push(workspace);
  return workspace;
};

export const writeGitignore = (
  workspace: string,
  contents: string
): Promise<void> =>
  writeFile(join(workspace, GITIGNORE_PATH), contents, 'utf8');

export const readGitignore = (workspace: string): Promise<string> =>
  readFile(join(workspace, GITIGNORE_PATH), 'utf8');

afterEach(async () => {
  await Promise.all(
    workspaces.map((workspace) =>
      rm(workspace, { recursive: true, force: true })
    )
  );

  workspaces.length = 0;
});
