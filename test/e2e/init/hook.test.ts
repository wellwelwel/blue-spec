import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execPath } from 'node:process';
import { describe, it, strict } from 'poku';
import { initInto, newWorkspace } from './__utils__.js';

const runHook = (workspace: string, payload: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn(execPath, ['.lagune/hooks/repair.mjs', payload], {
      cwd: workspace,
    });
    const chunks: string[] = [];

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => chunks.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(chunks.join(''));
        return;
      }

      reject(new Error(`repair hook exited with code ${code}`));
    });
  });

await describe('the scaffolded repair hook runs without install', async () => {
  await it('repairs the tracking map from the payload argument', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    const payload = JSON.stringify({
      entries: [{ name: 'Leaked secret', paths: ['src/config.ts'] }],
    });

    const stdout = await runHook(workspace, payload);

    const parsed: { classifications: { classification: string }[] } =
      JSON.parse(stdout);
    strict.strictEqual(parsed.classifications[0].classification, 'new');

    const tracking: { entries: { name: string }[] } = JSON.parse(
      await readFile(join(workspace, '.lagune/tracking.json'), 'utf8')
    );
    strict.strictEqual(tracking.entries.length, 1);
    strict.strictEqual(tracking.entries[0].name, 'Leaked secret');
  });
});
