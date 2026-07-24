import type {
  InfraKind,
  InfraRule,
  InfraVerdict,
} from '../../types/hooks/infra.js';

// --- terraform ---

const OPEN_CIDR =
  /(?:cidr_blocks?|cidr_ipv4|cidr_ipv6)\s{0,16}=\s{0,16}\[?\s{0,16}["'](?:0\.0\.0\.0\/0|::\/0)["']|["']::\/0["']/;

const SENSITIVE_PORTS = [
  22, 23, 25, 135, 139, 445, 1433, 1521, 2049, 2375, 2376, 27017, 3306, 3389,
  5432, 5601, 5984, 6379, 7001, 8020, 9000, 9042, 9200, 9300, 11211,
];

const PORT_ASSIGNMENT =
  /\b(?:from_port|to_port|port)\s{0,16}=\s{0,16}(\d{1,5})\b/g;

// A protocol of "-1" (all protocols) opens every port at once.
const OPEN_PROTOCOL = /\b(?:protocol|ip_protocol)\s{0,16}=\s{0,16}["']-1["']/;

/** Strips HCL comments so braces inside them do not corrupt block matching */
const stripHclComments = (content: string): string =>
  content
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((line) => line.replace(/#[^\n]*/, '').replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');

const balancedSpan = (
  text: string,
  openIndex: number,
  open: string,
  close: string
): string | null => {
  let depth = 0;
  const limit = Math.min(text.length, openIndex + 20000);

  for (let index = openIndex; index < limit; index += 1) {
    if (text[index] === open) depth += 1;
    else if (text[index] === close) {
      depth -= 1;

      if (depth === 0) return text.slice(openIndex, index + 1);
    }
  }

  return null;
};

const topLevelObjects = (list: string): string[] => {
  const objects: string[] = [];
  let index = 0;

  while (index < list.length) {
    if (list[index] !== '{') {
      index += 1;
      continue;
    }

    const object = balancedSpan(list, index, '{', '}');

    if (object === null) break;

    objects.push(object);
    index += object.length;
  }

  return objects;
};

const INGRESS_OPENER =
  /(?:\bingress\b\s{0,16}=?\s{0,16}|dynamic\s{1,16}"ingress"\s{0,16}|"ingress"\s{0,16}:\s{0,16})([{[])/g;

/** Egress blocks are never extracted, so a safe-port CIDR and a sensitive port in separate blocks cannot combine into a false positive */
const ingressRuleBodies = (content: string): string[] => {
  const stripped = stripHclComments(content);

  return [...stripped.matchAll(INGRESS_OPENER)].flatMap((match) => {
    const open = match[1];
    const start = match.index + match[0].length - 1;
    const block = balancedSpan(stripped, start, open, open === '{' ? '}' : ']');

    if (block === null) return [];

    return open === '[' ? topLevelObjects(block) : [block];
  });
};

const namesSensitivePort = (body: string): boolean =>
  [...body.matchAll(PORT_ASSIGNMENT)].some((match) =>
    SENSITIVE_PORTS.includes(Number(match[1]))
  );

const coversSensitivePort = (body: string): boolean => {
  if (namesSensitivePort(body) || OPEN_PROTOCOL.test(body)) return true;

  const from = /\bfrom_port\s{0,16}=\s{0,16}(\d{1,5})/.exec(body);
  const to = /\bto_port\s{0,16}=\s{0,16}(\d{1,5})/.exec(body);

  if (from === null || to === null) return false;

  const low = Number(from[1]);
  const high = Number(to[1]);

  return SENSITIVE_PORTS.some((port) => low <= port && port <= high);
};

const hasPublicIngress = (content: string): boolean =>
  ingressRuleBodies(content).some(
    (body) => OPEN_CIDR.test(body) && coversSensitivePort(body)
  );

const IAM_WILDCARD_LINE = [
  /^[ \t]*actions\s*=\s*\[\s*["']\*["']/im,
  /^[ \t]*resources\s*=\s*\[\s*["']\*["']/im,
  /["']Action["']\s{0,16}:\s{0,16}\[?\s{0,16}["']\*["']/i,
  /["']Resource["']\s{0,16}:\s{0,16}\[?\s{0,16}["']\*["']/i,
  /["']Principal["']\s{0,16}:\s{0,16}\[?\s{0,16}["']\*["']/i,
  /\bidentifiers\s{0,16}=\s{0,16}\[\s{0,16}["']\*["']/im,
];

const DENY =
  /\beffect\s{0,16}=\s{0,16}["']?Deny|["']Effect["']\s{0,16}:\s{0,16}["']Deny/i;

const hasIamWildcard = (content: string): boolean => {
  const lines = content.split('\n');

  return lines.some((line, index) => {
    if (!IAM_WILDCARD_LINE.some((rule) => rule.test(line))) return false;

    const window = lines
      .slice(Math.max(0, index - 10), Math.min(lines.length, index + 11))
      .join('\n');

    // A wildcard inside a Deny statement is a guardrail, the opposite of an over-grant.
    return !DENY.test(window);
  });
};

const hasUnpinnedModule = (content: string): boolean =>
  content
    .split('\n')
    .some(
      (line) =>
        /\bsource\s{0,16}=\s{0,16}"(?:(?:git::|git@|github\.com\/|bitbucket\.org\/)|https:\/\/(?=[^"]{0,500}\.git))[^"]{0,500}"/i.test(
          line
        ) && !/\?ref=[0-9a-f]{6,40}\b/i.test(line)
    );

const SECRET_IN_DATA =
  /^[ \t]*[\w-]{0,64}(?:password|secret|token|api_key|access_key|client_secret|private_key)[ \t]*=[ \t]*"(?!\$\{)[^"]{6,4096}"/im;

// --- dockerfile ---

const finalStage = (content: string): string => {
  const lines = content.split('\n');
  let start = 0;

  lines.forEach((line, index) => {
    if (/^\s*FROM\s+/i.test(line)) start = index;
  });

  return lines.slice(start).join('\n');
};

// The last USER of the final stage decides (install-then-drop ends non-root). A
// missing USER is not flagged: the effective user is the base image's, not in the file.
const runsAsRoot = (content: string): boolean => {
  const users = [...finalStage(content).matchAll(/^[ \t]*USER[ \t]+(\S+)/gim)];

  if (users.length === 0) return false;

  return /^(?:root|0)\b/i.test(users[users.length - 1][1]);
};

const hasCurlPipe = (content: string): boolean =>
  content
    .replace(/\\\s{0,16}\n/g, ' ')
    .split('\n')
    .some(
      (line) =>
        /\b(?:curl|wget)\b[^|\n]{0,500}\|\s{0,16}(?:sudo\s{1,16})?(?:sh|bash|zsh)\b/.test(
          line
        ) &&
        !/\b(?:sha256sum|sha512sum|gpg|cosign|checksum|--verify)\b/i.test(line)
    );

const finalImage = (content: string): string | null => {
  const lines = content.split('\n');
  let image: string | null = null;

  for (const line of lines) {
    const match = /^\s*FROM\s+(\S+)/i.exec(line);

    if (match !== null) image = match[1];
  }

  return image;
};

const hasMutableFrom = (content: string): boolean => {
  const image = finalImage(content);

  if (image === null) return false;

  return !/@sha256:/.test(image) && !/^scratch$/i.test(image);
};

// --- github-actions ---

const SCRIPT_INJECTION =
  /\$\{\{\s{0,16}github\.event\.[^}]{0,200}(?:title|body|message|name|email|label|ref|head_ref|comment|description|author|default_branch)[^}]{0,200}\}\}/i;

/** Scoped to `run:` bodies, so GitHub's own mitigation (a `github.event` value mapped into `env:` and read as `$VAR`) is not flagged */
const runStepBodies = (content: string): string[] => {
  const lines = content.split('\n');
  const bodies: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(\s*)(?:-\s{0,4})?run\s{0,16}:(.*)$/.exec(lines[index]);

    if (match === null) continue;

    const indent = match[1].length;
    const inline = match[2].trim();

    if (inline !== '' && !/^[|>]/.test(inline)) {
      bodies.push(inline);
      continue;
    }

    let body = '';

    for (let next = index + 1; next < lines.length; next += 1) {
      if (lines[next].trim() === '') continue;
      if (/^\s*/.exec(lines[next])![0].length <= indent) break;

      body += `${lines[next]}\n`;
    }

    bodies.push(body);
  }

  return bodies;
};

const hasScriptInjection = (content: string): boolean =>
  runStepBodies(content).some((body) => SCRIPT_INJECTION.test(body));

const hasUnpinnedUses = (content: string): boolean =>
  content.split('\n').some((line) => {
    const match =
      /^\s*(?:-\s*)?uses\s*:\s*['"]?[\w.-]+\/[\w.-]+@([^\s'"]+)/i.exec(line);

    return match !== null && !/^[0-9a-f]{40}$/i.test(match[1]);
  });

export const RULES: Record<InfraKind, InfraRule[]> = {
  terraform: [
    {
      tag: 'public-ingress',
      severity: 'finding',
      detail:
        'security group / NACL ingress open to 0.0.0.0/0 on a sensitive port',
      test: hasPublicIngress,
    },
    {
      tag: 'iam-wildcard',
      severity: 'finding',
      detail:
        'IAM policy grants a wildcard Action / Resource / Principal ("*")',
      test: hasIamWildcard,
    },
    {
      tag: 'secret-in-data',
      severity: 'finding',
      detail:
        'a literal secret value in a resource attribute: use a variable or a secret store',
      test: (content) => SECRET_IN_DATA.test(content),
    },
    {
      tag: 'encryption-disabled',
      severity: 'finding',
      detail: 'encryption explicitly disabled (encrypted = false)',
      test: (content) => /\bencrypted\s{0,16}=\s{0,16}false\b/i.test(content),
    },
    {
      tag: 'unpinned-module',
      severity: 'finding',
      detail: 'module sourced from git without a commit-pinned ?ref=<sha>',
      test: hasUnpinnedModule,
    },
  ],
  dockerfile: [
    {
      tag: 'root-user',
      severity: 'finding',
      detail: 'final image sets USER root (or USER 0)',
      test: runsAsRoot,
    },
    {
      tag: 'curl-pipe',
      severity: 'finding',
      detail: 'RUN pipes a downloaded script into a shell without verification',
      test: hasCurlPipe,
    },
    {
      tag: 'mutable-tag',
      severity: 'advisory',
      detail:
        'final FROM uses a mutable tag (or is untagged), not a @sha256 digest',
      test: hasMutableFrom,
    },
  ],
  'github-actions': [
    {
      tag: 'script-injection',
      severity: 'finding',
      detail: 'untrusted github.event field interpolated into a run: block',
      test: hasScriptInjection,
    },
    {
      tag: 'write-all',
      severity: 'finding',
      detail: 'workflow grants permissions: write-all',
      test: (content) => /permissions\s{0,16}:\s{0,16}write-all/i.test(content),
    },
    {
      tag: 'unpinned-action',
      severity: 'advisory',
      detail: 'uses: an action pinned to a tag/branch, not a full commit SHA',
      test: hasUnpinnedUses,
    },
  ],
};

export const FINDING_TAGS: ReadonlySet<InfraVerdict> = new Set(
  Object.values(RULES)
    .flat()
    .filter((rule) => rule.severity === 'finding')
    .map((rule) => rule.tag)
);
