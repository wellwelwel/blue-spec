import type { Skill, Uphold } from '../../../types/dashboard/dashboard';
import { afterSeparator } from '../../../core/markdown/fields';
import { bulletText, inlineText } from '../../../core/markdown/lines';
import { withinSection } from '../../../core/markdown/sections';
import { skillLabel } from '../../shared/skill-meta';

const SKILL_PATH_PREFIX = '.lagune/skills/';
const SKILL_PATH_EXTENSION = '.md';
const BOLD_MARKS = ['**', '__'];
const CODE_MARK = '`';

const dropPrefix = (text: string, mark: string): string =>
  text.startsWith(mark) ? text.slice(mark.length) : text;

const dropOpeningDecoration = (text: string): string => {
  const withoutBold = BOLD_MARKS.reduce(dropPrefix, text);

  return dropPrefix(withoutBold, CODE_MARK);
};

const skipClosingDecoration = (text: string, index: number): number => {
  let cursor = index;

  if (text.startsWith(CODE_MARK, cursor)) cursor += CODE_MARK.length;

  for (const mark of BOLD_MARKS)
    if (text.startsWith(mark, cursor)) cursor += mark.length;

  return cursor;
};

const skillRow = (line: string): Skill | null => {
  const bullet = bulletText(line);
  if (bullet === null) return null;

  const content = dropOpeningDecoration(bullet);
  if (!content.startsWith(SKILL_PATH_PREFIX)) return null;

  const dot = content.indexOf(SKILL_PATH_EXTENSION, SKILL_PATH_PREFIX.length);
  if (dot === -1) return null;

  const name = content.slice(SKILL_PATH_PREFIX.length, dot);
  if (name === '' || name.includes('`') || name.includes('/')) return null;

  const afterPath = skipClosingDecoration(
    content,
    dot + SKILL_PATH_EXTENSION.length
  );

  const cursor = afterSeparator(content, afterPath);
  if (cursor === -1) return null;

  const surfaced = inlineText(content.slice(cursor));
  if (surfaced === '') return null;

  return { name, label: skillLabel(name), applied: true, surfaced };
};

export const parseSkills = (text: string | null): Skill[] => {
  const out: Skill[] = [];

  for (const line of withinSection(text, (heading) =>
    /applied sub-skills/i.test(heading)
  )) {
    if (line.code) continue;

    const row = skillRow(line.text);
    if (row) out.push(row);
  }
  return out;
};

const BASELINE_PHRASES = [
  'Prefer the simplest vetted control',
  'Only the controls the project needs',
];

const startsUphold = (text: string): boolean =>
  /^[IVXLC]+\.\s/.test(text) ||
  BASELINE_PHRASES.some((phrase) => text.startsWith(phrase));

const splitUpholds = (raw: string): string[] => {
  const [first, ...rest] = raw.split(',');
  const parts = [first];

  for (const piece of rest) {
    if (startsUphold(piece.trimStart())) parts.push(piece);
    else parts[parts.length - 1] += `,${piece}`;
  }

  return parts;
};

export const parseUpholds = (raw: string | null): Uphold[] => {
  if (!raw || /^none directly$/i.test(raw.trim())) return [];
  return splitUpholds(raw)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((text) => {
      const numbered = text.match(/^([IVXLC]+)\.\s*(.*)$/);
      if (numbered)
        return {
          baseline: false,
          label: `${numbered[1]} · ${numbered[2]}`,
          full: text,
        };
      return { baseline: true, label: `Baseline · ${text}`, full: text };
    });
};
