import type {
  FileOutcome,
  FileStatus,
  SkillCatalogEntry,
  SkillGroup,
} from '../../../src/types/core.js';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { SKILLS_CATALOG } from '../../../src/hooks/skills/catalog.js';
import {
  discoverSkills,
  presentSkillNames,
} from '../../../src/hooks/skills/discover.js';
import { SKILL_GROUPS } from '../../../src/hooks/skills/groups.js';
import {
  expandCategories,
  findGroup,
  groupKeysForSkill,
  groupOutcomesByCategory,
  installedGroupKeys,
  keepPresent,
  list,
  merge,
  skillNamesForGroups,
  skillsInGroup,
  unknownGroupKeys,
} from '../../../src/hooks/skills/skills.js';

const packageRoot = new URL('../../../', import.meta.url);

describe('list formats the catalog as a readable listing', () => {
  it('prints one line per sub-skill with its name and tags', () => {
    const output = list([
      { name: 'alpha', tags: ['one', 'two'], groups: [] },
      { name: 'beta', tags: ['three'], groups: [] },
    ]);

    strict.strictEqual(output, 'alpha: one, two\nbeta: three\n');
  });

  it('prints the bare name for a sub-skill with no tags', () => {
    strict.strictEqual(
      list([{ name: 'alpha', tags: [], groups: [] }]),
      'alpha\n'
    );
  });

  for (const entry of SKILLS_CATALOG)
    it('never repeats the name inside its own tags', () => {
      strict(
        !entry.tags.includes(entry.name),
        `${entry.name} should not list its own name as a tag`
      );
    });

  it('reports plainly when the catalog is empty', () => {
    strict.strictEqual(list([]), 'No sub-skills available.\n');
  });
});

describe('merge folds user sub-skills into the built-in catalog', () => {
  it('keeps every built-in when the user adds nothing', () => {
    const builtin = [{ name: 'regex', tags: ['RegExp'], groups: ['owasp'] }];

    strict.deepStrictEqual(merge(builtin, []), builtin);
  });

  it('appends a user sub-skill, carrying its groups through the spread', () => {
    const merged = merge(
      [{ name: 'regex', tags: ['RegExp'], groups: ['owasp'] }],
      [{ name: 'graphql', tags: ['GraphQL'], groups: [] }]
    );

    strict.deepStrictEqual(merged, [
      { name: 'regex', tags: ['RegExp'], groups: ['owasp'] },
      { name: 'graphql', tags: ['GraphQL'], groups: [] },
    ]);
  });

  it('lets the user sub-skill win a collision, replacing the built-in groups', () => {
    const merged = merge(
      [{ name: 'regex', tags: ['RegExp'], groups: ['owasp'] }],
      [{ name: 'regex', tags: ['custom'], groups: [] }]
    );

    strict.deepStrictEqual(merged, [
      { name: 'regex', tags: ['custom'], groups: [] },
    ]);
  });
});

await describe('discoverSkills reads the user catalog and fails closed', async () => {
  const withWorkspace = async (
    contents: string | null,
    assert: (entries: Awaited<ReturnType<typeof discoverSkills>>) => void
  ) => {
    const workspace = await mkdtemp(join(tmpdir(), 'blue-spec-discover-'));

    try {
      if (contents !== null) {
        await mkdir(join(workspace, '.bluespec'), { recursive: true });
        await writeFile(
          join(workspace, '.bluespec', 'skills.json'),
          contents,
          'utf8'
        );
      }

      assert(await discoverSkills(workspace));
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  };

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
        name: 'blue-spec',
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
        name: 'blue-spec',
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
        name: 'blue-spec',
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
        name: 'blue-spec',
        entries: [{ name: 'graphql', tags: ['GraphQL'], groups: 5 }],
      }),
      (entries) => {
        strict.deepStrictEqual(entries, []);
      }
    );
  });
});

await describe('the catalog and the sub-skill files stay in sync', async () => {
  const skillFiles = (
    await readdir(new URL('spec/skills/', packageRoot))
  ).filter((entry) => entry.endsWith('.md'));
  const fileNames = new Set(
    skillFiles.map((file) => file.replace(/\.md$/, ''))
  );
  const catalogNames = new Set(SKILLS_CATALOG.map((entry) => entry.name));

  for (const name of catalogNames)
    it('points every catalog entry at an existing sub-skill file', () => {
      strict(fileNames.has(name), `${name} has no spec/skills/${name}.md`);
    });

  for (const name of fileNames)
    it('lists every sub-skill file in the catalog', () => {
      strict(
        catalogNames.has(name),
        `spec/skills/${name}.md is not in the catalog`
      );
    });
});

describe('skillsInGroup derives membership by exact key', () => {
  it('returns the sub-skills of a group in catalog order', () => {
    strict.deepStrictEqual(skillsInGroup(SKILLS_CATALOG, 'owasp'), [
      'regex',
      'network',
      'interpreter',
      'path',
      'upload',
      'access-control',
      'credential-endpoint',
      'federation',
      'http-request',
      'transport',
      'crypto',
      'api-endpoint',
      'payment',
      'xml',
      'csv',
      'container',
      'serverless',
    ]);
    strict.deepStrictEqual(skillsInGroup(SKILLS_CATALOG, 'infra'), [
      'container',
      'serverless',
    ]);
    strict.deepStrictEqual(skillsInGroup(SKILLS_CATALOG, 'javascript'), [
      'javascript',
      'browser',
    ]);
  });

  it('matches the key strictly, never the display label', () => {
    strict.deepStrictEqual(skillsInGroup(SKILLS_CATALOG, 'OWASP'), []);
  });

  it('returns [] for an unknown key', () => {
    strict.deepStrictEqual(skillsInGroup(SKILLS_CATALOG, 'nope'), []);
  });

  it('places a multi-group sub-skill under every one of its keys', () => {
    const catalog = [
      { name: 'shared', tags: [], groups: ['owasp', 'javascript'] },
    ];

    strict.deepStrictEqual(skillsInGroup(catalog, 'owasp'), ['shared']);
    strict.deepStrictEqual(skillsInGroup(catalog, 'javascript'), ['shared']);
  });
});

describe('findGroup resolves a descriptor by exact key', () => {
  it('returns the descriptor for a known key', () => {
    strict.deepStrictEqual(findGroup(SKILL_GROUPS, 'owasp'), {
      key: 'owasp',
      label: 'OWASP',
      description: 'Harden against the application security risks OWASP tracks',
    });
  });

  it('returns undefined for a wrong-case key', () => {
    strict.strictEqual(findGroup(SKILL_GROUPS, 'OWASP'), undefined);
  });

  it('returns undefined for an unknown key', () => {
    strict.strictEqual(findGroup(SKILL_GROUPS, 'nope'), undefined);
  });
});

describe('the group registry and the catalog stay in sync', () => {
  const groupKeys = new Set(SKILL_GROUPS.map((group) => group.key));

  for (const entry of SKILLS_CATALOG)
    for (const key of entry.groups)
      it('points every catalog group key at a registered group', () => {
        strict(
          groupKeys.has(key),
          `${entry.name} references unknown group ${key}`
        );
      });

  for (const group of SKILL_GROUPS)
    it('claims every registered group with at least one sub-skill', () => {
      strict(
        skillsInGroup(SKILLS_CATALOG, group.key).length > 0,
        `group ${group.key} has no sub-skills`
      );
    });

  it('keeps group keys unique and lowercase', () => {
    strict.strictEqual(groupKeys.size, SKILL_GROUPS.length);

    for (const group of SKILL_GROUPS)
      strict.strictEqual(
        group.key,
        group.key.toLowerCase(),
        `group key ${group.key} is not lowercase`
      );
  });

  for (const entry of SKILLS_CATALOG)
    it('claims every built-in sub-skill in at least one group', () => {
      strict(
        entry.groups.length > 0,
        `built-in ${entry.name} belongs to no group`
      );
    });
});

describe('expandCategories resolves the reserved all selector', () => {
  it('returns every registered key in registry order for all', () => {
    strict.deepStrictEqual(
      expandCategories(SKILL_GROUPS, ['all']),
      SKILL_GROUPS.map((group) => group.key)
    );
  });

  it('expands all even when mixed with other keys', () => {
    strict.deepStrictEqual(
      expandCategories(SKILL_GROUPS, ['owasp', 'all']),
      SKILL_GROUPS.map((group) => group.key)
    );
  });

  it('returns the keys unchanged when all is absent', () => {
    strict.deepStrictEqual(expandCategories(SKILL_GROUPS, ['owasp']), [
      'owasp',
    ]);
  });

  it('returns [] for no keys', () => {
    strict.deepStrictEqual(expandCategories(SKILL_GROUPS, []), []);
  });
});

describe('skillNamesForGroups collects sub-skills across keys', () => {
  it('returns the sub-skills of a single key in catalog order', () => {
    strict.deepStrictEqual(skillNamesForGroups(SKILLS_CATALOG, ['owasp']), [
      'regex',
      'network',
      'interpreter',
      'path',
      'upload',
      'access-control',
      'credential-endpoint',
      'federation',
      'http-request',
      'transport',
      'crypto',
      'api-endpoint',
      'payment',
      'xml',
      'csv',
      'container',
      'serverless',
    ]);
  });

  it('merges multiple keys, preserving catalog order over key order', () => {
    strict.deepStrictEqual(
      skillNamesForGroups(SKILLS_CATALOG, ['owasp', 'javascript']),
      [
        'regex',
        'javascript',
        'browser',
        'network',
        'interpreter',
        'path',
        'upload',
        'access-control',
        'credential-endpoint',
        'federation',
        'http-request',
        'transport',
        'crypto',
        'api-endpoint',
        'payment',
        'xml',
        'csv',
        'container',
        'serverless',
      ]
    );
  });

  it('returns [] for no keys', () => {
    strict.deepStrictEqual(skillNamesForGroups(SKILLS_CATALOG, []), []);
  });

  it('lists a multi-group sub-skill once when several of its keys match', () => {
    const catalog = [
      { name: 'shared', tags: [], groups: ['owasp', 'javascript'] },
    ];

    strict.deepStrictEqual(
      skillNamesForGroups(catalog, ['owasp', 'javascript']),
      ['shared']
    );
  });
});

describe('unknownGroupKeys reports keys with no registered group', () => {
  it('returns the unregistered keys in the order requested', () => {
    strict.deepStrictEqual(unknownGroupKeys(SKILL_GROUPS, ['owasp', 'nope']), [
      'nope',
    ]);
  });

  it('returns [] when every key is registered', () => {
    strict.deepStrictEqual(
      unknownGroupKeys(SKILL_GROUPS, ['owasp', 'javascript']),
      []
    );
  });

  it('treats a wrong-case key as unknown', () => {
    strict.deepStrictEqual(unknownGroupKeys(SKILL_GROUPS, ['OWASP']), [
      'OWASP',
    ]);
  });
});

describe('groupKeysForSkill narrows candidates to a sub-skill', () => {
  const catalog = [
    { name: 'shared', tags: [], groups: ['owasp', 'javascript'] },
  ];

  it('keeps the single candidate key whose group has the sub-skill', () => {
    strict.deepStrictEqual(
      groupKeysForSkill(catalog, 'shared', ['javascript']),
      ['javascript']
    );
  });

  it('keeps every candidate key whose group has the sub-skill', () => {
    strict.deepStrictEqual(
      groupKeysForSkill(catalog, 'shared', ['owasp', 'javascript']),
      ['owasp', 'javascript']
    );
  });

  it('returns [] for a name absent from the catalog', () => {
    strict.deepStrictEqual(
      groupKeysForSkill(catalog, 'missing', ['owasp', 'javascript']),
      []
    );
  });
});

describe('installedGroupKeys lists groups with a present built-in', () => {
  it('claims a group once any of its sub-skills is present', () => {
    strict.deepStrictEqual(
      installedGroupKeys(SKILL_GROUPS, SKILLS_CATALOG, ['regex', 'network']),
      ['owasp']
    );
  });

  it('claims every group whose sub-skills are present', () => {
    strict.deepStrictEqual(
      installedGroupKeys(SKILL_GROUPS, SKILLS_CATALOG, [
        'regex',
        'network',
        'javascript',
      ]),
      ['owasp', 'javascript']
    );
  });

  it('claims a group from a single present member', () => {
    strict.deepStrictEqual(
      installedGroupKeys(SKILL_GROUPS, SKILLS_CATALOG, ['regex']),
      ['owasp']
    );
  });

  it('claims every group a multi-group member belongs to, in registry order', () => {
    strict.deepStrictEqual(
      installedGroupKeys(SKILL_GROUPS, SKILLS_CATALOG, ['browser']),
      ['lovable', 'javascript']
    );
  });

  it('returns [] when nothing is present', () => {
    strict.deepStrictEqual(
      installedGroupKeys(SKILL_GROUPS, SKILLS_CATALOG, []),
      []
    );
  });
});

describe('keepPresent filters the catalog to present sub-skills', () => {
  it('keeps only the entry whose name is present', () => {
    strict.deepStrictEqual(keepPresent(SKILLS_CATALOG, ['regex']), [
      { name: 'regex', tags: ['Regular Expression'], groups: ['owasp'] },
    ]);
  });

  it('returns [] when none are present', () => {
    strict.deepStrictEqual(keepPresent(SKILLS_CATALOG, []), []);
  });
});

await describe('presentSkillNames reads the installed sub-skill files', async () => {
  const withSkillsDir = async (
    files: string[] | null,
    assert: (names: string[]) => void
  ) => {
    const workspace = await mkdtemp(join(tmpdir(), 'blue-spec-present-'));

    try {
      if (files !== null) {
        await mkdir(join(workspace, '.bluespec', 'skills'), {
          recursive: true,
        });

        for (const file of files)
          await writeFile(
            join(workspace, '.bluespec', 'skills', file),
            '# x\n',
            'utf8'
          );
      }

      assert(await presentSkillNames(workspace));
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  };

  await it('returns [] when the skills directory is absent', async () => {
    await withSkillsDir(null, (names) => {
      strict.deepStrictEqual(names, []);
    });
  });

  await it('returns each .md file name without its extension', async () => {
    await withSkillsDir(['regex.md', 'network.md'], (names) => {
      strict.deepStrictEqual(names.slice().sort(), ['network', 'regex']);
    });
  });

  await it('ignores non-markdown files', async () => {
    await withSkillsDir(['regex.md', 'notes.txt'], (names) => {
      strict.deepStrictEqual(names, ['regex']);
    });
  });
});

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
  ): FileOutcome => ({ path: `.bluespec/skills/${name}.md`, status, keptBy });

  it('uses the friendly label and the shared skills dir as the header', () => {
    const result = groupOutcomesByCategory(
      [outcome('python', 'created')],
      catalog,
      groups,
      ['python']
    );

    strict.strictEqual(result.length, 1);
    strict.strictEqual(result[0].label, 'Python');
    strict.strictEqual(result[0].baseDir, '.bluespec/skills/');
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
        ['OWASP', ['.bluespec/skills/regex.md', '.bluespec/skills/network.md']],
        ['Python', ['.bluespec/skills/python.md']],
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
