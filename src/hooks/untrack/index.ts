import { cwd } from 'node:process';
import { runHook } from '../../cli/run-hook.js';
import { untrack } from './untrack.js';

/**
 * @example node ./.lagune/hooks/untrack.mjs '{"names":["Leaked secret"]}'
 */
await runHook(import.meta.url, (args) =>
  untrack(cwd(), args[0] ?? '', new Date())
);
