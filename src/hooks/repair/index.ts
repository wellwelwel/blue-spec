import { cwd } from 'node:process';
import { runHook } from '../../cli/run-hook.js';
import { repair } from './repair.js';

/**
 * @example node ./.lagune/hooks/repair.mjs '{"entries":[{"name":"Leaked secret","paths":["src/config.ts"]}]}'
 */
await runHook(import.meta.url, (args) => repair(cwd(), args[0] ?? ''));
