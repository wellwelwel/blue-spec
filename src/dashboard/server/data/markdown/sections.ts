import type { Block, MarkdownLine } from '../../../../types/dashboard/server';
import { bulletText, headingLevel, inlineText, markdownLines } from './lines';

export function* withinSection(
  text: string | null,
  matches: (heading: string) => boolean
): Generator<MarkdownLine> {
  let inSection = false;

  for (const line of markdownLines(text ?? '')) {
    if (!line.code && headingLevel(line.text) === 1) {
      inSection = false;
      continue;
    }
    if (!line.code && line.text.startsWith('## ')) {
      inSection = matches(line.text.slice(3));
      continue;
    }
    if (inSection) yield line;
  }
}

const headingIs =
  (header: string) =>
  (heading: string): boolean =>
    heading.trim().toLowerCase() === header.toLowerCase();

export const sectionBlocks = (
  text: string | null,
  section: string
): Block[] => {
  const blocks: { name: string; lines: string[] }[] = [];
  let current: { name: string; lines: string[] } | null = null;

  for (const line of withinSection(text, headingIs(section))) {
    if (!line.code && line.text.startsWith('### ')) {
      if (current) blocks.push(current);
      current = { name: line.text.slice(4).trim(), lines: [] };
      continue;
    }
    if (current) current.lines.push(line.text);
  }
  if (current) blocks.push(current);

  return blocks.map((block) => ({
    name: block.name,
    body: block.lines.join('\n').trim(),
  }));
};

export const sectionBullets = (
  text: string | null,
  header: string
): string[] => {
  const out: string[] = [];

  for (const line of withinSection(text, headingIs(header))) {
    if (line.code) continue;
    if (headingLevel(line.text) > 0) continue;

    const bullet = bulletText(line.text);
    if (bullet !== null) out.push(inlineText(bullet));
    else if (line.text.trim() && out.length > 0)
      out[out.length - 1] += ` ${line.text.trim()}`;
  }

  return out;
};

export const firstParagraph = (body: string): string => {
  const out: string[] = [];

  for (const line of markdownLines(body ?? '')) {
    if (line.code || headingLevel(line.text) > 0) {
      if (out.length) break;
      continue;
    }
    if (bulletText(line.text) !== null) break;
    if (line.text.trim() === '') {
      if (out.length) break;
      continue;
    }
    out.push(line.text.trim());
  }

  return out.join(' ');
};

export const sectionIntro = (text: string | null, header: string): string => {
  const out: string[] = [];

  for (const line of withinSection(text, headingIs(header))) {
    if (line.code) continue;
    if (headingLevel(line.text) > 0) break;
    if (line.text.trim()) out.push(line.text.trim());
  }

  return out.join(' ');
};
