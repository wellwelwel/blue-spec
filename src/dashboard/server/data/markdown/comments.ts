import type { TextSpan } from '../../../../types/dashboard/server';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { walk } from './lines';

const OPEN_COMMENT = '<!--';
const CLOSE_COMMENT = '-->';

const commentSpans = (text: string): TextSpan[] => {
  const spans: TextSpan[] = [];

  walk(fromMarkdown(text), (node) => {
    if (node.type !== 'html' || node.position === undefined) return;

    const from = node.position.start.offset;
    const to = node.position.end.offset;
    if (from === undefined || to === undefined) return;

    let cursor = from;
    while (cursor < to) {
      const open = text.indexOf(OPEN_COMMENT, cursor);
      if (open === -1 || open >= to) break;

      const close = text.indexOf(CLOSE_COMMENT, open + OPEN_COMMENT.length);
      if (close === -1 || close + CLOSE_COMMENT.length > to) break;

      spans.push({ from: open, to: close + CLOSE_COMMENT.length });
      cursor = close + CLOSE_COMMENT.length;
    }
  });

  return spans.sort((left, right) => left.from - right.from);
};

const coversWholeLines = (
  text: string,
  open: number,
  afterClose: number
): { covers: boolean; lineStart: number; nextLineStart: number } => {
  const lineStart = text.lastIndexOf('\n', open - 1) + 1;
  const lineEnd = text.indexOf('\n', afterClose);
  const nextLineStart = lineEnd === -1 ? text.length : lineEnd + 1;
  const leading = text.slice(lineStart, open);
  const trailing = text.slice(
    afterClose,
    lineEnd === -1 ? text.length : lineEnd
  );

  return {
    covers: leading.trim() === '' && trailing.trim() === '',
    lineStart,
    nextLineStart,
  };
};

export const stripComments = (text: string): string => {
  const spans = commentSpans(text);
  if (spans.length === 0) return text;

  let output = '';
  let position = 0;

  for (const span of spans) {
    if (span.from < position) continue;

    const line = coversWholeLines(text, span.from, span.to);

    if (line.covers && line.lineStart >= position) {
      output += text.slice(position, line.lineStart);
      position = line.nextLineStart;
    } else {
      output += text.slice(position, span.from);
      position = span.to;
    }
  }

  return output + text.slice(position);
};
