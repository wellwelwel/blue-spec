import { runHook } from '../../cli/run-hook.js';
import { run } from './cli.js';

/**
 * @example node ./.lagune/hooks/regex.mjs                  // scans the whole project
 * @example node ./.lagune/hooks/regex.mjs -d src/auth      // scans a directory
 * @example node ./.lagune/hooks/regex.mjs -f src/auth.ts   // scans a single file
 * @example node ./.lagune/hooks/regex.mjs -p '(a+)+'       // => unsafe
 * @example node ./.lagune/hooks/regex.mjs -p 'a?a?a?' -l 2 // => unsafe (custom limit)
 */
await runHook(import.meta.url, (args) => run(args));
