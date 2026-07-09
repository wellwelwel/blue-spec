import { describe, it, strict } from 'poku';
import {
  hasFindingSection,
  removeSection,
} from '../../../src/core/sections.js';

const detectLike = [
  '# Project Detect Map',
  '',
  '## Findings',
  '',
  '### Alpha finding',
  '',
  '- **What it is:** the alpha thing.',
  '- **Why it matters:** alpha risk.',
  '',
  '### Beta finding',
  '',
  '- **What it is:** the beta thing.',
  '- **Why it matters:** beta risk.',
  '',
  '### Gamma finding',
  '',
  '- **What it is:** the gamma thing.',
  '- **Why it matters:** gamma risk.',
  '',
  '## Applied sub-skills',
  '',
  '- `.lagune/skills/upload.md`: surfaced "Beta finding".',
  '',
].join('\n');

describe('removeSection strips one h3 block and nothing else', () => {
  it('returns the input untouched when the name is absent', () => {
    const result = removeSection(detectLike, 'Missing finding');

    strict.strictEqual(result.removed, false);
    strict.strictEqual(
      result.content === detectLike,
      true,
      'an unmatched name returns the very same string, so nothing is rewritten'
    );
  });

  it('removes a middle section, leaving one blank line at the seam', () => {
    const result = removeSection(detectLike, 'Beta finding');

    strict.strictEqual(result.removed, true);
    strict.strictEqual(result.content.includes('### Beta finding'), false);
    strict.strictEqual(result.content.includes('### Alpha finding'), true);
    strict.strictEqual(result.content.includes('### Gamma finding'), true);
    strict.strictEqual(
      result.content.includes('\n\n\n'),
      false,
      'no double blank line is left where the block was'
    );
  });

  it('keeps a trailing ## section bullet that quotes the removed name', () => {
    const result = removeSection(detectLike, 'Beta finding');

    strict.strictEqual(
      result.content.includes('## Applied sub-skills'),
      true,
      'the boundary stops at the ## heading, never consuming it'
    );
    strict.strictEqual(
      result.content.includes('surfaced "Beta finding"'),
      true,
      'a bullet mentioning the name is prose, not the section, so it survives'
    );
  });

  it('removes the first section under its h2, keeping the h2', () => {
    const result = removeSection(detectLike, 'Alpha finding');

    strict.strictEqual(result.removed, true);
    strict.strictEqual(result.content.includes('## Findings'), true);
    strict.strictEqual(result.content.includes('### Alpha finding'), false);
    strict.strictEqual(result.content.includes('### Beta finding'), true);
  });

  it('stops at the next ### when removing a section', () => {
    const result = removeSection(detectLike, 'Alpha finding');

    strict.strictEqual(
      result.content.includes('- **What it is:** the beta thing.'),
      true,
      'the next finding is whole, never partly eaten'
    );
  });

  it('removes a last section before EOF and ends with one newline', () => {
    const noTrailer = [
      '# Record',
      '',
      '## Applied',
      '',
      '### Only finding',
      '',
      '- **Status:** Applied',
      '',
    ].join('\n');

    const result = removeSection(noTrailer, 'Only finding');

    strict.strictEqual(result.removed, true);
    strict.strictEqual(result.content.includes('### Only finding'), false);
    strict.strictEqual(
      result.content.endsWith('\n'),
      true,
      'the file still ends with exactly one newline'
    );
    strict.strictEqual(result.content.endsWith('\n\n'), false);
  });

  it('collapses runaway blank lines after a cut', () => {
    const padded = [
      '## Findings',
      '',
      '',
      '### Target',
      '',
      '- body',
      '',
      '',
      '',
      '### Keeper',
      '',
      '- body',
      '',
    ].join('\n');

    const result = removeSection(padded, 'Target');

    strict.strictEqual(result.content.includes('\n\n\n'), false);
    strict.strictEqual(result.content.includes('### Keeper'), true);
  });

  it('removes only the first when two sections share a name', () => {
    const twice = [
      '## Findings',
      '',
      '### Dup',
      '',
      '- first',
      '',
      '### Dup',
      '',
      '- second',
      '',
    ].join('\n');

    const result = removeSection(twice, 'Dup');

    strict.strictEqual(result.removed, true);
    strict.strictEqual(
      result.content.includes('### Dup'),
      true,
      'the second same-named heading still stands'
    );
    strict.strictEqual(result.content.includes('- first'), false);
    strict.strictEqual(result.content.includes('- second'), true);
  });
});

describe('removeSection matches the heading with discipline', () => {
  const base = ['## Findings', '', '### Foo', '', '- body', ''].join('\n');

  it('does not match an h4 of the same text', () => {
    const h4 = ['## Findings', '', '#### Foo', '', '- body', ''].join('\n');
    const result = removeSection(h4, 'Foo');

    strict.strictEqual(result.removed, false);
  });

  it('does not match a longer heading that starts with the name', () => {
    const longer = ['## Findings', '', '### Foo bar', '', '- body', ''].join(
      '\n'
    );
    const result = removeSection(longer, 'Foo');

    strict.strictEqual(result.removed, false);
  });

  it('does not match a bullet line that contains the name', () => {
    const bulletOnly = ['## Findings', '', '- mentions Foo here', ''].join(
      '\n'
    );
    const result = removeSection(bulletOnly, 'Foo');

    strict.strictEqual(result.removed, false);
  });

  it('matches a heading with a trailing space', () => {
    const trailing = ['## Findings', '', '### Foo ', '', '- body', ''].join(
      '\n'
    );
    const result = removeSection(trailing, 'Foo');

    strict.strictEqual(result.removed, true);
    strict.strictEqual(result.content.includes('### Foo'), false);
  });

  it('removes the exact match, not a sibling', () => {
    const result = removeSection(base, 'Foo');

    strict.strictEqual(result.removed, true);
    strict.strictEqual(result.content.includes('### Foo'), false);
  });
});

describe('hasFindingSection reports whether any h3 finding remains', () => {
  it('is true when at least one ### heading is present', () => {
    strict.strictEqual(hasFindingSection(detectLike), true);
  });

  it('is false for a husk of headers and empty ## sections', () => {
    const husk = [
      '# Project Detect Map',
      '',
      '## Findings',
      '',
      '## Applied sub-skills',
      '',
    ].join('\n');

    strict.strictEqual(hasFindingSection(husk), false);
  });

  it('does not count an h2 or h4 as a finding', () => {
    const noFinding = ['## Findings', '', '#### Foo', '', '- body', ''].join(
      '\n'
    );

    strict.strictEqual(hasFindingSection(noFinding), false);
  });
});
