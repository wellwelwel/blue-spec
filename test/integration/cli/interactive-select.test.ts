import { describe, it, strict } from 'poku';
import {
  ESC,
  matches,
  windowStart,
} from '../../../src/cli/interactive-select.js';

describe('the escape byte that drives the redraw', () => {
  it('is the real control character, not an empty string', () => {
    strict.strictEqual(
      ESC,
      String.fromCharCode(27),
      'a lost ESC stacks frames'
    );
    strict.strictEqual(ESC.length, 1);
  });
});

describe('filtering options by a typed query', () => {
  it('keeps every option when the query is empty', () => {
    strict(matches({ label: 'Claude Code' }, ''), 'empty query matches all');
  });

  it('matches against the visible label', () => {
    strict(matches({ label: 'GitHub Copilot' }, 'copilot'));
    strict(!matches({ label: 'GitHub Copilot' }, 'cursor'));
  });

  it('matches against the hidden keywords (the agent key)', () => {
    const option = { label: 'Antigravity', keywords: 'agy' };

    strict(matches(option, 'agy'), 'typing the key filters the agent');
    strict(!matches(option, 'zzz'));
  });

  it('is case-insensitive on both sides', () => {
    strict(matches({ label: 'Mistral Vibe', keywords: 'vibe' }, 'MISTRAL'));
    strict(matches({ label: 'GEMINI CLI', keywords: 'gemini' }, 'gem'));
  });
});

describe('scrolling the visible window', () => {
  it('starts at the top when everything fits', () => {
    strict.strictEqual(windowStart(0, 5, 10), 0);
    strict.strictEqual(windowStart(4, 5, 10), 0);
  });

  it('centers the cursor once the list overflows', () => {
    strict.strictEqual(windowStart(10, 37, 10), 5, 'cursor sits mid-window');
  });

  it('clamps to the top edge', () => {
    strict.strictEqual(windowStart(1, 37, 10), 0);
  });

  it('clamps to the bottom edge', () => {
    strict.strictEqual(windowStart(36, 37, 10), 27, '37 - 10 = 27');
  });
});
