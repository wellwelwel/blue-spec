import type { LanguageId } from '../../types/hooks/regex.js';
import type { LineRule } from '../../types/scan.js';

/** Curated provider token formats, not exhaustive: the structural rule (a literal bound to a secret-named identifier) catches the rest */
export const SIGNATURES: LineRule[] = [
  {
    regex: /\bAKIA[0-9A-Z]{16}\b/,
    detail: 'AWS access key id (AKIA…) committed in source',
  },
  {
    regex: /\bghp_[A-Za-z0-9]{36}\b/,
    detail: 'GitHub personal access token (ghp_…) committed in source',
  },
  {
    regex: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/,
    detail: 'GitHub fine-grained token (github_pat_…) committed in source',
  },
  {
    regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
    detail: 'Slack token (xox…) committed in source',
  },
  {
    regex: /\bsk_live_[A-Za-z0-9]{16,}\b/,
    detail: 'Stripe live secret key (sk_live_…) committed in source',
  },
  {
    regex: /\bsk_test_[A-Za-z0-9]{16,}\b/,
    detail: 'Stripe test secret key (sk_test_…) committed in source',
  },
  {
    regex: /\bsk-proj-[A-Za-z0-9_-]{20,}\b/,
    detail: 'OpenAI project secret key (sk-proj-…) committed in source',
  },
  {
    regex: /\bsk-[A-Za-z0-9]{20,}\b/,
    detail: 'OpenAI secret key (sk-…) committed in source',
  },
  {
    regex: /\bglpat-[A-Za-z0-9_-]{20,}\b/,
    detail: 'GitLab personal access token (glpat-…) committed in source',
  },
  {
    regex: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/,
    detail: 'SendGrid API key (SG.…) committed in source',
  },
  {
    regex: /\bAIza[A-Za-z0-9_-]{35}\b/,
    detail: 'Google API key (AIza…) committed in source',
  },
  {
    regex: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/,
    detail: 'JSON Web Token (eyJ…) committed in source',
  },
  {
    regex:
      /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?(?:ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----/,
    detail: 'private key block (PEM) committed in source',
  },
];

const JVM_SINK =
  /System\.(?:out|err)\.(?:println|print|printf|format)\s{0,16}\(|\b(?:log|logger)\.(?:info|warn|error|debug|trace|fatal)\s{0,16}\(|\bprintln\s{0,16}\(|throw\s{1,16}new\s{1,16}\w{0,64}(?:Exception|Error)/;

const C_SINK =
  /\b(?:printf|fprintf|sprintf|snprintf|puts|fputs|perror)\s{0,16}\(/;

const SINKS: Partial<Record<LanguageId, RegExp>> = {
  javascript:
    /\b(?:console\.(?:log|info|warn|error|debug)|logger\.(?:info|warn|error|debug|trace)|res\.(?:send|json|write)|response\.(?:send|json)|throw\s{1,16}new\s{1,16}\w{0,64}Error|new\s{1,16}Error)\s{0,16}\(/,
  python:
    /\bprint\s{0,16}\(|\b(?:logging|logger)\.(?:info|warning|error|debug|critical|exception)\s{0,16}\(|\braise\s{1,16}\w{0,64}(?:Error|Exception)/,
  ruby: /(?:^|[;{(])\s{0,16}(?:puts|print|pp?)\b|(?:Rails\.)?logger\.(?:info|warn|error|debug|fatal)\s{0,16}\(|(?:^|[;{(])\s{0,16}raise\b/,
  php: /(?:^|[;{])\s{0,16}(?:echo|print)\b|\bprintf\s{0,16}\(|\bvar_dump\s{0,16}\(|\berror_log\s{0,16}\(|throw\s{1,16}new\s{1,16}\w{0,64}(?:Exception|Error)/,
  java: JVM_SINK,
  kotlin: JVM_SINK,
  go: /\bfmt\.(?:Print|Printf|Println|Sprint|Sprintf|Sprintln|Fprint\w{0,8})\s{0,16}\(|\blog\.(?:Print|Printf|Println|Fatal\w{0,8}|Panic\w{0,8})\s{0,16}\(|\bslog\.(?:Info|Warn|Error|Debug)\s{0,16}\(|\bpanic\s{0,16}\(/,
  rust: /\b(?:println|print|eprintln|eprint)\s{0,16}!|\b(?:log|tracing)::(?:info|warn|error|debug|trace)\s{0,16}!|\bpanic\s{0,16}!/,
  c: C_SINK,
  cpp: /\b(?:printf|fprintf|sprintf|snprintf|puts|fputs|perror)\s{0,16}\(|\b(?:std::)?(?:cout|cerr|clog)\b\s{0,16}<</,
  csharp:
    /\bConsole\.(?:Write|WriteLine)\s{0,16}\(|\bConsole\.Error\.(?:Write|WriteLine)\s{0,16}\(|\b_?[Ll]ogger\.(?:LogInformation|LogWarning|LogError|LogDebug|LogTrace|LogCritical)\s{0,16}\(|throw\s{1,16}new\s{1,16}\w{0,64}Exception/,
};

/** Group 2 is the default literal in every regex, so the length/placeholder filter reads the same group everywhere */
const ENV_FALLBACKS: Partial<Record<LanguageId, readonly RegExp[]>> = {
  javascript: [
    /(?:process\.env\.\w{1,64}|import\.meta\.env\.\w{1,64})\s{0,16}(?:\?\?|\|\|)\s{0,16}(['"`])([^'"`]{8,512})\1/,
  ],
  python: [
    /\bos\.(?:getenv|environ\.get)\s{0,16}\(\s{0,16}['"]\w{1,64}['"]\s{0,16},\s{0,16}(['"])([^'"]{8,512})\1/,
    /\bos\.(?:getenv\s{0,16}\([^)]{0,200}\)|environ\s{0,16}\[\s{0,16}['"]\w{1,64}['"]\s{0,16}\])\s{1,16}or\s{1,16}(['"])([^'"]{8,512})\1/,
  ],
  ruby: [
    /\bENV\s{0,16}\[\s{0,16}['"]\w{1,64}['"]\s{0,16}\]\s{0,16}\|\|\s{0,16}(['"])([^'"]{8,512})\1/,
    /\bENV\.fetch\s{0,16}\(\s{0,16}['"]\w{1,64}['"]\s{0,16},\s{0,16}(['"])([^'"]{8,512})\1/,
  ],
  php: [
    /\bgetenv\s{0,16}\(\s{0,16}['"]\w{1,64}['"]\s{0,16}\)\s{0,16}\?:\s{0,16}(['"])([^'"]{8,512})\1/,
    /\$_(?:ENV|SERVER)\s{0,16}\[\s{0,16}['"]\w{1,64}['"]\s{0,16}\]\s{0,16}\?\?\s{0,16}(['"])([^'"]{8,512})\1/,
  ],
  java: [
    /System\.getenv\s{0,16}\([^)]{0,200}\)[^;\n]{0,120}\.orElse\s{0,16}\(\s{0,16}(['"])([^'"]{8,512})\1/,
  ],
  kotlin: [
    /System\.getenv\s{0,16}\([^)]{0,200}\)\s{0,16}\?:\s{0,16}(['"])([^'"]{8,512})\1/,
    /System\.getenv\s{0,16}\([^)]{0,200}\)[^;\n]{0,120}\.orElse\s{0,16}\(\s{0,16}(['"])([^'"]{8,512})\1/,
  ],
  go: [
    /\bcmp\.Or\s{0,16}\(\s{0,16}os\.Getenv\s{0,16}\([^)]{0,200}\)\s{0,16},\s{0,16}(['"])([^'"]{8,512})\1/,
  ],
  rust: [
    /\benv::var\w{0,8}\s{0,16}\([^)]{0,200}\)[^;\n]{0,120}\.unwrap_or(?:_else)?\s{0,16}\([^"'\n]{0,40}(['"])([^'"]{8,512})\1/,
  ],
  csharp: [
    /\bEnvironment\.GetEnvironmentVariable\s{0,16}\([^)]{0,200}\)\s{0,16}\?\?\s{0,16}(['"])([^'"]{8,512})\1/,
  ],
};

export const SINK_LANGUAGES: readonly LanguageId[] = Object.keys(
  SINKS
) as LanguageId[];

export const sinkOf = (language: LanguageId): RegExp | null =>
  SINKS[language] ?? null;

export const envFallbacksOf = (language: LanguageId): readonly RegExp[] =>
  ENV_FALLBACKS[language] ?? [];
