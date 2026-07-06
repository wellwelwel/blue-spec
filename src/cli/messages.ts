import type {
  AgentChoice,
  FileOutcome,
  GitignoreOutcome,
  ScaffoldGroup,
  ScaffoldResult,
  SkillGroup,
} from '../types/core.js';
import { color } from './colors.js';

const GLYPH = {
  added: color.blue('+'),
  refreshed: color.blue('↻'),
  kept: color.dim('·'),
  removed: color.blue('-'),
};

const note = (text: string): string => color.dim(`(${text})`);

export const banner = (): string =>
  `\n🌊 ${color.bold(color.blue('Blue Spec'))}`;

const done = (text: string): string => `${color.blue('✓')} ${text}`;

const restAt = (count: number, label: string): string =>
  count === 0 ? '' : color.dim(`, ${count} ${label}`);

const heading = (text: string): string => color.blue(text);

const bullet = (text: string): string => `  ${color.blue('•')} ${text}`;

const definitions = (rows: [string, string][]): string[] => {
  const width = Math.max(...rows.map(([term]) => term.length));

  return rows.map(([term, description]) =>
    bullet(`${term.padEnd(width)}  ${description}`)
  );
};

const agentsByInitial = (agents: AgentChoice[]): string[] => {
  const sorted = [...agents].sort((left, right) =>
    left.displayName.localeCompare(right.displayName)
  );
  const byInitial = new Map<string, string[]>();

  for (const agent of sorted) {
    const initial = agent.displayName[0].toUpperCase();
    const label = `${agent.displayName} ${color.dim(`(${agent.key})`)}`;

    byInitial.set(initial, [...(byInitial.get(initial) ?? []), label]);
  }

  return [...byInitial].map(([initial, group]) =>
    bullet(`${initial}${color.dim(':')} ${group.join(color.dim(', '))}`)
  );
};

const HELP_USAGE: string[] = [
  'npx blue-spec [--port <number>]',
  'npx blue-spec init <agent> [--skills <category...>]',
  'npx blue-spec update',
  'npx blue-spec pull',
  'npx blue-spec add --skills',
  'npx blue-spec remove --skills',
  'npx blue-spec list [--findings] [--skills]',
  'npx blue-spec dashboard [-p, --port <number>]',
];

const HELP_COMMANDS: [string, string][] = [
  ['init <agent>', 'Scaffold Blue Spec into the current project'],
  ['update', 'Update Blue Spec files to their latest version'],
  ['pull', 'Rebuild Blue Spec from a committed manifest (after a clone)'],
  ['add', 'Install security specializations, by category'],
  ['remove', 'Uninstall security specializations, by category'],
  ['list', 'List tracked findings or specialization categories (asks which)'],
  ['dashboard', 'Serve a live view of .bluespec/ and open it in the browser'],
];

const HELP_OPTIONS: [string, string][] = [
  [
    '--skills <...>',
    'Security specializations, by category (no value to choose interactively)',
  ],
  ['--findings', 'With list, show the tracked findings'],
  [
    '-p, --port <1024-65535>',
    'With dashboard, the port to serve on (default: random)',
  ],
  ['-h, --help', 'Show this help'],
  ['-v, --version', 'Show the version'],
];

export const helpText = (agents: AgentChoice[]): string =>
  [
    banner(),
    color.dim('A defensive, security-first workflow for your project.'),
    '',
    heading('Usage'),
    ...HELP_USAGE.map(bullet),
    '',
    heading('Commands'),
    ...definitions(HELP_COMMANDS),
    '',
    heading('Options'),
    ...definitions(HELP_OPTIONS),
    '',
    heading('Agents'),
    ...agentsByInitial(agents),
  ].join('\n');

export const addUsage = (): string =>
  [
    'usage: npx blue-spec add --skills',
    'options:',
    '  --skills   security specializations to install (run with no value to choose interactively)',
    'run `npx blue-spec list` to see available categories',
  ].join('\n');

export const removeUsage = (): string =>
  [
    'usage: npx blue-spec remove --skills',
    'options:',
    '  --skills   security specializations to uninstall (run with no value to choose interactively)',
    'run `npx blue-spec list` to see available categories',
  ].join('\n');

export const noAgentSelected = (agentKeys: string[]): string => {
  const first = agentKeys[0];

  return [
    'No agent selected.',
    `Pass an agent (available: ${agentKeys.join(', ')}).`,
    `Example: npx blue-spec init ${first}`,
  ].join('\n');
};

export const updateNotInitialized = (agentKeys: string[]): string => {
  const first = agentKeys[0];

  return [
    'No Blue Spec install found here.',
    `Run npx blue-spec init <agent> first (available: ${agentKeys.join(', ')}).`,
    `Example: npx blue-spec init ${first}`,
  ].join('\n');
};

export const agentSelectTitle = (): string => 'Which agent are you using?';

export const agentSelectHint = (): string =>
  'Type to filter, arrow keys to move.';

export const agentChoiceLabel = (
  displayName: string,
  installed: boolean
): string =>
  installed ? `${displayName} ${color.green('[installed]')}` : displayName;

export const selectionAborted = (): string => 'No agent selected: cancelled.';

const footer = (...middle: string[]): string =>
  ['Enter to confirm', ...middle, 'Esc to cancel'].join(' · ');

export const selectFooter = (): string => footer();

export const skillsSelectFooter = (): string => footer('empty to skip');

export const listSelectTitle = (): string => 'What do you want to list?';

export const listSelectHint = (): string => 'Arrow keys to move.';

export const skillsSelectTitle = (): string =>
  'Which security specializations do you want?';

export const skillsSelectHint = (): string =>
  'Space to toggle, arrow keys to move.';

const createdLine = (path: string): string => `  ${GLYPH.added} ${path}`;

const refreshedLine = (path: string): string =>
  `  ${GLYPH.refreshed} ${path} ${note('refreshed')}`;

const skippedLine = (path: string): string =>
  `  ${GLYPH.kept} ${path} ${note('already exists')}`;

const removedLine = (path: string): string => `  ${GLYPH.removed} ${path}`;

const notInstalledLine = (path: string): string =>
  `  ${GLYPH.kept} ${path} ${note('not installed')}`;

const keptLine = (path: string, keptBy: string): string =>
  `  ${GLYPH.kept} ${path} ${note(`still used by ${keptBy}`)}`;

export const categoryList = (
  groups: SkillGroup[],
  installedKeys: string[]
): string => {
  if (groups.length === 0)
    return color.dim('No specialization categories available.');

  const installed = new Set(installedKeys);
  const keyWidth = Math.max(...groups.map((group) => group.key.length));

  const rows = groups.map((group) => {
    const key = group.key.padEnd(keyWidth);
    const state = installed.has(group.key)
      ? color.green('[installed]')
      : color.dim('[available]');

    return bullet(`${key}  ${state}  ${group.description}`);
  });

  return [
    `${heading('Specializations')} ${color.dim('.bluespec/skills/')}`,
    ...rows,
  ].join('\n');
};

export const findingsReport = (names: string[]): string => {
  if (names.length === 0) return color.dim('No findings tracked yet.');

  return [heading('Findings'), ...names.map(bullet)].join('\n');
};

export const addSummary = (created: number, skipped: number): string => {
  if (created === 0)
    return color.dim(
      skipped === 0
        ? 'Nothing to install.'
        : 'Specializations already installed.'
    );

  return done(
    `Installed ${color.dim('·')} ${created} added${restAt(skipped, 'already present')}`
  );
};

export const removeSummary = (
  removed: number,
  notInstalled: number,
  kept: number
): string => {
  if (removed === 0 && kept === 0)
    return color.dim(
      notInstalled === 0
        ? 'Nothing to remove.'
        : 'Specializations not installed.'
    );

  return done(
    `Removed ${color.dim('·')} ${removed} removed${restAt(kept, 'kept, still used elsewhere')}`
  );
};

const relativeTo = (baseDir: string, path: string): string =>
  baseDir && path.startsWith(baseDir) ? path.slice(baseDir.length) : path;

const lineFor = (outcome: FileOutcome, path: string): string => {
  if (outcome.status === 'created') return createdLine(path);
  if (outcome.status === 'refreshed') return refreshedLine(path);
  if (outcome.status === 'removed') return removedLine(path);
  if (outcome.status === 'kept') return keptLine(path, outcome.keptBy ?? '');
  if (outcome.status === 'absent') return notInstalledLine(path);

  return skippedLine(path);
};

const groupBlock = (group: ScaffoldGroup): string => {
  const header = `${color.blue(group.label)} ${color.dim(group.baseDir)}`;
  const rows = group.outcomes.map((outcome) =>
    lineFor(outcome, relativeTo(group.baseDir, outcome.path))
  );

  return [header, ...rows].join('\n');
};

export const groupedReport = (groups: ScaffoldGroup[]): string =>
  groups.map(groupBlock).join('\n\n');

export const summaryLine = (
  agentDisplayName: string,
  result: ScaffoldResult
): string => {
  if (result.created.length === 0)
    return color.dim(`Already initialized for ${agentDisplayName}.`);

  return done(
    `Initialized for ${agentDisplayName} ${color.dim('·')} ${result.created.length} created${restAt(result.skipped.length, 'skipped')}`
  );
};

export const gitignoreResult = (result: GitignoreOutcome): string => {
  if (result === 'unchanged') return '';

  const action = result === 'created' ? 'Created' : 'Updated';

  return done(`${action} .gitignore with Blue Spec entries`);
};

export const updateSummary = (
  agentDisplayName: string,
  refreshed: number
): string => {
  if (refreshed === 0)
    return color.dim(`Nothing to update for ${agentDisplayName}.`);

  return done(
    `Updated for ${agentDisplayName} ${color.dim('·')} ${refreshed} refreshed`
  );
};

export const pullNotInitialized = (agentKeys: string[]): string => {
  const first = agentKeys[0];

  return [
    'No Blue Spec manifest found here.',
    'pull reconstructs Blue Spec from a committed .bluespec/manifest.json.',
    `If this is a fresh project, run npx blue-spec init <agent> first (available: ${agentKeys.join(', ')}).`,
    `Example: npx blue-spec init ${first}`,
  ].join('\n');
};

export const pullSummary = (
  agentDisplayName: string,
  result: ScaffoldResult
): string => {
  if (result.created.length === 0)
    return color.dim(`Already up to date for ${agentDisplayName}.`);

  return done(
    `Reconstructed for ${agentDisplayName} ${color.dim('·')} ${result.created.length} restored${restAt(result.skipped.length, 'already present')}`
  );
};

const STEPS: string[] = [
  `Open ${color.bold('{{agent}}')} in this project`,
  `Run ${color.blue('/bluespec.charter')} to set your security rules`,
  `Run ${color.blue('/bluespec.detect')} to map what your project does and where the risks are`,
  `Run ${color.blue('/bluespec.plan')} to turn those findings into a prioritized fix plan`,
  `Run ${color.blue('/bluespec.harden')} to apply the fixes, then ${color.blue('/bluespec.verify')} to prove they hold`,
];

export const nextSteps = (agentDisplayName: string): string =>
  [
    color.bold('Next steps'),
    ...STEPS.map(
      (step, index) =>
        `  ${color.dim(`${index + 1}`)}  ${step.replace('{{agent}}', agentDisplayName)}`
    ),
  ].join('\n');
