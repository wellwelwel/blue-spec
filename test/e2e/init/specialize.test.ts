import { describe, it, strict } from 'poku';
import { ACTIONS } from '../../../src/dashboard/server/actions.js';
import {
  initInto,
  newWorkspace,
  packageRoot,
  readManifest,
} from './__utils__.js';

const handler = ACTIONS.get('/api/actions/specialize');

const categoriesOf = async (workspace: string): Promise<string[]> => {
  const manifest = await readManifest(workspace);
  const categories = manifest.categories;
  return Array.isArray(categories) ? [...categories].sort() : [];
};

await describe('dashboard specialize action', async () => {
  strict.ok(handler, 'the /api/actions/specialize route is registered');
  if (!handler) return;

  await it('adds the newly selected categories', async () => {
    const workspace = await newWorkspace();
    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });

    const result = await handler(
      { categories: ['owasp', 'rust'] },
      { cwd: workspace, packageRoot }
    );

    strict.strictEqual(result.status, 200);
    strict.strictEqual(result.body.ok, true);
    strict.ok(
      'added' in result.body && result.body.added > 0,
      'reports added skill files'
    );
    strict.deepStrictEqual(await categoriesOf(workspace), ['owasp', 'rust']);
  });

  await it('removes the deselected categories', async () => {
    const workspace = await newWorkspace();
    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp', 'rust'],
    });

    const result = await handler(
      { categories: ['rust'] },
      { cwd: workspace, packageRoot }
    );

    strict.strictEqual(result.status, 200);
    strict.ok(
      'removed' in result.body && result.body.removed > 0,
      'reports removed skill files'
    );
    strict.deepStrictEqual(await categoriesOf(workspace), ['rust']);
  });

  await it('reconciles to an empty set', async () => {
    const workspace = await newWorkspace();
    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });

    const result = await handler(
      { categories: [] },
      { cwd: workspace, packageRoot }
    );

    strict.strictEqual(result.status, 200);
    strict.deepStrictEqual(await categoriesOf(workspace), []);
  });

  await it('rejects an unknown field', async () => {
    const workspace = await newWorkspace();
    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });

    const result = await handler(
      { agent: 'claude', categories: ['owasp'] },
      { cwd: workspace, packageRoot }
    );

    strict.strictEqual(result.status, 400);
  });

  await it('rejects an unknown category', async () => {
    const workspace = await newWorkspace();
    await initInto(workspace, {
      init: true,
      agent: 'claude',
      skills: ['owasp'],
    });

    const result = await handler(
      { categories: ['owasp', 'nope'] },
      { cwd: workspace, packageRoot }
    );

    strict.strictEqual(result.status, 400);
  });

  await it('returns 409 when the project was never initialized', async () => {
    const workspace = await newWorkspace();

    const result = await handler(
      { categories: ['owasp'] },
      { cwd: workspace, packageRoot }
    );

    strict.strictEqual(result.status, 409);
  });
});
