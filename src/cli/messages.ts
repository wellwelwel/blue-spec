import type { ScaffoldResult } from '../types/core.js';

export const helpText = (agentKeys: string[]): string =>
  [
    'Blue Spec: a defensive, security-first workflow for your project.',
    '',
    'Usage:',
    '  npx blue-spec init <agent>',
    '',
    'Commands:',
    '  init <agent>      Scaffold Blue Spec into the current project',
    '',
    'Options:',
    '  -h, --help        Show this help',
    '  -v, --version     Show the version',
    '',
    `Available agents: ${agentKeys.join(', ')}`,
  ].join('\n');

export const noAgentSelected = (agentKeys: string[]): string => {
  const first = agentKeys[0];

  return [
    'No agent selected.',
    `Pass an agent (available: ${agentKeys.join(', ')}).`,
    `Example: npx blue-spec init ${first}`,
  ].join('\n');
};

export const agentSelectTitle = (): string => 'Which agent are you using?';

export const agentSelectHint = (): string =>
  'Type to filter, arrow keys to move, Enter to confirm.';

export const selectionAborted = (): string => 'No agent selected: cancelled.';

export const createdLine = (path: string): string => `  created  ${path}`;

export const skippedLine = (path: string): string =>
  `  skipped  ${path} (already exists)`;

export const summaryLine = (
  agentDisplayName: string,
  result: ScaffoldResult
): string => {
  if (result.created.length === 0)
    return `Blue Spec is already initialized for ${agentDisplayName}: nothing to do.`;

  return `Blue Spec initialized for ${agentDisplayName}: ${result.created.length} created, ${result.skipped.length} skipped.`;
};

export const nextSteps = (agentDisplayName: string): string =>
  [
    '',
    'Next steps:',
    `  1. Open ${agentDisplayName} in this project.`,
    '  2. Run /bluespec.charter to set your security rules.',
    '  3. Run /bluespec.detect to map what your project does and where the risks are.',
    '  4. Run /bluespec.plan to turn those findings into a prioritized fix plan.',
    '  5. Run /bluespec.harden to apply the fixes, then /bluespec.verify to prove they hold.',
  ].join('\n');
