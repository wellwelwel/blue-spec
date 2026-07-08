import type { Frontmatter } from '../../../src/types/test.js';
import { describe, it, strict } from 'poku';
import { parse } from 'yaml.min';
import { listFrontmatterSources, packageRoot } from './__utils__.js';

const SKILL_KEYS: Record<keyof Required<Frontmatter>, true> = {
  name: true,
  description: true,
  'argument-hint': true,
  'user-invocable': true,
  metadata: true,
};

const { metadata, ...CORE_KEYS } = SKILL_KEYS;

const specSources = await listFrontmatterSources(new URL('spec/', packageRoot));

const skillSources = await listFrontmatterSources(
  new URL('.claude/skills/', packageRoot),
  (relativePath) => relativePath.endsWith('SKILL.md')
);

const assertValid = (
  frontmatter: string,
  allowed: Record<string, true>
): void => {
  const parsed = parse<Frontmatter>(frontmatter);

  strict(
    typeof parsed === 'object' && parsed !== null,
    'frontmatter should parse to an object'
  );

  strict.strictEqual(
    typeof parsed.description,
    'string',
    'description is required and must be a string'
  );

  if ('name' in parsed)
    strict.strictEqual(
      typeof parsed.name,
      'string',
      'name must be a string when present'
    );

  if ('user-invocable' in parsed)
    strict.strictEqual(
      typeof parsed['user-invocable'],
      'boolean',
      'user-invocable must be a boolean when present'
    );

  if ('metadata' in parsed)
    strict.deepStrictEqual(
      parsed.metadata,
      { internal: true },
      'metadata carries only the skills.sh internal marker'
    );

  const unknownKeys = Object.keys(parsed).filter((key) => !(key in allowed));

  strict.deepStrictEqual(
    unknownKeys,
    [],
    `unexpected frontmatter keys: ${unknownKeys.join(', ')}`
  );
};

describe('every spec frontmatter is valid and well-typed', () => {
  it('finds spec files that declare frontmatter', () => {
    strict(
      specSources.length > 0,
      'at least one spec .md file should declare frontmatter'
    );
  });

  for (const { relativePath, frontmatter } of specSources)
    it(`spec/${relativePath} declares only name, description, and user-invocable`, () => {
      assertValid(frontmatter, CORE_KEYS);
    });
});

describe('every internal skill frontmatter is valid and well-typed', () => {
  it('finds SKILL.md files under .claude/skills', () => {
    strict(
      skillSources.length > 0,
      'at least one SKILL.md should declare frontmatter'
    );
  });

  for (const { relativePath, frontmatter } of skillSources)
    it(`.claude/skills/${relativePath} declares only known keys`, () => {
      assertValid(frontmatter, SKILL_KEYS);
    });
});
