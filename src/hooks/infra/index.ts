import { runHook } from '../../cli/run-hook.js';
import { run } from './cli.js';

/**
 * @example node ./.lagune/hooks/infra.mjs                                   // scans the whole project
 * @example node ./.lagune/hooks/infra.mjs -d infra                         // scans a directory
 * @example node ./.lagune/hooks/infra.mjs -f Dockerfile                    // scans a single file
 * @example node ./.lagune/hooks/infra.mjs -k dockerfile -p 'FROM node:20'  // => mutable-tag
 * @example node ./.lagune/hooks/infra.mjs -k terraform -p 'actions = ["*"]' // => iam-wildcard
 */
await runHook(import.meta.url, (args) => run(args));
