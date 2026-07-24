import type { HookResult } from '../../types/core.js';
import type { ReportHeadings } from '../../types/scan.js';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { parseArgs as parseNodeArgs } from 'node:util';
import { scanReport } from '../../core/scan/driver.js';
import { formatReport } from '../../core/scan/report.js';
import { analyzeInfra, classify } from './analyze.js';
import { INFRA_FILTER } from './filter.js';
import { isInfraKind } from './kind.js';
import { FINDING_TAGS } from './rules.js';

const OPTIONS = {
  pattern: { type: 'string', short: 'p', multiple: true },
  kind: { type: 'string', short: 'k' },
  dir: { type: 'string', short: 'd', multiple: true },
  file: { type: 'string', short: 'f', multiple: true },
} as const;

const HEADINGS: ReportHeadings = {
  sentinel: 'no infrastructure risks found\n',
  findings: 'Infrastructure risks found:',
  advisory: 'Infrastructure hardening advisories:',
};

const runCheck = (snippets: string[], kind: string | undefined): HookResult => {
  if (kind === undefined)
    throw new Error('-p needs -k <terraform|dockerfile|github-actions>');

  if (!isInfraKind(kind))
    throw new Error(
      `unknown kind "${kind}": use terraform, dockerfile, or github-actions`
    );

  const verdicts = snippets.map((snippet) => classify(snippet, kind));

  return {
    output: verdicts.join('\n') + '\n',
    hasFinding: verdicts.some((verdict) => FINDING_TAGS.has(verdict)),
  };
};

const runScan = async (targets: string[]): Promise<HookResult> => {
  const root = cwd();
  const paths = (targets.length > 0 ? targets : ['.']).map((target) =>
    resolve(root, target)
  );
  const report = await scanReport(root, paths, INFRA_FILTER, analyzeInfra);

  return {
    output: formatReport(report, HEADINGS),
    hasFinding: report.findings.length > 0,
  };
};

export const run = async (args: string[]): Promise<HookResult> => {
  const { values } = parseNodeArgs({ args, options: OPTIONS, strict: true });
  const snippets = values.pattern ?? [];
  const targets = [...(values.dir ?? []), ...(values.file ?? [])];

  if (snippets.length > 0) {
    if (targets.length > 0)
      throw new Error(
        '-p checks a snippet and cannot be combined with -d or -f'
      );

    return runCheck(snippets, values.kind);
  }

  return runScan(targets);
};
