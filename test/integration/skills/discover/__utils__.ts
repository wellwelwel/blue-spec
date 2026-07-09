import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach } from 'poku';
import {
  discoverSkills,
  presentSkillNames,
} from '../../../../src/hooks/skills/discover.js';

const workspaces: string[] = [];

const newWorkspace = async (): Promise<string> => {
  const workspace = await mkdtemp(join(tmpdir(), 'lagune-discover-'));

  workspaces.push(workspace);
  return workspace;
};

export const withWorkspace = async (
  contents: string | null,
  assert: (entries: Awaited<ReturnType<typeof discoverSkills>>) => void
): Promise<void> => {
  const workspace = await newWorkspace();

  if (contents !== null) {
    await mkdir(join(workspace, '.lagune'), { recursive: true });
    await writeFile(
      join(workspace, '.lagune', 'skills.json'),
      contents,
      'utf8'
    );
  }

  assert(await discoverSkills(workspace));
};

export const withSkillsDir = async (
  files: string[] | null,
  assert: (names: Awaited<ReturnType<typeof presentSkillNames>>) => void
): Promise<void> => {
  const workspace = await newWorkspace();

  if (files !== null) {
    await mkdir(join(workspace, '.lagune', 'skills'), { recursive: true });

    for (const file of files)
      await writeFile(
        join(workspace, '.lagune', 'skills', file),
        '# x\n',
        'utf8'
      );
  }

  assert(await presentSkillNames(workspace));
};

afterEach(async () => {
  await Promise.all(
    workspaces.map((workspace) =>
      rm(workspace, { recursive: true, force: true })
    )
  );

  workspaces.length = 0;
});
