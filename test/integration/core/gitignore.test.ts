import { describe, it, strict } from 'poku';
import {
  allowSkillInGitignore,
  ensureGitignoreEntries,
} from '../../../src/core/gitignore.js';
import { newWorkspace, readGitignore, writeGitignore } from './__utils__.js';

const BLUESPEC_ENTRIES = [
  '/.bluespec/templates/',
  '/.bluespec/hooks/',
  '/.bluespec/skills/*',
  '/**/bluespec.*',
];

await describe('ensureGitignoreEntries', async () => {
  await it('creates .gitignore with every entry when none exists', async () => {
    const workspace = await newWorkspace();

    const outcome = await ensureGitignoreEntries(workspace);
    const contents = await readGitignore(workspace);

    strict.strictEqual(outcome, 'created');
    strict(
      contents.startsWith('# Blue Spec\n'),
      'leads with the section header'
    );
    for (const entry of BLUESPEC_ENTRIES)
      strict(contents.includes(entry), `writes ${entry}`);
    strict(contents.endsWith('\n'), 'ends with a trailing newline');
  });

  await it('never ignores the manifest, which stays version-controlled', async () => {
    const workspace = await newWorkspace();

    await ensureGitignoreEntries(workspace);
    const contents = await readGitignore(workspace);

    strict(
      !contents.includes('/.bluespec/manifest.json'),
      'the manifest must remain tracked'
    );
  });

  await it('adds only the missing entries, preserving user content', async () => {
    const workspace = await newWorkspace();
    await writeGitignore(workspace, 'node_modules\n/.bluespec/templates/\n');

    const outcome = await ensureGitignoreEntries(workspace);
    const contents = await readGitignore(workspace);

    strict.strictEqual(outcome, 'updated');
    strict(contents.startsWith('node_modules\n'), 'preserves user content');
    strict.strictEqual(
      contents.split('/.bluespec/templates/').length - 1,
      1,
      'never duplicates an entry already present'
    );
    strict(contents.includes('/.bluespec/hooks/'), 'adds a missing entry');
    strict(contents.includes('/.bluespec/skills/*'), 'adds a missing entry');
    strict(contents.includes('/**/bluespec.*'), 'adds a missing entry');
  });

  await it('leaves an already complete .gitignore untouched', async () => {
    const workspace = await newWorkspace();
    const complete = `node_modules\n\n# Blue Spec\n${BLUESPEC_ENTRIES.join('\n')}\n`;
    await writeGitignore(workspace, complete);

    const outcome = await ensureGitignoreEntries(workspace);

    strict.strictEqual(outcome, 'unchanged');
    strict.strictEqual(await readGitignore(workspace), complete);
  });

  await it('is idempotent across repeated runs', async () => {
    const workspace = await newWorkspace();

    await ensureGitignoreEntries(workspace);
    const afterFirst = await readGitignore(workspace);
    const outcome = await ensureGitignoreEntries(workspace);

    strict.strictEqual(outcome, 'unchanged');
    strict.strictEqual(await readGitignore(workspace), afterFirst);
  });
});

await describe('allowSkillInGitignore', async () => {
  await it('re-includes a sub-skill right after the skills exclude line', async () => {
    const workspace = await newWorkspace();

    const outcome = await allowSkillInGitignore(workspace, 'graphql');
    const lines = (await readGitignore(workspace)).trimEnd().split('\n');

    strict.strictEqual(outcome, 'updated');

    const excludeAt = lines.indexOf('/.bluespec/skills/*');
    strict(excludeAt >= 0, 'the skills exclude line is present');
    strict.strictEqual(
      lines[excludeAt + 1],
      '!/.bluespec/skills/graphql.md',
      'the negation lands immediately after the exclude'
    );
  });

  await it('is idempotent for a sub-skill already re-included', async () => {
    const workspace = await newWorkspace();

    await allowSkillInGitignore(workspace, 'graphql');
    const afterFirst = await readGitignore(workspace);
    const outcome = await allowSkillInGitignore(workspace, 'graphql');

    strict.strictEqual(outcome, 'unchanged');
    strict.strictEqual(await readGitignore(workspace), afterFirst);
  });

  await it('re-includes a name colliding with a built-in', async () => {
    const workspace = await newWorkspace();

    await allowSkillInGitignore(workspace, 'crypto');
    const contents = await readGitignore(workspace);

    strict(
      contents.includes('!/.bluespec/skills/crypto.md'),
      'a built-in name is re-includable so a collision survives a clone'
    );
  });
});
