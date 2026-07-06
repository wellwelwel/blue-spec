import { describe, it, strict } from 'poku';
import { tokenize } from '../../../src/dashboard/client/components/primitives/inline-tokens.js';

describe('tokenize interprets inline markdown', () => {
  it('reads a bold span without leaking its asterisks as text', () => {
    strict.deepStrictEqual(tokenize('**Photo upload:** the rest'), [
      { kind: 'strong', value: 'Photo upload:' },
      { kind: 'text', value: ' the rest' },
    ]);
  });

  it('reads a single-asterisk emphasis span', () => {
    strict.deepStrictEqual(tokenize('a *word* b'), [
      { kind: 'text', value: 'a ' },
      { kind: 'em', value: 'word' },
      { kind: 'text', value: ' b' },
    ]);
  });

  it('reads inline code literally', () => {
    strict.deepStrictEqual(tokenize('run `npx blue-spec`'), [
      { kind: 'text', value: 'run ' },
      { kind: 'code', value: 'npx blue-spec' },
    ]);
  });

  it('reads a link into value and href', () => {
    strict.deepStrictEqual(tokenize('see [the docs](https://x.dev)'), [
      { kind: 'text', value: 'see ' },
      { kind: 'link', value: 'the docs', href: 'https://x.dev' },
    ]);
  });

  it('prefers strong over emphasis so ** is never read as two *', () => {
    strict.deepStrictEqual(tokenize('**bold** and *em*'), [
      { kind: 'strong', value: 'bold' },
      { kind: 'text', value: ' and ' },
      { kind: 'em', value: 'em' },
    ]);
  });

  it('keeps an unmatched marker as plain text', () => {
    strict.deepStrictEqual(tokenize('a lone * and a stray `'), [
      { kind: 'text', value: 'a lone * and a stray `' },
    ]);
  });

  it('does not treat snake_case underscores as emphasis', () => {
    strict.deepStrictEqual(tokenize('the plan_fixes value'), [
      { kind: 'text', value: 'the plan_fixes value' },
    ]);
  });

  it('leaves plain text as a single token', () => {
    strict.deepStrictEqual(tokenize('nothing to mark up'), [
      { kind: 'text', value: 'nothing to mark up' },
    ]);
  });
});
