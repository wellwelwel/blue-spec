import { describe, it, strict } from 'poku';
import { buildCharter } from '../../../src/dashboard/server/data/build/charter.js';
import { stripComments } from '../../../src/dashboard/server/data/markdown/comments.js';
import { bulletField } from '../../../src/dashboard/server/data/markdown/fields.js';
import {
  headingLevel,
  structuralText,
} from '../../../src/dashboard/server/data/markdown/lines.js';
import {
  firstParagraph,
  sectionBlocks,
  sectionBullets,
  sectionIntro,
  withinSection,
} from '../../../src/dashboard/server/data/markdown/sections.js';
import { parseSkills } from '../../../src/dashboard/server/data/parsers.js';

const lines = (...items: string[]): string => items.join('\n');

describe('stripComments removes template guidance without touching content', () => {
  it('splices a trailing comment off a heading', () => {
    strict.strictEqual(
      stripComments('### Finding name <!-- Example: SQL injection -->').trim(),
      '### Finding name'
    );
  });

  it('removes a whole-line comment together with its line', () => {
    strict.strictEqual(
      stripComments(lines('before', '<!-- guidance -->', 'after')),
      lines('before', 'after')
    );
  });

  it('removes a multi-line guidance block entirely', () => {
    const text = lines(
      '## Findings',
      '<!--',
      '### File uploads',
      '- **What it is:** example field inside guidance',
      '-->',
      '### Real finding'
    );

    strict.strictEqual(
      stripComments(text),
      lines('## Findings', '### Real finding')
    );
  });

  it('ends a block comment at the first close, fences inside are inert', () => {
    const text = lines('<!--', '```ts', 'example()', '-->', '## Findings');

    strict.strictEqual(stripComments(text), '## Findings');
  });

  it('leaves an unterminated open literal but still strips later comments', () => {
    const text = lines('a <!-- never closed', '', 'b <!-- closed --> c');

    strict.strictEqual(
      stripComments(text),
      lines('a <!-- never closed', '', 'b  c')
    );
  });

  it('preserves comment markers inside fenced code', () => {
    const text = lines('```html', '<!-- kept -->', '```');

    strict.strictEqual(stripComments(text), text);
  });

  it('does not let a fenced arrow close a stray inline open', () => {
    const text = lines(
      'accepted <!-- check the list',
      '',
      '```mermaid',
      'upload --> scanner',
      '```'
    );

    strict.strictEqual(stripComments(text), text);
  });

  it('preserves comment markers inside inline code', () => {
    const text = 'markers like `<!-- internal -->` leak paths';

    strict.strictEqual(stripComments(text), text);
  });

  it('splices two comments on one line', () => {
    strict.strictEqual(stripComments('a <!-- x --> b <!-- y --> c'), 'a  b  c');
  });

  it('ignores an orphan close', () => {
    strict.strictEqual(stripComments('a --> b'), 'a --> b');
  });

  it('splices a block comment with trailing text after the close', () => {
    strict.strictEqual(
      stripComments(lines('<!-- note --> kept', 'after')),
      lines(' kept', 'after')
    );
  });
});

describe('sectionBlocks ignores structure inside code fences', () => {
  it('keeps findings whole across a fenced code example', () => {
    const text = lines(
      '## Findings',
      '### SQL injection',
      '- **What it is:** real field.',
      '```ts',
      '## not a section',
      '### not a finding',
      '- **What it is:** not a field',
      '```',
      '### Hardcoded key',
      '- **What it is:** committed key.'
    );

    const blocks = sectionBlocks(text, 'Findings');
    strict.deepStrictEqual(
      blocks.map((block) => block.name),
      ['SQL injection', 'Hardcoded key']
    );
    strict.strictEqual(blocks[0].body.includes('## not a section'), true);
  });

  it('treats tilde fences the same way', () => {
    const text = lines(
      '## Findings',
      '### Only one',
      '~~~',
      '### fenced',
      '~~~'
    );

    strict.deepStrictEqual(
      sectionBlocks(text, 'Findings').map((block) => block.name),
      ['Only one']
    );
  });

  it('keeps a markdown example inside a longer outer fence as one body', () => {
    const text = lines(
      '## Findings',
      '### Documented finding',
      '````markdown',
      '```ts',
      'code()',
      '```',
      '### still fenced',
      '````',
      'closing prose.'
    );

    const blocks = sectionBlocks(text, 'Findings');
    strict.deepStrictEqual(
      blocks.map((block) => block.name),
      ['Documented finding']
    );
    strict.strictEqual(blocks[0].body.includes('closing prose.'), true);
  });

  it('ends the section at an h1, so appendix notes are not findings', () => {
    const text = lines(
      '## Findings',
      '### Real finding',
      '- **What it is:** real.',
      '# Appendix',
      '### Appendix note'
    );

    strict.deepStrictEqual(
      sectionBlocks(text, 'Findings').map((block) => block.name),
      ['Real finding']
    );
  });

  it('keeps deeper headings inside the finding body', () => {
    const text = lines(
      '## Findings',
      '### Deep finding',
      '#### Remediation detail',
      'prose.'
    );

    const blocks = sectionBlocks(text, 'Findings');
    strict.strictEqual(blocks.length, 1);
    strict.strictEqual(
      blocks[0].body.includes('#### Remediation detail'),
      true
    );
  });
});

describe('bulletField reads only structural field lines', () => {
  it('ignores a field-shaped line inside a fence', () => {
    const body = lines(
      '```diff',
      '- **Status:** old line from a diff',
      '```',
      '- **Status:** Applied'
    );

    strict.strictEqual(bulletField(body, 'Status'), 'Applied');
  });

  it('skips a blank field line and keeps scanning', () => {
    const body = lines('- **Where:**', '- **Where:** src/login.ts');

    strict.strictEqual(bulletField(body, 'Where'), 'src/login.ts');
  });
});

describe('prose extractors skip fences and headings', () => {
  it('sectionBullets ignores diagram content and heading lines', () => {
    const text = lines(
      '## Remaining',
      '- Review the admin panel.',
      '```mermaid',
      'graph TD',
      '  login --> validator',
      '```',
      '#### Notes',
      'still glued prose.'
    );

    strict.deepStrictEqual(sectionBullets(text, 'Remaining'), [
      'Review the admin panel. still glued prose.',
    ]);
  });

  it('firstParagraph skips a leading heading and fence, then takes prose', () => {
    const body = lines(
      '#### Context',
      '```ts',
      'code()',
      '```',
      'Every credential gets the minimum scope.',
      '',
      'Second paragraph.'
    );

    strict.strictEqual(
      firstParagraph(body),
      'Every credential gets the minimum scope.'
    );
  });

  it('sectionIntro stops at any heading and skips fences', () => {
    const text = lines(
      '## Baseline discipline',
      'Keep the basics locked down.',
      '```yaml',
      'Version: 99',
      '```',
      '#### Aside',
      'not intro anymore.'
    );

    strict.strictEqual(
      sectionIntro(text, 'Baseline discipline'),
      'Keep the basics locked down.'
    );
  });
});

describe('parseSkills reads only structural rows', () => {
  it('ignores a fenced example row', () => {
    const text = lines(
      '## Applied sub-skills',
      '- `.bluespec/skills/authentication.md`: surfaced Weak cookie.',
      '```markdown',
      '- `.bluespec/skills/file-uploads.md`: example row.',
      '```'
    );

    strict.deepStrictEqual(
      parseSkills(text).map((skill) => skill.name),
      ['authentication']
    );
  });
});

describe('field lines tolerate common LLM punctuation drift', () => {
  const driftedForms = [
    '- **What it is:** value',
    '- **What it is** — value',
    '- **What it is**: value',
    '- **What it is** - value',
    '- **What it is :** value',
    '- What it is: value',
    '- What it is — value',
    '- **What It Is:** value',
    '* **What it is:** value',
    '- __What it is:__ value',
  ];

  for (const line of driftedForms)
    it(`reads \`${line}\``, () => {
      strict.strictEqual(bulletField(line, 'What it is'), 'value');
    });

  it('keeps first-line-wins across drifted shapes', () => {
    const body = lines('- **Status** — Applied', '- **Status:** Verified');

    strict.strictEqual(bulletField(body, 'Status'), 'Applied');
  });

  it('does not mistake prose for a field without a separator', () => {
    strict.strictEqual(
      bulletField('- What it is important to note', 'What it is'),
      null
    );
  });

  it('does not treat a word-internal hyphen as a separator', () => {
    strict.strictEqual(
      bulletField('- Status-quo remains: unclear', 'Status'),
      null
    );
  });

  it('does not match a longer bolded name', () => {
    strict.strictEqual(bulletField('- **Status code:** 500', 'Status'), null);
  });

  it('still requires the bullet marker', () => {
    strict.strictEqual(bulletField('**Status:** Applied', 'Status'), null);
  });

  it('still skips a drifted field with a blank value', () => {
    const body = lines('- **Where** —', '- Where: src/login.ts');

    strict.strictEqual(bulletField(body, 'Where'), 'src/login.ts');
  });
});

describe('list markers tolerate drift beyond the dash', () => {
  it('sectionBullets accepts asterisk and plus items', () => {
    const text = lines(
      '## Remaining',
      '- first item.',
      '* second item.',
      '+ third item.'
    );

    strict.deepStrictEqual(sectionBullets(text, 'Remaining'), [
      'first item.',
      'second item.',
      'third item.',
    ]);
  });

  it('parseSkills accepts a drifted separator and marker', () => {
    const text = lines(
      '## Applied sub-skills',
      '- `.bluespec/skills/authentication.md` — surfaced Weak cookie.',
      '* `.bluespec/skills/injection.md`: surfaced SQL injection.',
      '- `.bluespec/skills/uploads.md` no separator at all'
    );

    strict.deepStrictEqual(
      parseSkills(text).map((skill) => [skill.name, skill.surfaced]),
      [
        ['authentication', 'surfaced Weak cookie.'],
        ['injection', 'surfaced SQL injection.'],
      ]
    );
  });

  it('buildCharter keeps drifted bullets and drops drifted rationale', () => {
    const charter = lines(
      '## Baseline discipline',
      '',
      'Keep the basics locked down.',
      '',
      '### Secrets',
      '',
      'Never commit secrets.',
      '',
      '- Use the platform keychain.',
      '* Rotate tokens quarterly.',
      '- Why — because leaked secrets outlive rotation.',
      '- Why we also audit: it is prose, not rationale.'
    );

    strict.deepStrictEqual(buildCharter(charter).baseline.items[0].bullets, [
      'Use the platform keychain.',
      'Rotate tokens quarterly.',
      'Why we also audit: it is prose, not rationale.',
    ]);
  });
});

describe('indented code blocks are opaque too', () => {
  it('sectionBullets does not glue indented code onto a bullet', () => {
    const text = lines(
      '## Remaining',
      '',
      '- Review the admin panel.',
      '',
      'Prose after.',
      '',
      '    ## indented code line',
      '    node server.js'
    );

    strict.deepStrictEqual(sectionBullets(text, 'Remaining'), [
      'Review the admin panel. Prose after.',
    ]);
  });

  it('stripComments preserves a comment inside indented code', () => {
    const text = lines('example:', '', '    <!-- kept -->', '', 'after');

    strict.strictEqual(stripComments(text), text);
  });
});

describe('withinSection yields only the matched section body', () => {
  const bodies = (text: string, header: string): string[] =>
    [
      ...withinSection(
        text,
        (heading) => heading.trim().toLowerCase() === header.toLowerCase()
      ),
    ].map((line) => line.text);

  it('yields the body lines and excludes the header and outside lines', () => {
    const text = lines(
      'before section',
      '## Target',
      'inside one',
      'inside two',
      '## Other',
      'outside'
    );

    strict.deepStrictEqual(bodies(text, 'Target'), [
      'inside one',
      'inside two',
    ]);
  });

  it('resets at an h1 so a later section does not leak in', () => {
    const text = lines(
      '## Target',
      'inside',
      '# Appendix',
      '## Target',
      'reopened'
    );

    strict.deepStrictEqual(bodies(text, 'Target'), ['inside', 'reopened']);
  });

  it('does not treat a fenced heading as a boundary', () => {
    const text = lines(
      '## Target',
      'inside',
      '```',
      '## Other',
      '```',
      'still inside'
    );

    strict.deepStrictEqual(bodies(text, 'Target'), [
      'inside',
      '```',
      '## Other',
      '```',
      'still inside',
    ]);
  });

  it('matches the header case-insensitively via the predicate', () => {
    const text = lines('## TARGET', 'inside');

    strict.deepStrictEqual(bodies(text, 'target'), ['inside']);
  });
});

describe('heading and fence primitives', () => {
  it('headingLevel accepts h1 through h6 and rejects the rest', () => {
    strict.strictEqual(headingLevel('# a'), 1);
    strict.strictEqual(headingLevel('###### a'), 6);
    strict.strictEqual(headingLevel('####### a'), 0);
    strict.strictEqual(headingLevel('#nospace'), 0);
    strict.strictEqual(headingLevel('  ## indented'), 0);
    strict.strictEqual(headingLevel('prose'), 0);
  });

  it('structuralText drops fenced lines and keeps the rest', () => {
    const text = lines('# Title', '```', '# fenced', '```', 'Version: 3');

    strict.strictEqual(structuralText(text), lines('# Title', 'Version: 3'));
  });

  it('an unclosed fence swallows structure until the end', () => {
    const text = lines('## Findings', '### Before', '```', '### After');

    strict.deepStrictEqual(
      sectionBlocks(text, 'Findings').map((block) => block.name),
      ['Before']
    );
  });
});
