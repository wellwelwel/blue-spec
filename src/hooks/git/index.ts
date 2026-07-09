import { cwd } from 'node:process';
import { runHook } from '../../cli/run-hook.js';
import { git } from './git.js';

/**
 * @example node ./.lagune/hooks/git.mjs --keep-skill graphql
 */
await runHook(import.meta.url, (args) => git(cwd(), args));
