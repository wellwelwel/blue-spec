import { runHook } from '../../cli/run-hook.js';
import { run } from './cli.js';

/**
 * @example node ./.lagune/hooks/secrets.mjs                    // scans the whole project
 * @example node ./.lagune/hooks/secrets.mjs -d src            // scans a directory
 * @example node ./.lagune/hooks/secrets.mjs -f src/config.ts  // scans a single file
 */
await runHook(import.meta.url, (args) => run(args));
