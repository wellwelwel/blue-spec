import type { HistoryAppend, HistoryEntry } from '../../types/core.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ensureDir, writeFileOverwrite } from '../../core/fs-actions.js';
import { stripComments } from '../../core/markdown/comments.js';
import { bulletField } from '../../core/markdown/fields.js';
import { inlineText } from '../../core/markdown/lines.js';
import { sectionBlocks } from '../../core/markdown/sections.js';

const HISTORY_DIR = '.lagune/memory';
const HISTORY_PATH = '.lagune/memory/history.md';
const HISTORY_SECTION = 'Closed findings';
const HISTORY_HEADER = `# Lagune History\n\n## ${HISTORY_SECTION}\n`;
const UNRANKED = 'Unranked';

const readMarkdown = async (path: string): Promise<string | null> => {
  try {
    return stripComments(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
};

const toIsoDate = (now: Date): string => now.toISOString().slice(0, 10);

const distill = (
  names: string[],
  detect: string | null,
  plan: string | null,
  closed: string
): HistoryEntry[] => {
  const detected = sectionBlocks(detect, 'Findings');
  const planned = sectionBlocks(plan, 'Fixes');
  const wanted = new Set(names);

  return detected
    .filter((block) => wanted.has(block.name))
    .map((block) => {
      const fix = planned.find((entry) => entry.name === block.name);

      return {
        name: block.name,
        classification:
          inlineText(fix ? bulletField(fix.body, 'Priority') : null) ||
          UNRANKED,
        category: inlineText(fix ? bulletField(fix.body, 'Category') : null),
        whatItIs: inlineText(bulletField(block.body, 'What it is')),
        closed,
      };
    });
};

const renderEntry = (entry: HistoryEntry): string =>
  [
    `### ${entry.name}`,
    '',
    `- **Classification:** ${entry.classification}`,
    ...(entry.category ? [`- **Category:** ${entry.category}`] : []),
    `- **What it is:** ${entry.whatItIs}`,
    `- **Closed:** ${entry.closed}`,
  ].join('\n');

const withTrailingBlank = (text: string): string => {
  if (text.endsWith('\n\n')) return text;
  if (text.endsWith('\n')) return `${text}\n`;

  return `${text}\n\n`;
};

export const appendClosedFindings = async (
  targetDir: string,
  names: string[],
  now: Date
): Promise<HistoryAppend> => {
  const [detect, plan] = await Promise.all([
    readMarkdown(join(targetDir, '.lagune/memory/detect.md')),
    readMarkdown(join(targetDir, '.lagune/memory/plan.md')),
  ]);

  const entries = distill(names, detect, plan, toIsoDate(now));

  if (entries.length === 0) return { file: HISTORY_PATH, recorded: [] };

  const path = join(targetDir, HISTORY_PATH);
  const existing = await readFile(path, 'utf8').catch(() => HISTORY_HEADER);
  const block = entries.map(renderEntry).join('\n\n');

  await ensureDir(join(targetDir, HISTORY_DIR));
  await writeFileOverwrite(path, `${withTrailingBlank(existing)}${block}\n`);

  return { file: HISTORY_PATH, recorded: entries.map((entry) => entry.name) };
};
