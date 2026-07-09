import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execPath } from 'node:process';
import { describe, it, strict } from 'poku';
import { initInto, newWorkspace } from './__utils__.js';

type RegexRun = { stdout: string; stderr: string; code: number | null };

const runRegexRaw = (workspace: string, ...args: string[]): Promise<RegexRun> =>
  new Promise((resolve, reject) => {
    const child = spawn(execPath, ['.lagune/hooks/regex.mjs', ...args], {
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

const FINDING_EXIT = 1;

const SAFE_EXIT = 0;

const runRegex = async (
  workspace: string,
  ...args: string[]
): Promise<string> => {
  const { stdout, stderr, code } = await runRegexRaw(workspace, ...args);

  if (code !== SAFE_EXIT && code !== FINDING_EXIT)
    throw new Error(`regex hook exited with code ${code}: ${stderr.trim()}`);

  return stdout.trim();
};

await describe('the scaffolded regex hook runs without install', async () => {
  await it('classifies one pattern as unsafe, safe, or invalid', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    strict.strictEqual(await runRegex(workspace, '-p', '(a+)+$'), 'unsafe');
    strict.strictEqual(
      await runRegex(workspace, '-p', 'boundary=(.+)$'),
      'unsafe'
    );
    strict.strictEqual(
      await runRegex(workspace, '-p', 'filename="([^"]*)"'),
      'unsafe'
    );
    strict.strictEqual(await runRegex(workspace, '-p', '(a+)+'), 'safe');
    strict.strictEqual(await runRegex(workspace, '-p', '^abc$'), 'safe');
    strict.strictEqual(await runRegex(workspace, '-p', '('), 'invalid regex');
  });

  await it('checks many patterns in one call, one verdict per line', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    strict.strictEqual(
      await runRegex(workspace, '-p', '(a+)+$', '-p', '^abc$', '-p', '('),
      'unsafe\nsafe\ninvalid regex'
    );
  });

  await it('applies a custom repetition limit to the checks', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    strict.strictEqual(
      await runRegex(workspace, '-p', 'a?a?a?', '-l', '2'),
      'unsafe'
    );
  });

  await it('scans a file for ReDoS-prone literals', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await writeFile(
      join(workspace, 'app.js'),
      'const re = /(a+)+$/;\n',
      'utf8'
    );

    strict.strictEqual(
      await runRegex(workspace, '-f', 'app.js'),
      'Vulnerable regular expressions found:\n\napp.js\n  (a+)+$'
    );
  });

  await it('scans a directory and the whole project from the root', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await mkdir(join(workspace, 'src'), { recursive: true });
    await writeFile(
      join(workspace, 'src', 'app.js'),
      'const re = /(a+)+$/;\n',
      'utf8'
    );

    strict.strictEqual(
      await runRegex(workspace, '-d', 'src'),
      'Vulnerable regular expressions found:\n\nsrc/app.js\n  (a+)+$'
    );
    strict.strictEqual(
      await runRegex(workspace),
      'Vulnerable regular expressions found:\n\nsrc/app.js\n  (a+)+$'
    );
  });

  await it('unions several -d and -f targets, each file once', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await mkdir(join(workspace, 'src'), { recursive: true });
    await mkdir(join(workspace, 'lib'), { recursive: true });
    await writeFile(
      join(workspace, 'src', 'a.js'),
      'const re = /(a+)+$/;\n',
      'utf8'
    );
    await writeFile(
      join(workspace, 'lib', 'b.js'),
      'const re = /(.+)$/;\n',
      'utf8'
    );

    strict.strictEqual(
      await runRegex(workspace, '-d', 'src', '-d', 'lib', '-f', 'src/a.js'),
      'Vulnerable regular expressions found:\n\n' +
        'lib/b.js\n  (.+)$\n\nsrc/a.js\n  (a+)+$'
    );
  });

  await it('applies a custom repetition limit to a scan', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await writeFile(
      join(workspace, 'app.js'),
      'const re = /a?a?a?/;\n',
      'utf8'
    );

    strict.strictEqual(
      await runRegex(workspace, '-f', 'app.js'),
      'no unsafe patterns found'
    );
    strict.strictEqual(
      await runRegex(workspace, '-f', 'app.js', '-l', '2'),
      'Vulnerable regular expressions found:\n\napp.js\n  a?a?a?'
    );
  });

  await it('rejects mixing a check with a scan scope', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    const { code, stderr } = await runRegexRaw(
      workspace,
      '-p',
      '(a+)+',
      '-d',
      'src'
    );

    strict.strictEqual(code, 1);
    strict.strictEqual(
      stderr.trim(),
      '-p checks a pattern and cannot be combined with -d or -f'
    );
  });

  await it('exits 1 on an unsafe finding and 0 when clean', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await writeFile(
      join(workspace, 'app.js'),
      'const re = /(a+)+$/;\n',
      'utf8'
    );

    strict.strictEqual((await runRegexRaw(workspace, '-p', '(a+)+$')).code, 1);
    strict.strictEqual((await runRegexRaw(workspace, '-f', 'app.js')).code, 1);

    strict.strictEqual((await runRegexRaw(workspace, '-p', '^abc$')).code, 0);
    strict.strictEqual((await runRegexRaw(workspace, '-p', '(')).code, 0);
    strict.strictEqual((await runRegexRaw(workspace, '-d', 'src')).code, 0);
  });
});
