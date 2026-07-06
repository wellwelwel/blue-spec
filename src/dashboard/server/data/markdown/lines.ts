import type { Nodes } from 'mdast';
import type { MarkdownLine } from '../../../../types/dashboard/server';
import { fromMarkdown } from 'mdast-util-from-markdown';

export const walk = (node: Nodes, visit: (node: Nodes) => void): void => {
  visit(node);
  if ('children' in node) for (const child of node.children) walk(child, visit);
};

export const markdownLines = (text: string): MarkdownLine[] => {
  const codeLines = new Set<number>();

  walk(fromMarkdown(text), (node) => {
    if (node.type !== 'code' || node.position === undefined) return;

    for (
      let line = node.position.start.line;
      line <= node.position.end.line;
      line += 1
    )
      codeLines.add(line);
  });

  return text
    .split('\n')
    .map((line, index) => ({ text: line, code: codeLines.has(index + 1) }));
};

export const headingLevel = (line: string): number => {
  let level = 0;
  while (line[level] === '#') level += 1;

  return level >= 1 && level <= 6 && line[level] === ' ' ? level : 0;
};

export const structuralText = (text: string): string =>
  markdownLines(text)
    .filter((line) => !line.code)
    .map((line) => line.text)
    .join('\n');

export const inlineText = (value: string | null | undefined): string =>
  (value ?? '').trim();

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const BULLET_MARKERS = ['- ', '* ', '+ '];

export const bulletText = (line: string): string | null => {
  for (const marker of BULLET_MARKERS)
    if (line.startsWith(marker)) return line.slice(marker.length);

  return null;
};
