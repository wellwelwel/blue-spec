import type { ParsedCliArgs } from '../../../src/types/core.js';
import type { InitArgs } from '../../../src/types/test.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach } from 'poku';
import { run } from '../../../src/cli/run.js';

const workspaces: string[] = [];
export const packageRoot = new URL('../../../', import.meta.url);

const baseArgs: ParsedCliArgs = {
  command: undefined,
  agent: undefined,
  skills: [],
  skillsRequested: false,
  findingsRequested: false,
  help: false,
  version: false,
};

export const newWorkspace = async (): Promise<string> => {
  const workspace = await mkdtemp(join(tmpdir(), 'blue-spec-'));

  workspaces.push(workspace);
  return workspace;
};

export const initInto = (workspace: string, args: InitArgs): Promise<void> =>
  run(
    {
      ...baseArgs,
      command: args.init ? 'init' : undefined,
      agent: args.agent,
      skills: args.skills ?? [],
      skillsRequested: args.skills !== undefined,
    },
    workspace,
    packageRoot
  );

export const updateInto = (workspace: string): Promise<void> =>
  run({ ...baseArgs, command: 'update' }, workspace, packageRoot);

const clear = async () => {
  await Promise.all(
    workspaces.map((workspace) =>
      rm(workspace, { recursive: true, force: true })
    )
  );

  workspaces.length = 0;
};

beforeEach(clear);
afterEach(clear);
