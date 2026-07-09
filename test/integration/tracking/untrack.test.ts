import type { UntrackSummary } from '../../../src/types/core.js';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import {
  loadTrackingMap,
  removeEntries,
  writeTrackingMap,
} from '../../../src/core/tracking.js';
import { untrack } from '../../../src/hooks/untrack/untrack.js';
import { mapOf, newWorkspace, seedMemoryFile } from './__utils__.js';

const detectWith = (...findings: string[]): string =>
  [
    '# Project Detect Map',
    '',
    '## Findings',
    '',
    ...findings.flatMap((name) => [
      `### ${name}`,
      '',
      `- **What it is:** ${name} detail.`,
      '',
    ]),
  ].join('\n');

const readMemory = (workspace: string, relativePath: string): Promise<string> =>
  readFile(join(workspace, relativePath), 'utf8');

const NOW = new Date('2026-07-06T00:00:00.000Z');

describe('removeEntries drops items by name and reports what it removed', () => {
  it('removes one named entry, leaving the rest in place', () => {
    const map = mapOf([
      { name: 'Leaked secret', paths: ['src/config.ts'] },
      { name: 'Open redirect', paths: ['src/routes.ts'] },
    ]);

    const result = removeEntries(map, ['Leaked secret']);

    strict.deepStrictEqual(result.removed, ['Leaked secret']);
    strict.deepStrictEqual(
      result.updatedMap.entries.map((entry) => entry.name),
      ['Open redirect']
    );
  });

  it('removes a batch in one pass', () => {
    const map = mapOf([
      { name: 'Alpha', paths: ['a.ts'] },
      { name: 'Beta', paths: ['b.ts'] },
      { name: 'Gamma', paths: ['c.ts'] },
    ]);

    const result = removeEntries(map, ['Alpha', 'Gamma']);

    strict.deepStrictEqual(
      result.updatedMap.entries.map((entry) => entry.name),
      ['Beta'],
      'the unrequested item stays in place and in order'
    );
  });

  it('lists a requested name that the map does not hold under notFound', () => {
    const map = mapOf([{ name: 'Leaked secret', paths: ['src/config.ts'] }]);

    const result = removeEntries(map, ['Missing finding']);

    strict.deepStrictEqual(result.removed, []);
    strict.deepStrictEqual(result.notFound, ['Missing finding']);
    strict.strictEqual(result.updatedMap.entries.length, 1);
  });

  it('removing every entry yields the empty map', () => {
    const map = mapOf([
      { name: 'Alpha', paths: ['a.ts'] },
      { name: 'Beta', paths: ['b.ts'] },
    ]);

    const result = removeEntries(map, ['Alpha', 'Beta']);

    strict.strictEqual(result.updatedMap.entries.length, 0);
  });

  it('is idempotent: re-removing a gone name is a no-op', () => {
    const map = mapOf([{ name: 'Open redirect', paths: ['src/routes.ts'] }]);

    const first = removeEntries(map, ['Leaked secret']);
    const second = removeEntries(first.updatedMap, ['Leaked secret']);

    strict.deepStrictEqual(second.removed, []);
    strict.deepStrictEqual(second.notFound, ['Leaked secret']);
    strict.deepStrictEqual(second.updatedMap.entries, first.updatedMap.entries);
  });
});

await describe('the untrack hook logic', async () => {
  await it('removes a named entry from a seeded map and emits JSON', async () => {
    const workspace = await newWorkspace();
    await writeTrackingMap(
      workspace,
      mapOf([
        { name: 'Leaked secret', paths: ['src/config.ts'] },
        { name: 'Open redirect', paths: ['src/routes.ts'] },
      ])
    );

    const output = await untrack(
      workspace,
      JSON.stringify({ names: ['Leaked secret'] }),
      NOW
    );
    const parsed: { removed: string[]; notFound: string[] } =
      JSON.parse(output);

    strict.deepStrictEqual(parsed.removed, ['Leaked secret']);

    const map = await loadTrackingMap(workspace);
    strict.deepStrictEqual(
      map.entries.map((entry) => entry.name),
      ['Open redirect']
    );
  });

  await it('rejects a payload with no names', async () => {
    const workspace = await newWorkspace();

    await strict.rejects(
      untrack(workspace, JSON.stringify({ names: [] }), NOW),
      /names/
    );
  });

  await it('fails closed on a non-string name', async () => {
    const workspace = await newWorkspace();
    await writeTrackingMap(
      workspace,
      mapOf([{ name: 'Leaked secret', paths: ['src/config.ts'] }])
    );

    const output = await untrack(
      workspace,
      JSON.stringify({ names: [42, 'Leaked secret'] }),
      NOW
    );
    const parsed: { removed: string[] } = JSON.parse(output);

    strict.deepStrictEqual(
      parsed.removed,
      ['Leaked secret'],
      'the non-string name is filtered out, the valid one still removes'
    );
  });

  await it('does not rewrite the file when nothing changed', async () => {
    const workspace = await newWorkspace();
    await writeTrackingMap(
      workspace,
      mapOf([{ name: 'Open redirect', paths: ['src/routes.ts'] }])
    );
    const trackingPath = join(workspace, '.lagune/tracking.json');
    const before = await stat(trackingPath);

    await untrack(
      workspace,
      JSON.stringify({ names: ['Missing finding'] }),
      NOW
    );
    const after = await stat(trackingPath);

    strict.strictEqual(
      after.mtimeMs,
      before.mtimeMs,
      'removing a name the map never held leaves the file untouched'
    );
  });
});

await describe('untrack removes finding sections from the memory artifacts', async () => {
  await it('strips the section from all three files and drops the entry', async () => {
    const workspace = await newWorkspace();
    await writeTrackingMap(
      workspace,
      mapOf([
        { name: 'Leaked secret', paths: ['src/config.ts'] },
        { name: 'Open redirect', paths: ['src/routes.ts'] },
      ])
    );
    const body = detectWith('Leaked secret', 'Open redirect');
    await seedMemoryFile(workspace, '.lagune/memory/detect.md', body);
    await seedMemoryFile(workspace, '.lagune/memory/plan.md', body);
    await seedMemoryFile(workspace, '.lagune/memory/harden.md', body);

    const summary: UntrackSummary = JSON.parse(
      await untrack(
        workspace,
        JSON.stringify({ names: ['Leaked secret'] }),
        NOW
      )
    );

    strict.deepStrictEqual(summary.removed, ['Leaked secret']);
    strict.deepStrictEqual(
      summary.prose.map((entry) => entry.status),
      ['edited', 'edited', 'edited'],
      'every memory file was edited'
    );

    for (const file of [
      '.lagune/memory/detect.md',
      '.lagune/memory/plan.md',
      '.lagune/memory/harden.md',
    ]) {
      const content = await readMemory(workspace, file);
      strict.strictEqual(content.includes('### Leaked secret'), false);
      strict.strictEqual(content.includes('### Open redirect'), true);
    }

    const map = await loadTrackingMap(workspace);
    strict.deepStrictEqual(
      map.entries.map((entry) => entry.name),
      ['Open redirect']
    );
  });

  await it('tolerates a missing memory file', async () => {
    const workspace = await newWorkspace();
    await writeTrackingMap(
      workspace,
      mapOf([{ name: 'Leaked secret', paths: ['src/config.ts'] }])
    );
    const body = detectWith('Leaked secret');
    await seedMemoryFile(workspace, '.lagune/memory/detect.md', body);
    await seedMemoryFile(workspace, '.lagune/memory/plan.md', body);

    const summary: UntrackSummary = JSON.parse(
      await untrack(
        workspace,
        JSON.stringify({ names: ['Leaked secret'] }),
        NOW
      )
    );

    const harden = summary.prose.find(
      (entry) => entry.file === '.lagune/memory/harden.md'
    );
    strict.strictEqual(harden?.status, 'absent', 'the absent file is reported');
    strict.deepStrictEqual(summary.removed, ['Leaked secret']);

    const map = await loadTrackingMap(workspace);
    strict.strictEqual(map.entries.length, 0);
  });

  await it('reports a file where the name is already gone as unchanged', async () => {
    const workspace = await newWorkspace();
    await seedMemoryFile(
      workspace,
      '.lagune/memory/detect.md',
      detectWith('Leaked secret')
    );
    await seedMemoryFile(
      workspace,
      '.lagune/memory/plan.md',
      detectWith('Other finding')
    );
    await seedMemoryFile(
      workspace,
      '.lagune/memory/harden.md',
      detectWith('Leaked secret')
    );

    const summary: UntrackSummary = JSON.parse(
      await untrack(
        workspace,
        JSON.stringify({ names: ['Leaked secret'] }),
        NOW
      )
    );

    const plan = summary.prose.find(
      (entry) => entry.file === '.lagune/memory/plan.md'
    );
    strict.strictEqual(plan?.status, 'unchanged');
    strict.deepStrictEqual(plan?.removed, []);
  });

  await it('reports a dangling mention without editing the prose that holds it', async () => {
    const workspace = await newWorkspace();
    const detect = `${detectWith('Leaked secret', 'Open redirect')}
## Applied sub-skills

- \`.lagune/skills/config.md\`: surfaced "Leaked secret".
`;
    await seedMemoryFile(workspace, '.lagune/memory/detect.md', detect);

    const summary: UntrackSummary = JSON.parse(
      await untrack(
        workspace,
        JSON.stringify({ names: ['Leaked secret'] }),
        NOW
      )
    );

    const entry = summary.prose.find(
      (item) => item.file === '.lagune/memory/detect.md'
    );
    strict.strictEqual(entry?.status, 'edited');
    strict.strictEqual(
      entry?.dangling.length,
      1,
      'the lingering sub-skill bullet is flagged'
    );
    strict.strictEqual(entry?.dangling[0].name, 'Leaked secret');
    strict.strictEqual(entry?.dangling[0].text.includes('config.md'), true);

    const content = await readMemory(workspace, '.lagune/memory/detect.md');
    strict.strictEqual(content.includes('### Leaked secret'), false);
    strict.strictEqual(
      content.includes('surfaced "Leaked secret"'),
      true,
      'the bullet is reported, not rewritten'
    );
  });

  await it('reports no dangling when the name only lived in its own section', async () => {
    const workspace = await newWorkspace();
    await seedMemoryFile(
      workspace,
      '.lagune/memory/detect.md',
      detectWith('Leaked secret', 'Open redirect')
    );

    const summary: UntrackSummary = JSON.parse(
      await untrack(
        workspace,
        JSON.stringify({ names: ['Leaked secret'] }),
        NOW
      )
    );

    strict.deepStrictEqual(
      summary.prose.flatMap((entry) => entry.dangling),
      [],
      'with no cross-reference there is nothing to reconcile'
    );
  });

  await it('flags a lingering mention even when this run edits nothing', async () => {
    const workspace = await newWorkspace();
    const detect = `${detectWith('Open redirect')}
## Applied sub-skills

- \`.lagune/skills/config.md\`: surfaced "Leaked secret".
`;
    await seedMemoryFile(workspace, '.lagune/memory/detect.md', detect);

    const summary: UntrackSummary = JSON.parse(
      await untrack(
        workspace,
        JSON.stringify({ names: ['Leaked secret'] }),
        NOW
      )
    );

    const entry = summary.prose.find(
      (item) => item.file === '.lagune/memory/detect.md'
    );
    strict.strictEqual(
      entry?.status,
      'unchanged',
      'the section was already gone, so the file is not rewritten'
    );
    strict.strictEqual(
      entry?.dangling.length,
      1,
      'the residue is still flagged'
    );
  });

  await it('leaves every memory file untouched when nothing matches', async () => {
    const workspace = await newWorkspace();
    await writeTrackingMap(
      workspace,
      mapOf([{ name: 'Open redirect', paths: ['src/routes.ts'] }])
    );
    const files = [
      '.lagune/memory/detect.md',
      '.lagune/memory/plan.md',
      '.lagune/memory/harden.md',
    ];
    for (const file of files)
      await seedMemoryFile(workspace, file, detectWith('Open redirect'));

    const before = await Promise.all(
      files.map((file) => stat(join(workspace, file)))
    );

    await untrack(
      workspace,
      JSON.stringify({ names: ['Missing finding'] }),
      NOW
    );

    const after = await Promise.all(
      files.map((file) => stat(join(workspace, file)))
    );

    after.forEach((stamp, index) =>
      strict.strictEqual(
        stamp.mtimeMs,
        before[index].mtimeMs,
        'a file with no match is never rewritten'
      )
    );
  });
});

await describe('untrack deletes a memory file once its last finding is gone', async () => {
  const filesExist = (
    workspace: string
  ): Promise<{ file: string; exists: boolean }[]> =>
    Promise.all(
      [
        '.lagune/memory/detect.md',
        '.lagune/memory/plan.md',
        '.lagune/memory/harden.md',
      ].map(async (file) => ({
        file,
        exists: await stat(join(workspace, file)).then(
          () => true,
          () => false
        ),
      }))
    );

  await it('removes the file and reports it removed when no finding remains', async () => {
    const workspace = await newWorkspace();
    for (const file of [
      '.lagune/memory/detect.md',
      '.lagune/memory/plan.md',
      '.lagune/memory/harden.md',
    ])
      await seedMemoryFile(workspace, file, detectWith('Leaked secret'));

    const summary: UntrackSummary = JSON.parse(
      await untrack(
        workspace,
        JSON.stringify({ names: ['Leaked secret'] }),
        NOW
      )
    );

    strict.deepStrictEqual(
      summary.prose.map((entry) => entry.status),
      ['removed', 'removed', 'removed'],
      'every emptied file is deleted, not left as a husk'
    );

    const present = await filesExist(workspace);
    strict.deepStrictEqual(
      present.filter((entry) => entry.exists),
      [],
      'no memory file survives once its last finding is stood down'
    );
  });

  await it('keeps a file that still holds another finding', async () => {
    const workspace = await newWorkspace();
    await seedMemoryFile(
      workspace,
      '.lagune/memory/detect.md',
      detectWith('Leaked secret', 'Open redirect')
    );

    const summary: UntrackSummary = JSON.parse(
      await untrack(
        workspace,
        JSON.stringify({ names: ['Leaked secret'] }),
        NOW
      )
    );

    const detect = summary.prose.find(
      (entry) => entry.file === '.lagune/memory/detect.md'
    );
    strict.strictEqual(detect?.status, 'edited');

    const content = await readMemory(workspace, '.lagune/memory/detect.md');
    strict.strictEqual(content.includes('### Open redirect'), true);
  });

  await it('deletes an emptied file even when a dangling mention lingered', async () => {
    const workspace = await newWorkspace();
    const detect = `${detectWith('Leaked secret')}
## Applied sub-skills

- \`.lagune/skills/config.md\`: surfaced "Leaked secret".
`;
    await seedMemoryFile(workspace, '.lagune/memory/detect.md', detect);

    const summary: UntrackSummary = JSON.parse(
      await untrack(
        workspace,
        JSON.stringify({ names: ['Leaked secret'] }),
        NOW
      )
    );

    const entry = summary.prose.find(
      (item) => item.file === '.lagune/memory/detect.md'
    );
    strict.strictEqual(entry?.status, 'removed');
    strict.deepStrictEqual(
      entry?.dangling,
      [],
      'a deleted file has no residue to reconcile'
    );

    const present = await filesExist(workspace);
    strict.strictEqual(
      present.find((item) => item.file === '.lagune/memory/detect.md')?.exists,
      false
    );
  });
});
