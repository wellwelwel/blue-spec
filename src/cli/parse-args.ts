import type { CliCommand, ParsedCliArgs } from '../types/core.js';
import { parseArgs } from 'node:util';

const COMMANDS: CliCommand[] = [
  'init',
  'update',
  'pull',
  'add',
  'remove',
  'list',
  'dashboard',
];

const toCommand = (value: string | undefined): CliCommand | undefined =>
  COMMANDS.find((command) => command === value);

const parsePort = (value: unknown): number | undefined => {
  if (typeof value !== 'string') return undefined;

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error(`Invalid port: ${value} (expected 1024-65535)`);

  return port;
};

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
      port: { type: 'string', short: 'p' },
    },
  });

  const command = toCommand(positionals[0]);
  const skillsRequested = values.skills === true;
  const findingsRequested = values.findings === true;
  const help = values.help === true;
  const version = values.version === true;
  const categoryStart = command === 'init' ? 2 : 1;
  const port = parsePort(values.port);
  const bare =
    positionals.length === 0 &&
    !skillsRequested &&
    !findingsRequested &&
    !help &&
    !version;

  return {
    command,
    agent: command === 'init' ? positionals[1] : undefined,
    skills: skillsRequested ? positionals.slice(categoryStart) : [],
    skillsRequested,
    findingsRequested,
    help,
    version,
    bare,
    port,
  };
};
