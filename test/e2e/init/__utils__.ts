import type { ParsedCliArgs } from '../../../src/types/core.js';
import type { InitArgs } from '../../../src/types/test.js';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stdin } from 'node:process';
import { afterEach, beforeEach } from 'poku';
import { run } from '../../../src/cli/run.js';

const workspaces: string[] = [];
export const packageRoot = new URL('../../../', import.meta.url);

const runHeadless = async (args: ParsedCliArgs, cwd: string): Promise<void> => {
  const wasTTY = stdin.isTTY;
  stdin.isTTY = false;

  try {
    await run(args, cwd, packageRoot);
  } finally {
    stdin.isTTY = wasTTY;
  }
};

const baseArgs: ParsedCliArgs = {
  command: undefined,
  agent: undefined,
  skills: [],
  skillsRequested: false,
  findingsRequested: false,
  help: false,
  version: false,
  bare: false,
  port: undefined,
};

export const newWorkspace = async (): Promise<string> => {
  const workspace = await mkdtemp(join(tmpdir(), 'blue-spec-'));

  workspaces.push(workspace);
  return workspace;
};

export const readManifest = async (
  workspace: string
): Promise<Record<string, unknown>> =>
  JSON.parse(
    await readFile(join(workspace, '.bluespec/manifest.json'), 'utf8')
  );

export const initInto = (workspace: string, args: InitArgs): Promise<void> =>
  runHeadless(
    {
      ...baseArgs,
      command: args.init ? 'init' : undefined,
      agent: args.agent,
      skills: args.skills ?? [],
      skillsRequested: args.skills !== undefined,
    },
    workspace
  );

export const updateInto = (workspace: string): Promise<void> =>
  runHeadless({ ...baseArgs, command: 'update' }, workspace);

export const pullInto = (workspace: string): Promise<void> =>
  runHeadless({ ...baseArgs, command: 'pull' }, workspace);

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
