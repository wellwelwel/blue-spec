import type {
  RegexInput,
  RegexSafetyOptions,
  RegexVerdict,
} from '../../types/hooks/regex.js';
import { scanQuantifiers } from './quantifiers.js';

const DEFAULT_REPETITION_LIMIT = 25;

const validSource = (regex: RegexInput): string | null => {
  try {
    if (regex instanceof RegExp) {
      new RegExp(regex.source, regex.flags);
      return regex.source;
    }

    const source = String(regex);

    new RegExp(source);
    return source;
  } catch {
    return null;
  }
};

export const parseLimit = (raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined;

  if (!/^\d+$/.test(raw))
    throw new Error(
      `repetition limit must be a non-negative integer, got "${raw}"`
    );

  return Number(raw);
};

/** Classifies a regex as `safe`, ReDoS-prone `unsafe`, or `invalid regex` */
export const check = (
  regex: RegexInput,
  options: Partial<RegexSafetyOptions> = Object.create(null)
): RegexVerdict => {
  const source = validSource(regex);

  if (source === null) return 'invalid regex';

  const repetitionLimit = options.repetitionLimit ?? DEFAULT_REPETITION_LIMIT;
  const { repetitionCount, backtrack } = scanQuantifiers(source);
  const safe = repetitionCount <= repetitionLimit && !backtrack;

  return safe ? 'safe' : 'unsafe';
};
