import { spawn } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execPath } from 'node:process';
import { describe, it, strict } from 'poku';
import { SKILLS_CATALOG } from '../../../src/hooks/skills/catalog.js';
import { SKILL_GROUPS } from '../../../src/hooks/skills/groups.js';
import { initInto, newWorkspace, packageRoot } from './__utils__.js';

const bin = new URL('lib/bin/index.js', packageRoot).pathname;
const everyCategory = SKILL_GROUPS.map((group) => group.key);

const runCli = (workspace: string, args: string[]): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn(execPath, [bin, ...args], { cwd: workspace });
    const chunks: string[] = [];

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => chunks.push(chunk));
    child.stderr.on('data', (chunk: string) => chunks.push(chunk));
    child.on('error', reject);
    child.on('close', () => resolve(chunks.join('')));
  });

const exists = (workspace: string, relativePath: string): Promise<boolean> =>
  access(join(workspace, relativePath)).then(
    () => true,
    () => false
  );

const manifestCategories = async (workspace: string): Promise<string[]> => {
  const parsed: { categories?: string[] } = JSON.parse(
    await readFile(join(workspace, '.lagune/manifest.json'), 'utf8')
  );

  return parsed.categories ?? [];
};

await describe('add installs specializations by category', async () => {
  await it('copies the category sub-skills and records them in the manifest', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await runCli(workspace, ['add', '--skills', 'owasp']);

    strict(await exists(workspace, '.lagune/skills/regex.md'));
    strict(await exists(workspace, '.lagune/skills/network.md'));
    strict(!(await exists(workspace, '.lagune/skills/javascript.md')));
    strict.deepStrictEqual(await manifestCategories(workspace), ['owasp']);
  });

  await it('reports an already installed category without duplicating', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });
    const output = await runCli(workspace, ['add', '--skills', 'owasp']);

    strict(
      output.includes('already exists'),
      'a present sub-skill is reported as already there'
    );
    strict.deepStrictEqual(await manifestCategories(workspace), ['owasp']);
  });

  await it('installs every category when every key is passed', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await runCli(workspace, ['add', '--skills', ...everyCategory]);

    for (const entry of SKILLS_CATALOG)
      strict(await exists(workspace, `.lagune/skills/${entry.name}.md`));

    strict.deepStrictEqual(
      (await manifestCategories(workspace)).slice().sort(),
      everyCategory.slice().sort()
    );
  });

  await it('shows the usage helper with no flag and writes nothing', async () => {
    const workspace = await newWorkspace();

    const output = await runCli(workspace, ['add']);

    strict(output.includes('usage: npx lagune add --skills'));
    strict(!(await exists(workspace, '.lagune')));
  });

  await it('rejects an unknown category', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    const output = await runCli(workspace, ['add', '--skills', 'nope']);

    strict(output.includes('Unknown specialization category: nope'));
  });
});

await describe('remove uninstalls specializations by category', async () => {
  await it('deletes the category sub-skills and updates the manifest', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: everyCategory,
    });
    await runCli(workspace, ['remove', '--skills', 'owasp']);

    strict(!(await exists(workspace, '.lagune/skills/regex.md')));
    strict(!(await exists(workspace, '.lagune/skills/network.md')));
    strict(await exists(workspace, '.lagune/skills/javascript.md'));
    strict.deepStrictEqual(
      await manifestCategories(workspace),
      everyCategory.filter((key) => key !== 'owasp')
    );
  });

  await it('never deletes a user-authored sub-skill', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: everyCategory,
    });
    await mkdir(join(workspace, '.lagune/skills'), { recursive: true });
    await writeFile(
      join(workspace, '.lagune/skills/graphql.md'),
      '# graphql\n',
      'utf8'
    );

    await runCli(workspace, ['remove', '--skills', ...everyCategory]);

    strict(
      await exists(workspace, '.lagune/skills/graphql.md'),
      'the user sub-skill survives a category remove'
    );
    strict(!(await exists(workspace, '.lagune/skills/regex.md')));
  });

  await it('reports a not installed category', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });
    const output = await runCli(workspace, [
      'remove',
      '--skills',
      'javascript',
    ]);

    strict(output.includes('not installed'));
  });

  await it('shows the usage helper with no flag', async () => {
    const workspace = await newWorkspace();

    const output = await runCli(workspace, ['remove']);

    strict(output.includes('usage: npx lagune remove --skills'));
  });
});

await describe('list reports findings and category state', async () => {
  await it('shows the findings, and no category state, with --findings', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });
    const output = await runCli(workspace, ['list', '--findings']);

    strict(output.includes('No findings tracked yet.'));
    strict(!/\[installed]/.test(output));
  });

  await it('maps each category to installed or available', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });
    const output = await runCli(workspace, ['list', '--skills']);

    strict(/owasp\s+\[installed]\s+Harden /.test(output));
    strict(/javascript\s+\[available]\s+Harden JavaScript/.test(output));
  });

  await it('reflects a category returning to available after remove', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: everyCategory,
    });
    await runCli(workspace, ['remove', '--skills', 'owasp']);
    const output = await runCli(workspace, ['list', '--skills']);

    strict(/owasp\s+\[available]/.test(output));
    strict(/javascript\s+\[installed]/.test(output));
  });
});
