import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { renderSpecializations } from '../../../src/core/specializations.js';
import { initInto, newWorkspace } from './__utils__.js';

const writeUserCatalog = (
  workspace: string,
  entries: { name: string; tags: string[] }[]
): Promise<void> =>
  writeFile(
    join(workspace, '.lagune', 'skills.json'),
    `${JSON.stringify({ name: 'lagune', entries }, null, 2)}\n`,
    'utf8'
  );

const writeUserSkillFile = async (
  workspace: string,
  name: string
): Promise<void> => {
  const dir = join(workspace, '.lagune', 'skills');

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${name}.md`), `# ${name}\n`, 'utf8');
};

const readSpecializations = async (workspace: string): Promise<string> => {
  await renderSpecializations(workspace);

  const raw = await readFile(
    join(workspace, '.lagune', 'specializations.md'),
    'utf8'
  );

  return raw.trim();
};

await describe('the scaffolded specializations file lists what is installed', async () => {
  await it('lists an installed built-in sub-skill', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });

    const output = await readSpecializations(workspace);
    const regexLine = output
      .split('\n')
      .find((line) => line.startsWith('regex'));

    strict(
      regexLine !== undefined,
      'the listing should mention the installed regex sub-skill'
    );
    strict(
      regexLine?.endsWith(' [required]') === true,
      'an installed required built-in line carries the [required] suffix'
    );
  });

  await it('omits a built-in whose category was not installed', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });

    const output = await readSpecializations(workspace);

    strict(
      !output.includes('javascript'),
      'an uninstalled category is not listed'
    );
  });

  await it('lists a user sub-skill present on disk with its tags', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });
    await writeUserCatalog(workspace, [
      { name: 'graphql', tags: ['GraphQL', 'Apollo', 'gql'] },
    ]);
    await writeUserSkillFile(workspace, 'graphql');

    const output = await readSpecializations(workspace);

    strict(
      output.includes('graphql: GraphQL, Apollo, gql'),
      'the listing should include the user sub-skill and its tags'
    );
    strict(
      output.includes('regex'),
      'the installed built-in sub-skills should still be listed'
    );
  });

  await it('omits a user catalog entry with no file on disk', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });
    await writeUserCatalog(workspace, [{ name: 'ghost', tags: ['nofile'] }]);

    const output = await readSpecializations(workspace);

    strict(
      !output.includes('ghost'),
      'a catalog entry without its .md file is not listed'
    );
  });

  await it('lets a user sub-skill shadow a built-in of the same name', async () => {
    const workspace = await newWorkspace();

    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });
    await writeUserCatalog(workspace, [{ name: 'regex', tags: ['custom'] }]);

    const output = await readSpecializations(workspace);
    const matches = output
      .split('\n')
      .filter((line) => line.startsWith('regex'));

    strict.strictEqual(matches.length, 1, 'regex should be listed once');
    strict.strictEqual(
      matches[0],
      'regex: custom',
      'the user entry should win'
    );
  });
});
