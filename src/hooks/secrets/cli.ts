import type { HookResult } from '../../types/core.js';
import type { ReportHeadings } from '../../types/scan.js';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { parseArgs as parseNodeArgs } from 'node:util';
import { scanReport } from '../../core/scan/driver.js';
import { SOURCE_FILTER } from '../../core/scan/filters.js';
import { formatReport } from '../../core/scan/report.js';
import { analyze } from './secrets.js';

const OPTIONS = {
  dir: { type: 'string', short: 'd', multiple: true },
  file: { type: 'string', short: 'f', multiple: true },
} as const;

const HEADINGS: ReportHeadings = {
  sentinel: 'no hardcoded secrets found\n',
  findings: 'Hardcoded secrets found:',
  review: 'Secret handling to review manually:',
};

const runScan = async (targets: string[]): Promise<HookResult> => {
  const root = cwd();
  const paths = (targets.length > 0 ? targets : ['.']).map((target) =>
    resolve(root, target)
  );
  const report = await scanReport(root, paths, SOURCE_FILTER, analyze);

  return {
    output: formatReport(report, HEADINGS),
    hasFinding: report.findings.length > 0,
  };
};

export const run = async (args: string[]): Promise<HookResult> => {
  const { values } = parseNodeArgs({ args, options: OPTIONS, strict: true });
  const targets = [...(values.dir ?? []), ...(values.file ?? [])];

  return runScan(targets);
};
