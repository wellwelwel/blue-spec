import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { ensureDir } from '../../../src/core/fs-actions.js';
import {
  loadTrackingMap,
  serializeTrackingMap,
  writeTrackingMap,
} from '../../../src/core/tracking.js';
import { mapOf, newWorkspace } from './__utils__.js';

await describe('tracking map I/O', async () => {
  await it('returns the empty map when the file is absent', async () => {
    const workspace = await newWorkspace();
    const map = await loadTrackingMap(workspace);

    strict.deepStrictEqual(map, { name: 'lagune', entries: [] });
  });

  await it('rebuilds from the empty map when the file is corrupt', async () => {
    const workspace = await newWorkspace();
    await ensureDir(join(workspace, '.lagune'));
    await writeFile(
      join(workspace, '.lagune/tracking.json'),
      'not json{',
      'utf8'
    );

    const map = await loadTrackingMap(workspace);

    strict.deepStrictEqual(map, { name: 'lagune', entries: [] });
  });

  await it('round-trips a written map byte-for-byte', async () => {
    const workspace = await newWorkspace();
    const original = mapOf([
      { name: 'Leaked secret', paths: ['src/config.ts'] },
    ]);

    await writeTrackingMap(workspace, original);
    const reloaded = await loadTrackingMap(workspace);

    strict.deepStrictEqual(reloaded, original);
  });

  await it('normalizes an old-shape entry on load, dropping its id, phase, and prose', async () => {
    const workspace = await newWorkspace();
    await ensureDir(join(workspace, '.lagune'));
    await writeFile(
      join(workspace, '.lagune/tracking.json'),
      JSON.stringify({
        name: 'lagune',
        entries: [
          {
            id: 'old-1',
            phase: 'detect',
            name: 'Leaked secret',
            evidence: { paths: ['src/config.ts'], note: 'reads the secret' },
          },
        ],
      }),
      'utf8'
    );

    const map = await loadTrackingMap(workspace);

    strict.deepStrictEqual(map.entries, [{ name: 'Leaked secret', paths: [] }]);
  });

  it('serializes with two-space indent and a trailing newline', () => {
    const serialized = serializeTrackingMap(mapOf([]));

    strict.strictEqual(
      serialized,
      `${JSON.stringify({ name: 'lagune', entries: [] }, null, 2)}\n`
    );
    strict(serialized.endsWith('\n'), 'should end with a newline');
  });
});
