import type { Skill, Uphold } from '../../../types/dashboard/dashboard';
import { skillLabel } from '../../shared/skill-meta';
import { afterSeparator } from './markdown/fields';
import { bulletText, inlineText } from './markdown/lines';
import { withinSection } from './markdown/sections';

const SKILL_PATH_PREFIX = '`.bluespec/skills/';
const SKILL_PATH_SUFFIX = '.md`';

const skillRow = (line: string): Skill | null => {
  const content = bulletText(line);
  if (content === null || !content.startsWith(SKILL_PATH_PREFIX)) return null;

  const suffix = content.indexOf(SKILL_PATH_SUFFIX, SKILL_PATH_PREFIX.length);
  if (suffix === -1) return null;

  const name = content.slice(SKILL_PATH_PREFIX.length, suffix);
  if (name === '' || name.includes('`')) return null;

  const cursor = afterSeparator(content, suffix + SKILL_PATH_SUFFIX.length);
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
