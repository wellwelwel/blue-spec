import { describe, it, strict } from 'poku';
import {
  allowSkillInGitignore,
  ensureGitignoreEntries,
} from '../../../src/core/gitignore.js';
import { newWorkspace, readGitignore, writeGitignore } from './__utils__.js';

const LAGUNE_ENTRIES = [
  '/.lagune/templates/',
  '/.lagune/hooks/',
  '/.lagune/proofs/',
  '/.lagune/specializations.md',
  '/.lagune/skills/*',
  '/**/lagune.*',
  '/**/lagune/',
];

await describe('ensureGitignoreEntries', async () => {
  await it('creates .gitignore with every entry when none exists', async () => {
    const workspace = await newWorkspace();

    const outcome = await ensureGitignoreEntries(workspace);
    const contents = await readGitignore(workspace);

    strict.strictEqual(outcome, 'created');
    strict(contents.startsWith('# Lagune\n'), 'leads with the section header');
    for (const entry of LAGUNE_ENTRIES)
      strict(contents.includes(entry), `writes ${entry}`);
    strict(contents.endsWith('\n'), 'ends with a trailing newline');
  });

  await it('never ignores the manifest, which stays version-controlled', async () => {
    const workspace = await newWorkspace();

    await ensureGitignoreEntries(workspace);
    const contents = await readGitignore(workspace);

    strict(
      !contents.includes('/.lagune/manifest.json'),
      'the manifest must remain tracked'
    );
  });

  await it('adds only the missing entries, preserving user content', async () => {
    const workspace = await newWorkspace();
    await writeGitignore(workspace, 'node_modules\n/.lagune/templates/\n');

    const outcome = await ensureGitignoreEntries(workspace);
    const contents = await readGitignore(workspace);

    strict.strictEqual(outcome, 'updated');
    strict(contents.startsWith('node_modules\n'), 'preserves user content');
    strict.strictEqual(
      contents.split('/.lagune/templates/').length - 1,
      1,
      'never duplicates an entry already present'
    );
    strict(contents.includes('/.lagune/hooks/'), 'adds a missing entry');
    strict(contents.includes('/.lagune/skills/*'), 'adds a missing entry');
    strict(contents.includes('/**/lagune.*'), 'adds a missing entry');
  });

  await it('adds a new entry inside the existing block, not a second header', async () => {
    const workspace = await newWorkspace();
    const stale = LAGUNE_ENTRIES.filter(
      (entry) => entry !== '/.lagune/specializations.md'
    );
    await writeGitignore(
      workspace,
      `node_modules\n\n# Lagune\n${stale.join('\n')}\n`
    );

    const outcome = await ensureGitignoreEntries(workspace);
    const contents = await readGitignore(workspace);

    strict.strictEqual(outcome, 'updated');
    strict.strictEqual(
      contents.split('# Lagune').length - 1,
      1,
      'never opens a second Lagune block'
    );
    strict(
      contents.includes('/.lagune/specializations.md'),
      'adds the missing entry'
    );
    for (const entry of LAGUNE_ENTRIES)
      strict(contents.includes(entry), `keeps ${entry}`);
  });

  await it('keeps a sub-skill re-include next to the exclude when back-filling', async () => {
    const workspace = await newWorkspace();
    const stale = LAGUNE_ENTRIES.filter(
      (entry) => entry !== '/.lagune/specializations.md'
    );
    const withNegation = stale.flatMap((entry) =>
      entry === '/.lagune/skills/*'
        ? [entry, '!/.lagune/skills/graphql.md']
        : [entry]
    );
    await writeGitignore(workspace, `# Lagune\n${withNegation.join('\n')}\n`);

    await ensureGitignoreEntries(workspace);
    const lines = (await readGitignore(workspace)).trimEnd().split('\n');

    const excludeAt = lines.indexOf('/.lagune/skills/*');
    strict.strictEqual(
      lines[excludeAt + 1],
      '!/.lagune/skills/graphql.md',
      'the sub-skill re-include stays right after its exclude'
    );
  });

  await it('leaves an already complete .gitignore untouched', async () => {
    const workspace = await newWorkspace();
    const complete = `node_modules\n\n# Lagune\n${LAGUNE_ENTRIES.join('\n')}\n`;
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

    const excludeAt = lines.indexOf('/.lagune/skills/*');
    strict(excludeAt >= 0, 'the skills exclude line is present');
    strict.strictEqual(
      lines[excludeAt + 1],
      '!/.lagune/skills/graphql.md',
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
      contents.includes('!/.lagune/skills/crypto.md'),
      'a built-in name is re-includable so a collision survives a clone'
    );
  });
});
