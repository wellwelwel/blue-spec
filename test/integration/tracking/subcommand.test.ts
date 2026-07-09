import { mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { loadTrackingMap } from '../../../src/core/tracking.js';
import { repair } from '../../../src/hooks/repair/repair.js';
import { newWorkspace } from './__utils__.js';

await describe('the repair hook logic', async () => {
  await it('loads, registers each item, writes, and emits JSON', async () => {
    const workspace = await newWorkspace();
    const payload = JSON.stringify({
      entries: [
        { name: 'Leaked secret', paths: ['src/config.ts'] },
        { name: 'Open redirect', paths: ['src/redirect.ts'] },
      ],
    });

    const output = await repair(workspace, payload);
    const parsed: {
      classifications: { classification: string }[];
    } = JSON.parse(output);

    strict.strictEqual(parsed.classifications.length, 2);
    strict.strictEqual(
      parsed.classifications.every((entry) => entry.classification === 'new'),
      true
    );

    const map = await loadTrackingMap(workspace);
    strict.strictEqual(map.entries.length, 2);
  });

  await it('never touches the memory artifacts', async () => {
    const workspace = await newWorkspace();
    await mkdir(join(workspace, '.lagune/memory'), { recursive: true });

    await repair(
      workspace,
      JSON.stringify({
        entries: [{ name: 'Harden uploads', paths: ['src/upload.ts'] }],
      })
    );

    const memory = await readdir(join(workspace, '.lagune/memory'));
    strict.strictEqual(memory.length, 0, 'memory must stay untouched');
  });

  await it('rejects a payload with no entries', async () => {
    const workspace = await newWorkspace();

    await strict.rejects(
      repair(workspace, JSON.stringify({ entries: [] })),
      /entries/
    );
  });

  await it('drops an entry whose paths is not a string array', async () => {
    const workspace = await newWorkspace();

    await repair(
      workspace,
      JSON.stringify({
        entries: [
          { name: 'Leaked secret', paths: 'src/config.ts' },
          { name: 'Open redirect', paths: ['src/redirect.ts'] },
        ],
      })
    );

    const map = await loadTrackingMap(workspace);
    strict.strictEqual(
      map.entries.length,
      1,
      'the entry with a non-array paths fails the guard and never registers'
    );
    strict.strictEqual(map.entries[0].name, 'Open redirect');
  });

  await it('drops an entry with no paths at all', async () => {
    const workspace = await newWorkspace();

    await repair(
      workspace,
      JSON.stringify({
        entries: [
          { name: 'Leaked secret' },
          { name: 'Open redirect', paths: ['src/redirect.ts'] },
        ],
      })
    );

    const map = await loadTrackingMap(workspace);
    strict.strictEqual(map.entries.length, 1);
    strict.strictEqual(map.entries[0].name, 'Open redirect');
  });

  await it('does not rewrite the file when nothing changed', async () => {
    const workspace = await newWorkspace();
    const payload = JSON.stringify({
      entries: [{ name: 'Leaked secret', paths: ['src/config.ts'] }],
    });
    const trackingPath = join(workspace, '.lagune/tracking.json');

    await repair(workspace, payload);
    const firstWrite = await stat(trackingPath);

    await repair(workspace, payload);
    const secondWrite = await stat(trackingPath);

    strict.strictEqual(
      secondWrite.mtimeMs,
      firstWrite.mtimeMs,
      'an identical re-run leaves the file untouched'
    );
  });
});
