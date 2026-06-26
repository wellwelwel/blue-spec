import { spawn } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execPath } from 'node:process';
import { describe, it, strict } from 'poku';
import { initInto, newWorkspace, packageRoot } from './__utils__.js';

const bin = new URL('lib/bin/index.js', packageRoot).pathname;

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
    await readFile(join(workspace, '.bluespec/manifest.json'), 'utf8')
  );

  return parsed.categories ?? [];
};

await describe('add installs specializations by category', async () => {
  await it('copies the category sub-skills and records them in the manifest', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await runCli(workspace, ['add', '--skills', 'owasp']);

    strict(await exists(workspace, '.bluespec/skills/regex.md'));
    strict(await exists(workspace, '.bluespec/skills/network.md'));
    strict(!(await exists(workspace, '.bluespec/skills/javascript.md')));
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

  await it('installs every category with --skills all', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude' });
    await runCli(workspace, ['add', '--skills', 'all']);

    for (const skill of [
      'regex.md',
      'network.md',
      'javascript.md',
      'browser.md',
    ])
      strict(await exists(workspace, `.bluespec/skills/${skill}`));

    strict.deepStrictEqual(
      (await manifestCategories(workspace)).slice().sort(),
      ['javascript', 'owasp']
    );
  });

  await it('shows the usage helper with no flag and writes nothing', async () => {
    const workspace = await newWorkspace();

    const output = await runCli(workspace, ['add']);

    strict(output.includes('usage: npx blue-spec add --skills'));
    strict(!(await exists(workspace, '.bluespec')));
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

    await initInto(workspace, { init: true, agent: 'claude', skills: ['all'] });
    await runCli(workspace, ['remove', '--skills', 'owasp']);

    strict(!(await exists(workspace, '.bluespec/skills/regex.md')));
    strict(!(await exists(workspace, '.bluespec/skills/network.md')));
    strict(await exists(workspace, '.bluespec/skills/javascript.md'));
    strict.deepStrictEqual(await manifestCategories(workspace), ['javascript']);
  });

  await it('never deletes a user-authored sub-skill', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude', skills: ['all'] });
    await mkdir(join(workspace, '.bluespec/skills'), { recursive: true });
    await writeFile(
      join(workspace, '.bluespec/skills/graphql.md'),
      '# graphql\n',
      'utf8'
    );

    await runCli(workspace, ['remove', '--skills', 'all']);

    strict(
      await exists(workspace, '.bluespec/skills/graphql.md'),
      'the user sub-skill survives a category remove'
    );
    strict(!(await exists(workspace, '.bluespec/skills/regex.md')));
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

    strict(output.includes('usage: npx blue-spec remove --skills'));
  });
});

await describe('list reports category state', async () => {
  await it('shows the usage helper with no flag', async () => {
    const workspace = await newWorkspace();

    const output = await runCli(workspace, ['list']);

    strict(output.includes('usage: npx blue-spec list --skills'));
  });

  await it('maps each category to installed or available', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });
    const output = await runCli(workspace, ['list', '--skills']);

    strict(
      /owasp\s+\[installed]\s+Harden against the application security risks OWASP tracks/.test(
        output
      )
    );
    strict(
      /javascript\s+\[available]\s+JavaScript and its runtimes/.test(output)
    );
  });

  await it('reflects a category returning to available after remove', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, { init: true, agent: 'claude', skills: ['all'] });
    await runCli(workspace, ['remove', '--skills', 'owasp']);
    const output = await runCli(workspace, ['list', '--skills']);

    strict(/owasp\s+\[available]/.test(output));
    strict(/javascript\s+\[installed]/.test(output));
  });
});
