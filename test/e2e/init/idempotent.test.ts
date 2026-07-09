import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { initInto, newWorkspace } from './__utils__.js';

await describe('init is idempotent', async () => {
  await it('preserves user edits on a re-run', async () => {
    const workspace = await newWorkspace();
    const skillPath = join(workspace, '.claude/skills/lagune.charter/SKILL.md');

    await initInto(workspace, { init: true, agent: 'claude' });
    await writeFile(skillPath, 'user edited this', 'utf8');
    await initInto(workspace, { init: true, agent: 'claude' });

    const after = await readFile(skillPath, 'utf8');

    strict.strictEqual(after, 'user edited this', 'the edit should survive');
  });
});
