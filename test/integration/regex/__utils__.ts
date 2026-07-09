import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach } from 'poku';

const workspaces: string[] = [];

export const newWorkspace = async (): Promise<string> => {
  const workspace = await mkdtemp(join(tmpdir(), 'lagune-regex-'));

  workspaces.push(workspace);
  return workspace;
};

export const writeFiles = async (
  workspace: string,
  files: Record<string, string>
): Promise<void> => {
  for (const [name, contents] of Object.entries(files)) {
    const target = join(workspace, name);

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents, 'utf8');
  }
};

afterEach(async () => {
  await Promise.all(
    workspaces.map((workspace) =>
      rm(workspace, { recursive: true, force: true })
    )
  );

  workspaces.length = 0;
});
