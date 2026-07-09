import { cwd } from 'node:process';
import { runHook } from '../../cli/run-hook.js';
import { renderSpecializations } from '../../core/specializations.js';

/**
 * @example node ./.lagune/hooks/specializations.mjs   // rebuilds .lagune/specializations.md from the catalog
 */
await runHook(import.meta.url, async () => {
  await renderSpecializations(cwd());

  return 'rebuilt .lagune/specializations.md\n';
});
