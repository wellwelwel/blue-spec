import type {
  FileOutcome,
  FileStatus,
  SkillCatalogEntry,
  SkillGroup,
} from '../../../../src/types/core.js';
import { describe, it, strict } from 'poku';
import { groupOutcomesByCategory } from '../../../../src/hooks/skills/skills.js';

describe('groupOutcomesByCategory buckets sub-skills under their category', () => {
  const catalog: SkillCatalogEntry[] = [
    { name: 'regex', tags: [], groups: ['owasp'] },
    { name: 'network', tags: [], groups: ['owasp'] },
    { name: 'python', tags: [], groups: ['python'] },
  ];
  const groups: SkillGroup[] = [
    { key: 'owasp', label: 'OWASP', description: '' },
    { key: 'python', label: 'Python', description: '' },
  ];
  const outcome = (
    name: string,
    status: FileStatus,
    keptBy?: string
  ): FileOutcome => ({ path: `.lagune/skills/${name}.md`, status, keptBy });

  it('uses the friendly label and the shared skills dir as the header', () => {
    const result = groupOutcomesByCategory(
      [outcome('python', 'created')],
      catalog,
      groups,
      ['python']
    );

    strict.strictEqual(result.length, 1);
    strict.strictEqual(result[0].label, 'Python');
    strict.strictEqual(result[0].baseDir, '.lagune/skills/');
  });

  it('splits outcomes across the categories that requested them', () => {
    const result = groupOutcomesByCategory(
      [
        outcome('regex', 'skipped'),
        outcome('network', 'skipped'),
        outcome('python', 'created'),
      ],
      catalog,
      groups,
      ['owasp', 'python']
    );

    strict.deepStrictEqual(
      result.map((group) => [
        group.label,
        group.outcomes.map((entry) => entry.path),
      ]),
      [
        ['OWASP', ['.lagune/skills/regex.md', '.lagune/skills/network.md']],
        ['Python', ['.lagune/skills/python.md']],
      ]
    );
  });

  it('places a shared sub-skill under the first requested category only', () => {
    const shared: SkillCatalogEntry[] = [
      { name: 'shared', tags: [], groups: ['owasp', 'python'] },
    ];
    const result = groupOutcomesByCategory(
      [outcome('shared', 'created')],
      shared,
      groups,
      ['owasp', 'python']
    );

    strict.deepStrictEqual(
      result.map((group) => group.label),
      ['OWASP']
    );
  });

  it('carries each outcome status through', () => {
    const result = groupOutcomesByCategory(
      [outcome('regex', 'removed'), outcome('network', 'kept', 'x')],
      catalog,
      groups,
      ['owasp']
    );

    strict.deepStrictEqual(
      result[0].outcomes.map((entry) => entry.status),
      ['removed', 'kept']
    );
  });

  it('drops a requested category that produced no outcomes', () => {
    const result = groupOutcomesByCategory(
      [outcome('python', 'created')],
      catalog,
      groups,
      ['owasp', 'python']
    );

    strict.deepStrictEqual(
      result.map((group) => group.label),
      ['Python']
    );
  });

  it('returns [] for no outcomes', () => {
    strict.deepStrictEqual(
      groupOutcomesByCategory([], catalog, groups, ['owasp']),
      []
    );
  });
});
