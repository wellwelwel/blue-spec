import type { CliCommand, ParsedCliArgs } from '../types/core.js';
import { parseArgs } from 'node:util';

const COMMANDS: CliCommand[] = ['init', 'update', 'add', 'remove', 'list'];

const toCommand = (value: string | undefined): CliCommand | undefined =>
  COMMANDS.find((command) => command === value);

export const parseCliArgs = (argv: string[]): ParsedCliArgs => {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
      skills: { type: 'boolean' },
      findings: { type: 'boolean' },
    },
  });

  const command = toCommand(positionals[0]);
  const skillsRequested = values.skills === true;
  const categoryStart = command === 'init' ? 2 : 1;

  return {
    command,
    agent: command === 'init' ? positionals[1] : undefined,
    skills: skillsRequested ? positionals.slice(categoryStart) : [],
    skillsRequested,
    findingsRequested: values.findings === true,
    help: values.help === true,
    version: values.version === true,
  };
};
