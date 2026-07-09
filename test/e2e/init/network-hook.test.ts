import { spawn } from 'node:child_process';
import { execPath } from 'node:process';
import { describe, it, strict } from 'poku';
import { initInto, newWorkspace } from './__utils__.js';

type NetworkRun = { stdout: string; stderr: string; code: number | null };

const runNetworkRaw = (
  workspace: string,
  ...args: string[]
): Promise<NetworkRun> =>
  new Promise((resolve, reject) => {
    const child = spawn(execPath, ['.lagune/hooks/network.mjs', ...args], {
      cwd: workspace,
    });
    const out: string[] = [];
    const err: string[] = [];

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => out.push(chunk));
    child.stderr.on('data', (chunk: string) => err.push(chunk));
    child.on('error', reject);
    child.on('close', (code) =>
      resolve({ stdout: out.join(''), stderr: err.join(''), code })
    );
  });

const runNetwork = async (
  workspace: string,
  ...args: string[]
): Promise<string> => {
  const { stdout, stderr, code } = await runNetworkRaw(workspace, ...args);

  if (code !== 0 && code !== 1)
    throw new Error(`network hook exited with code ${code}: ${stderr.trim()}`);

  return stdout.trim();
};

await describe('the scaffolded network hook runs without install', async () => {
  await it('classifies one destination per -u flag', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    strict.strictEqual(
      await runNetwork(workspace, '-u', 'http://0x7f000001/'),
      'private-target'
    );
    strict.strictEqual(
      await runNetwork(workspace, '-u', 'http://169.254.169.254/'),
      'private-target'
    );
    strict.strictEqual(
      await runNetwork(workspace, '-u', 'http://localhost/'),
      'private-target'
    );
    strict.strictEqual(
      await runNetwork(workspace, '-u', 'http://evil.com\\@expected.com/'),
      'parser-divergent'
    );
    strict.strictEqual(
      await runNetwork(workspace, '-u', 'http://example.com/'),
      'safe'
    );
    strict.strictEqual(
      await runNetwork(workspace, '-u', 'not a url'),
      'invalid url'
    );
  });

  await it('scores several destinations in one call, one verdict per line', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    strict.strictEqual(
      await runNetwork(
        workspace,
        '-u',
        'http://example.com/',
        '-u',
        'http://[::1]/',
        '-u',
        'not a url'
      ),
      'safe\nprivate-target\ninvalid url'
    );
  });

  await it('exits 1 on an unsafe target and 0 otherwise', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    strict.strictEqual(
      (await runNetworkRaw(workspace, '-u', 'http://[::1]/')).code,
      1
    );
    strict.strictEqual(
      (await runNetworkRaw(workspace, '-u', 'http://evil.com\\@expected.com/'))
        .code,
      1
    );

    strict.strictEqual(
      (await runNetworkRaw(workspace, '-u', 'http://example.com/')).code,
      0
    );
    strict.strictEqual(
      (await runNetworkRaw(workspace, '-u', 'not a url')).code,
      0
    );
  });
});
