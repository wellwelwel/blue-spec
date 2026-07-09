import type {
  FileOutcome,
  ScaffoldBucket,
  ScaffoldGroup,
  ScaffoldResult,
} from '../types/core.js';

const FIXED_BUCKETS: ScaffoldBucket[] = [
  {
    label: 'Templates',
    baseDir: '.lagune/templates/',
    owns: (path) => path.startsWith('.lagune/templates/'),
  },
  {
    label: 'Hooks',
    baseDir: '.lagune/hooks/',
    owns: (path) => path.startsWith('.lagune/hooks/'),
  },
  {
    label: 'Sub-skills',
    baseDir: '.lagune/skills/',
    owns: (path) => path.startsWith('.lagune/skills/'),
  },
  {
    label: 'State',
    baseDir: '.lagune/',
    owns: (path) =>
      path.startsWith('.lagune/') &&
      !path.slice('.lagune/'.length).includes('/'),
  },
];

const toOutcomes = (result: ScaffoldResult): FileOutcome[] => [
  ...result.created.map((path): FileOutcome => ({ path, status: 'created' })),
  ...result.skipped.map((path): FileOutcome => ({ path, status: 'skipped' })),
];

const commonDir = (paths: string[]): string => {
  if (paths.length === 0) return '';

  const segments = paths.map((path) => path.split('/').slice(0, -1));
  const shortest = segments.reduce(
    (min, parts) => Math.min(min, parts.length),
    Infinity
  );
  const shared: string[] = [];

  for (let depth = 0; depth < shortest; depth += 1) {
    const segment = segments[0][depth];

    if (segments.every((parts) => parts[depth] === segment))
      shared.push(segment);
    else break;
  }

  return shared.length === 0 ? '' : `${shared.join('/')}/`;
};

export const groupOutcomes = (
  outcomes: FileOutcome[],
  agentLabel: string
): ScaffoldGroup[] => {
  const fixed: ScaffoldGroup[] = FIXED_BUCKETS.map((bucket) => ({
    label: bucket.label,
    baseDir: bucket.baseDir,
    outcomes: outcomes.filter((outcome) => bucket.owns(outcome.path)),
  }));

  const rest = outcomes.filter(
    (outcome) => !FIXED_BUCKETS.some((bucket) => bucket.owns(outcome.path))
  );
  const agentCommands: ScaffoldGroup = {
    label: agentLabel,
    baseDir: commonDir(rest.map((outcome) => outcome.path)),
    outcomes: rest,
  };

  return [...fixed, agentCommands].filter((group) => group.outcomes.length > 0);
};

export const groupScaffoldOutcomes = (
  result: ScaffoldResult,
  agentLabel: string
): ScaffoldGroup[] => groupOutcomes(toOutcomes(result), agentLabel);
