import type { LanguageId } from '../../types/hooks/regex.js';
import type {
  CommentScan,
  CommentSpec,
  LineRule,
  WindowRule,
} from '../../types/scan.js';

const C_STYLE: CommentSpec = { line: ['//'], block: ['/*', '*/'] };
const HASH: CommentSpec = { line: ['#'] };

const COMMENT_SPECS: Partial<Record<LanguageId, CommentSpec>> = {
  javascript: C_STYLE,
  c: C_STYLE,
  cpp: C_STYLE,
  objc: C_STYLE,
  java: C_STYLE,
  kotlin: C_STYLE,
  csharp: C_STYLE,
  go: C_STYLE,
  rust: C_STYLE,
  swift: C_STYLE,
  scala: C_STYLE,
  dart: C_STYLE,
  vlang: C_STYLE,
  dlang: C_STYLE,
  php: { line: ['//', '#'], block: ['/*', '*/'] },
  python: HASH,
  ruby: HASH,
  perl: HASH,
  elixir: HASH,
  r: HASH,
  julia: HASH,
  crystal: HASH,
  nim: HASH,
  powershell: HASH,
  clojure: { line: [';'] },
};

/** Unknown files keep `#` as code, so a `#`-comment secret is still scanned */
const FALLBACK: CommentSpec = C_STYLE;

const commentSpec = (language?: LanguageId | null): CommentSpec =>
  (language && COMMENT_SPECS[language]) || FALLBACK;

const LEADING_WHITESPACE = /^\s*/;

const isWholeLineComment = (line: string, spec: CommentSpec): boolean => {
  const rest = line.slice(LEADING_WHITESPACE.exec(line)![0].length);

  return spec.line.some(
    (leader) =>
      rest.startsWith(leader) && !(leader === '#' && rest.startsWith('#['))
  );
};

const scanOutsideBlock = (line: string, spec: CommentSpec): CommentScan => {
  if (isWholeLineComment(line, spec)) return { text: '', inBlock: false };
  if (spec.block === undefined) return { text: line, inBlock: false };

  const [open, close] = spec.block;
  let text = '';
  let index = 0;
  let inString = false;
  let quote = '';

  while (index < line.length) {
    const char = line[index];

    if (inString) {
      text += char;

      if (char === '\\') {
        text += line[index + 1] ?? '';
        index += 2;
        continue;
      }

      if (char === quote) inString = false;
      index += 1;
      continue;
    }

    if (spec.line.some((leader) => line.startsWith(leader, index)))
      return { text: text + line.slice(index), inBlock: false };

    if (line.startsWith(open, index)) {
      const closeAt = line.indexOf(close, index + open.length);

      if (closeAt === -1) return { text, inBlock: true };

      text += ' ';
      index = closeAt + close.length;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      quote = char;
    }

    text += char;
    index += 1;
  }

  return { text, inBlock: false };
};

const scanLine = (
  line: string,
  spec: CommentSpec,
  inBlock: boolean
): CommentScan => {
  if (!inBlock) return scanOutsideBlock(line, spec);
  if (spec.block === undefined) return { text: line, inBlock: false };

  const closeAt = line.indexOf(spec.block[1]);

  if (closeAt === -1) return { text: '', inBlock: true };

  return scanOutsideBlock(line.slice(closeAt + spec.block[1].length), spec);
};

/** Blanks comments per language, preserving line indices so window offsets and line numbers survive */
export const codeLines = (
  content: string,
  language?: LanguageId | null
): string[] => {
  const spec = commentSpec(language);
  const lines = content.split('\n');
  const result: string[] = [];
  let inBlock = false;

  for (const line of lines) {
    const scanned = scanLine(line, spec, inBlock);

    result.push(scanned.text);
    inBlock = scanned.inBlock;
  }

  return result;
};

export const firedRules = (
  content: string,
  rules: LineRule[],
  language?: LanguageId | null
): string[] => {
  const lines = codeLines(content, language);

  return rules
    .filter((rule) => lines.some((line) => rule.regex.test(line)))
    .map((rule) => rule.detail);
};

const anyCallMissesGuard = (
  content: string,
  rule: WindowRule,
  language?: LanguageId | null
): boolean => {
  const lines = codeLines(content, language);

  for (let index = 0; index < lines.length; index += 1) {
    if (!rule.call.test(lines[index])) continue;

    const window = lines
      .slice(index, Math.min(lines.length, index + rule.window))
      .join('\n');

    if (!rule.guard.test(window)) return true;
  }

  return false;
};

export const firedWindowRules = (
  content: string,
  rules: WindowRule[],
  language?: LanguageId | null
): string[] =>
  rules
    .filter((rule) => anyCallMissesGuard(content, rule, language))
    .map((rule) => rule.detail);
