import type { UntrackSummary } from '../../../src/types/core.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { buildHistory } from '../../../src/dashboard/server/data/build/history.js';
import { appendClosedFindings } from '../../../src/hooks/untrack/history.js';
import { untrack } from '../../../src/hooks/untrack/untrack.js';
import { newWorkspace, seedMemoryFile } from './__utils__.js';

const NOW = new Date('2026-07-06T00:00:00.000Z');
const HISTORY = '.lagune/memory/history.md';

const detect = (...findings: { name: string; what: string }[]): string =>
  [
    '# Project Detect Map',
    '',
    '## Findings',
    '',
    ...findings.flatMap(({ name, what }) => [
      `### ${name}`,
      '',
      `- **What it is:** ${what}`,
      '',
    ]),
  ].join('\n');

const plan = (
  ...fixes: { name: string; priority: string; category?: string }[]
): string =>
  [
    '# Project Defense Plan',
    '',
    '## Fixes',
    '',
    ...fixes.flatMap(({ name, priority, category }) => [
      `### ${name}`,
      '',
      `- **Priority:** ${priority}`,
      ...(category ? [`- **Category:** ${category}`] : []),
      '',
    ]),
  ].join('\n');

const readHistory = (workspace: string): Promise<string> =>
  readFile(join(workspace, HISTORY), 'utf8');

await describe('appendClosedFindings distills each closed finding', async () => {
  await it('records name, classification, category, what it is, and the run date', async () => {
    const workspace = await newWorkspace();
    await seedMemoryFile(
      workspace,
      '.lagune/memory/detect.md',
      detect({ name: 'Leaked secret', what: 'A token sits in source.' })
    );
    await seedMemoryFile(
      workspace,
      '.lagune/memory/plan.md',
      plan({
        name: 'Leaked secret',
        priority: 'Critical',
        category: 'Hardcoded credentials (CWE-798)',
      })
    );

    const result = await appendClosedFindings(
      workspace,
      ['Leaked secret'],
      NOW
    );

    strict.deepStrictEqual(result.recorded, ['Leaked secret']);

    const parsed = buildHistory(await readHistory(workspace));
    strict.strictEqual(parsed.length, 1);
    strict.deepStrictEqual(parsed[0], {
      name: 'Leaked secret',
      classification: 'Critical',
      category: 'Hardcoded credentials (CWE-798)',
      whatItIs: 'A token sits in source.',
      closed: '2026-07-06',
    });
  });

  await it('leaves category empty when the plan names none', async () => {
    const workspace = await newWorkspace();
    await seedMemoryFile(
      workspace,
      '.lagune/memory/detect.md',
      detect({ name: 'Open redirect', what: 'A path is trusted verbatim.' })
    );
    await seedMemoryFile(
      workspace,
      '.lagune/memory/plan.md',
      plan({ name: 'Open redirect', priority: 'Medium' })
    );

    await appendClosedFindings(workspace, ['Open redirect'], NOW);

    const history = await readHistory(workspace);
    strict.ok(
      !history.includes('**Category:**'),
      'no empty Category line is written when there is none'
    );
    strict.strictEqual(buildHistory(history)[0].category, '');
  });

  await it('falls back to Unranked when the plan has no priority', async () => {
    const workspace = await newWorkspace();
    await seedMemoryFile(
      workspace,
      '.lagune/memory/detect.md',
      detect({ name: 'Open redirect', what: 'A path is trusted verbatim.' })
    );

    await appendClosedFindings(workspace, ['Open redirect'], NOW);

    const parsed = buildHistory(await readHistory(workspace));
    strict.strictEqual(parsed[0].classification, 'Unranked');
  });

  await it('skips a name that no detect finding carries', async () => {
    const workspace = await newWorkspace();
    await seedMemoryFile(
      workspace,
      '.lagune/memory/detect.md',
      detect({ name: 'Leaked secret', what: 'A token sits in source.' })
    );

    const result = await appendClosedFindings(
      workspace,
      ['Missing finding'],
      NOW
    );

    strict.deepStrictEqual(result.recorded, []);
    await strict.rejects(readHistory(workspace), 'no history file is written');
  });

  await it('appends across runs instead of overwriting', async () => {
    const workspace = await newWorkspace();
    await seedMemoryFile(
      workspace,
      '.lagune/memory/detect.md',
      detect(
        { name: 'Leaked secret', what: 'A token sits in source.' },
        { name: 'Open redirect', what: 'A path is trusted verbatim.' }
      )
    );

    await appendClosedFindings(workspace, ['Leaked secret'], NOW);
    await appendClosedFindings(workspace, ['Open redirect'], NOW);

    const parsed = buildHistory(await readHistory(workspace));
    strict.deepStrictEqual(
      parsed.map((entry) => entry.name),
      ['Leaked secret', 'Open redirect'],
      'both runs are preserved, in append order'
    );
  });
});

await describe('untrack writes history before it erases the memory', async () => {
  await it('records the finding then removes its live section', async () => {
    const workspace = await newWorkspace();
    const body = detect({
      name: 'Leaked secret',
      what: 'A token sits in source.',
    });
    await seedMemoryFile(workspace, '.lagune/memory/detect.md', body);
    await seedMemoryFile(
      workspace,
      '.lagune/memory/plan.md',
      plan({ name: 'Leaked secret', priority: 'High' })
    );

    const summary: UntrackSummary = JSON.parse(
      await untrack(
        workspace,
        JSON.stringify({ names: ['Leaked secret'] }),
        NOW
      )
    );

    strict.deepStrictEqual(summary.history.recorded, ['Leaked secret']);
    strict.strictEqual(
      summary.prose[0].status,
      'removed',
      'the emptied live memory file is deleted'
    );
    await strict.rejects(
      readFile(join(workspace, '.lagune/memory/detect.md'), 'utf8'),
      'the live section is gone with its file'
    );

    const parsed = buildHistory(await readHistory(workspace));
    strict.strictEqual(
      parsed[0].whatItIs,
      'A token sits in source.',
      'the erased prose survives in the history, proving history ran first'
    );
    strict.strictEqual(parsed[0].classification, 'High');
  });
});
