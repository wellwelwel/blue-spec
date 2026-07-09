import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execPath } from 'node:process';
import { describe, it, strict } from 'poku';
import { initInto, newWorkspace } from './__utils__.js';

const runTrack = (workspace: string, payload: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn(execPath, ['.lagune/hooks/track.mjs', payload], {
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

      reject(new Error(`track hook exited with code ${code}`));
    });
  });

const readTracking = async (
  workspace: string
): Promise<{
  entries: { name: string; paths: string[] }[];
}> =>
  JSON.parse(await readFile(join(workspace, '.lagune/tracking.json'), 'utf8'));

await describe('the scaffolded track hook registers without install', async () => {
  await it('registers, follows a rename, and re-reports the same item by name', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });

    const firstRun = await runTrack(
      workspace,
      JSON.stringify({
        entries: [{ name: 'Leaked secret', paths: ['src/config.ts'] }],
      })
    );
    const firstParsed: { classifications: { classification: string }[] } =
      JSON.parse(firstRun);
    strict.strictEqual(firstParsed.classifications[0].classification, 'new');

    const afterFirst = await readTracking(workspace);
    strict.strictEqual(afterFirst.entries.length, 1);

    await runTrack(
      workspace,
      JSON.stringify({
        entries: [{ name: 'Leaked secret', paths: ['src/settings/config.ts'] }],
      })
    );

    const afterRename = await readTracking(workspace);
    strict.strictEqual(
      afterRename.entries.length,
      1,
      'a renamed path updates the entry, never duplicates'
    );
    strict.deepStrictEqual(afterRename.entries[0].paths, [
      'src/settings/config.ts',
    ]);

    await runTrack(
      workspace,
      JSON.stringify({
        entries: [{ name: 'Leaked secret', paths: ['src/settings/config.ts'] }],
      })
    );

    const afterPlan = await readTracking(workspace);
    strict.strictEqual(
      afterPlan.entries.length,
      1,
      're-reporting the same item by name keeps one entry'
    );
    strict.strictEqual(
      afterPlan.entries[0].name,
      'Leaked secret',
      're-reporting by name keeps the same one item'
    );
  });
});
