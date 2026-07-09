import { describe, it, strict } from 'poku';
import { withWorkspace } from './__utils__.js';

await describe('discoverSkills reads the user catalog and fails closed', async () => {
  await it('returns [] when the catalog is missing', async () => {
    await withWorkspace(null, (entries) => {
      strict.deepStrictEqual(entries, []);
    });
  });

  await it('returns [] when the catalog is malformed JSON', async () => {
    await withWorkspace('{ not json', (entries) => {
      strict.deepStrictEqual(entries, []);
    });
  });

  await it('parses valid entries and drops malformed ones', async () => {
    await withWorkspace(
      JSON.stringify({
        name: 'lagune',
        entries: [
          { name: 'graphql', tags: ['GraphQL', 'gql'] },
          { name: 'broken' },
          { tags: ['no name'] },
        ],
      }),
      (entries) => {
        strict.deepStrictEqual(entries, [
          { name: 'graphql', tags: ['GraphQL', 'gql'], groups: [] },
        ]);
      }
    );
  });

  await it('defaults a missing groups field to an empty array', async () => {
    await withWorkspace(
      JSON.stringify({
        name: 'lagune',
        entries: [{ name: 'graphql', tags: ['GraphQL'] }],
      }),
      (entries) => {
        strict.deepStrictEqual(entries, [
          { name: 'graphql', tags: ['GraphQL'], groups: [] },
        ]);
      }
    );
  });

  await it('round-trips a valid groups field', async () => {
    await withWorkspace(
      JSON.stringify({
        name: 'lagune',
        entries: [{ name: 'graphql', tags: ['GraphQL'], groups: ['owasp'] }],
      }),
      (entries) => {
        strict.deepStrictEqual(entries, [
          { name: 'graphql', tags: ['GraphQL'], groups: ['owasp'] },
        ]);
      }
    );
  });

  await it('drops an entry whose groups is present but not a string array', async () => {
    await withWorkspace(
      JSON.stringify({
        name: 'lagune',
        entries: [{ name: 'graphql', tags: ['GraphQL'], groups: 5 }],
      }),
      (entries) => {
        strict.deepStrictEqual(entries, []);
      }
    );
  });
});
