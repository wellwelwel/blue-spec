import { cwd } from 'node:process';
import { runHook } from '../../cli/run-hook.js';
import { track } from './track.js';

/**
 * @example node ./.lagune/hooks/track.mjs '{"entries":[{"name":"Leaked secret","paths":["src/config.ts"]}]}'
 */
await runHook(import.meta.url, (args) => track(cwd(), args[0] ?? ''));
