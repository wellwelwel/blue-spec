import type { LanguageId } from '../../types/hooks/regex.js';
import type { FileAnalysis } from '../../types/scan.js';
import { languageOf } from '../../core/scan/language.js';
import { codeLines } from '../../core/scan/lines.js';
import { envFallbacksOf, SIGNATURES, sinkOf } from './patterns.js';

const ASSIGN =
  /[a-z0-9_]{0,64}(?:password|passwd|pwd|secret|api[_-]?key|apikey|access[_-]?key|auth[_-]?token|token|credential|private[_-]?key|client[_-]?secret)\s{0,16}[:=]\s{0,16}(['"`])([^'"`]{0,4096})\1/i;

const CONNECTION_STRING =
  /\b[a-z][a-z0-9+.-]{1,20}:\/\/[^\s:'"`@/]{0,64}:([^\s:'"`@/]{1,256})@[^\s'"`/]{1,256}/i;

const PLACEHOLDER =
  /^(?:changeme|changeit|change[-_]me|your[-_]?[\w-]+|example[\w-]*|sample[\w-]*|dummy[\w-]*|test[\w-]*|placeholder|redacted|todo|none|null|undefined|x{3,}|\*{3,}|\.{3,}|<.*>|\$\{.*\}|\{\{.*\}\})$/i;

const SECRET_REF =
  /\b(?:password|secret|api[_-]?key|apikey|token|credential|private[_-]?key|plaintext|decrypted\w{0,64})\b/i;

const SECRET_IDENTIFIER =
  /(?:password|passwd|pwd|secret|api[_-]?key|apikey|access[_-]?key|auth[_-]?token|token|credential|private[_-]?key|client[_-]?secret)/i;

const ENV_FALLBACK_DETAIL =
  'hardcoded fallback for an environment secret: remove the literal default';
const CONNECTION_DETAIL =
  'credential embedded in a connection/DSN string: move it to an environment variable or secret store';
const LITERAL_DETAIL =
  'literal bound to a secret-named identifier: confirm it is a real credential, and move any secret to an environment variable or secret store';
const SINK_DETAIL =
  'a secret-named value flows into a log/response/error sink: verify it is redacted';

const isPlaceholder = (value: string): boolean => PLACEHOLDER.test(value);

const hasHardcodedLiteral = (line: string): boolean => {
  const match = ASSIGN.exec(line);

  if (match === null) return false;

  return match[2].length >= 8 && !isPlaceholder(match[2]);
};

/** Each pattern ends with the quoted default, so stripping it leaves the lookup, which must name a secret (`NODE_ENV ?? "development"` is not a finding) */
const hasEnvFallback = (line: string, patterns: readonly RegExp[]): boolean =>
  patterns.some((pattern) => {
    const match = pattern.exec(line);

    if (match === null) return false;

    const [, quote, defaultLiteral] = match;

    if (isPlaceholder(defaultLiteral)) return false;

    const lookup = match[0].slice(
      0,
      -(quote.length + defaultLiteral.length + quote.length)
    );

    return SECRET_IDENTIFIER.test(lookup);
  });

const hasConnectionCredential = (line: string): boolean => {
  const match = CONNECTION_STRING.exec(line);

  if (match === null) return false;

  const password = match[1];

  return !password.startsWith('$') && !isPlaceholder(password);
};

const flagged = (lines: string[], test: (line: string) => boolean): boolean =>
  lines.some(test);

/** Hard findings (provider signatures, connection strings) read RAW lines, so a token or DSN committed in a comment is still caught. The heuristic leads read comment-blanked lines, so a commented-out example is not flagged */
export const analyzeFor = (
  language: LanguageId | null,
  content: string
): FileAnalysis => {
  const rawLines = content.split('\n');
  const lines = codeLines(content, language);
  const envPatterns = language === null ? [] : envFallbacksOf(language);
  const sink = language === null ? null : sinkOf(language);

  const findings = SIGNATURES.filter((rule) =>
    rawLines.some((line) => rule.regex.test(line))
  ).map((rule) => rule.detail);

  if (
    envPatterns.length > 0 &&
    flagged(lines, (line) => hasEnvFallback(line, envPatterns))
  )
    findings.push(ENV_FALLBACK_DETAIL);

  if (flagged(rawLines, hasConnectionCredential))
    findings.push(CONNECTION_DETAIL);

  const review: string[] = [];

  if (flagged(lines, hasHardcodedLiteral)) review.push(LITERAL_DETAIL);

  if (
    sink !== null &&
    flagged(lines, (line) => sink.test(line) && SECRET_REF.test(line))
  )
    review.push(SINK_DETAIL);

  return {
    findings: [...new Set(findings)],
    review: [...new Set(review)],
    advisory: [],
  };
};

export const analyze = (file: string, content: string): FileAnalysis =>
  analyzeFor(languageOf(file), content);
