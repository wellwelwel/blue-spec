import { bulletText, markdownLines } from './lines';

const BOLD_MARKS = ['**', '__'];
const DASH_SEPARATORS = ['—', '–'];

const spacesFrom = (line: string, index: number): number => {
  let cursor = index;
  while (line[cursor] === ' ') cursor += 1;
  return cursor;
};

export const afterSeparator = (line: string, index: number): number => {
  const cursor = spacesFrom(line, index);

  if (line[cursor] === ':') return cursor + 1;
  if (DASH_SEPARATORS.includes(line[cursor] ?? '')) return cursor + 1;
  if (line[cursor] === '-' && cursor > index && line[cursor + 1] === ' ')
    return cursor + 1;

  return -1;
};

export const fieldValue = (line: string, field: string): string | null => {
  const content = bulletText(line);
  if (content === null) return null;

  const boldMark = BOLD_MARKS.find((mark) => content.startsWith(mark));
  const nameStart = boldMark?.length ?? 0;
  const nameEnd = nameStart + field.length;

  if (content.slice(nameStart, nameEnd).toLowerCase() !== field.toLowerCase())
    return null;

  let cursor = nameEnd;
  let separated = false;

  const colon = spacesFrom(content, cursor);
  if (content[colon] === ':') {
    cursor = colon + 1;
    separated = true;
  }

  if (boldMark !== undefined) {
    const close = spacesFrom(content, cursor);
    if (!content.startsWith(boldMark, close)) return null;
    cursor = close + boldMark.length;
  }

  if (!separated) {
    cursor = afterSeparator(content, cursor);
    if (cursor === -1) return null;
  }

  return content.slice(cursor).trim();
};

export const bulletField = (
  text: string | null,
  field: string
): string | null => {
  for (const line of markdownLines(text ?? '')) {
    if (line.code) continue;

    const value = fieldValue(line.text, field);
    if (value !== null && value !== '') return value;
  }

  return null;
};
