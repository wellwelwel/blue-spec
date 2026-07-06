import type { Tracking, TrackingEntry } from '../../../types/dashboard/server';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const toEntry = (value: unknown): TrackingEntry | null => {
  if (typeof value !== 'object' || value === null) return null;
  if (!('name' in value) || !('paths' in value)) return null;
  const { name, paths } = value;
  if (typeof name !== 'string' || !isStringArray(paths)) return null;
  return { name, paths };
};

export const parseTracking = (raw: string | null): Tracking => {
  if (!raw) return { entries: [] };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('entries' in parsed)
    ) {
      return { entries: [] };
    }
    const { entries } = parsed;
    if (!Array.isArray(entries)) return { entries: [] };
    return {
      entries: entries
        .map(toEntry)
        .filter((entry): entry is TrackingEntry => entry !== null),
    };
  } catch {
    return { entries: [] };
  }
};

export const pathsByName = (tracking: Tracking): Record<string, string[]> =>
  Object.fromEntries(
    tracking.entries.map((entry) => [entry.name, entry.paths])
  );
