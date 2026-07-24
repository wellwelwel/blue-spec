import type { HookResult } from '../../types/core.js';
import type { SourceHook } from '../../types/scan.js';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { parseArgs as parseNodeArgs } from 'node:util';
import { scanReport } from './driver.js';
import { SOURCE_FILTER } from './filters.js';
import { formatReport } from './report.js';
import { forLanguage } from './scope.js';

const OPTIONS = {
  pattern: { type: 'string', short: 'p', multiple: true },
  dir: { type: 'string', short: 'd', multiple: true },
  file: { type: 'string', short: 'f', multiple: true },
} as const;

export const sourceHookRun =
  (hook: SourceHook) =>
  async (args: string[]): Promise<HookResult> => {
    const { values } = parseNodeArgs({ args, options: OPTIONS, strict: true });
    const snippets = values.pattern ?? [];
    const targets = [...(values.dir ?? []), ...(values.file ?? [])];

    if (snippets.length > 0) {
      if (targets.length > 0)
        throw new Error(
          '-p checks a snippet and cannot be combined with -d or -f'
        );

      const verdicts = snippets.map((snippet) => hook.classify(snippet));

      return {
        output: verdicts.join('\n') + '\n',
        hasFinding: verdicts.includes(hook.findingVerdict),
      };
    }

    const root = cwd();
    const paths = (targets.length > 0 ? targets : ['.']).map((target) =>
      resolve(root, target)
    );
    const report = await scanReport(
      root,
      paths,
      SOURCE_FILTER,
      forLanguage(hook.language, hook.analyze)
    );

    return {
      output: formatReport(report, hook.headings),
      hasFinding: report.findings.length > 0,
    };
  };
