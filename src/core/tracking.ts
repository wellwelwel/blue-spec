import type {
  EntryClassification,
  FoldState,
  ItemMatch,
  ObservedEntry,
  RemovalResult,
  TrackingEntry,
  TrackingMap,
} from '../types/core.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ensureDir, writeFileOverwrite } from './fs-actions.js';

const TRACKING_DIR = '.lagune';
const TRACKING_PATH = '.lagune/tracking.json';

export const emptyTrackingMap = (): TrackingMap => ({
  name: 'lagune',
  entries: [],
});

export const samePaths = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) return false;

  const sortedRight = right.toSorted();

  return left.toSorted().every((path, index) => path === sortedRight[index]);
};

const matchItem = (observed: ObservedEntry, map: TrackingMap): ItemMatch => {
  const existing = map.entries.find((entry) => entry.name === observed.name);

  if (existing) {
    const classification: EntryClassification = samePaths(
      existing.paths,
      observed.paths
    )
      ? 'unchanged'
      : 'moved';

    return {
      entry: { name: existing.name, paths: [...observed.paths] },
      classification: { name: existing.name, classification },
    };
  }

  return {
    entry: { name: observed.name, paths: [...observed.paths] },
    classification: { name: observed.name, classification: 'new' },
  };
};

const upsert = (
  entries: TrackingEntry[],
  next: TrackingEntry
): TrackingEntry[] =>
  entries.some((entry) => entry.name === next.name)
    ? entries.map((entry) => (entry.name === next.name ? next : entry))
    : [...entries, next];

export const foldEntries = (
  map: TrackingMap,
  observed: ObservedEntry[]
): FoldState =>
  observed.reduce<FoldState>(
    (state, item) => {
      const match = matchItem(item, state.map);

      return {
        map: {
          name: 'lagune',
          entries: upsert(state.map.entries, match.entry),
        },
        classifications: [...state.classifications, match.classification],
      };
    },
    { map, classifications: [] }
  );

export const removeEntries = (
  map: TrackingMap,
  names: string[]
): RemovalResult => {
  const wanted = new Set(names);
  const kept = map.entries.filter((entry) => !wanted.has(entry.name));
  const removed = map.entries
    .filter((entry) => wanted.has(entry.name))
    .map((entry) => entry.name);
  const notFound = names.filter(
    (name) => !map.entries.some((entry) => entry.name === name)
  );

  return {
    updatedMap: { name: 'lagune', entries: kept },
    removed,
    notFound,
  };
};

const isObservedEntry = (value: unknown): value is ObservedEntry =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ObservedEntry).name === 'string' &&
  Array.isArray((value as ObservedEntry).paths) &&
  (value as ObservedEntry).paths.every((path) => typeof path === 'string');

export const toObservedEntries = (value: unknown): ObservedEntry[] =>
  Array.isArray(value)
    ? value
        .filter(isObservedEntry)
        .map((entry) => ({ name: entry.name, paths: [...entry.paths] }))
    : [];

export const parseObservedPayload = (raw: string): ObservedEntry[] => {
  const parsed: unknown = JSON.parse(raw);

  return toObservedEntries((parsed as { entries?: unknown }).entries);
};

export const toNames = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((name): name is string => typeof name === 'string')
    : [];

export const parseNamePayload = (raw: string): string[] => {
  const parsed: unknown = JSON.parse(raw);

  return toNames((parsed as { names?: unknown }).names);
};

const normalizeEntry = (value: unknown): TrackingEntry | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;

  const candidate = value as Record<string, unknown>;
  const { name } = candidate;
  const paths = Array.isArray(candidate.paths)
    ? candidate.paths.filter((path): path is string => typeof path === 'string')
    : [];

  if (typeof name !== 'string') return undefined;

  return { name, paths };
};

const parseTrackingMap = (raw: string): TrackingMap => {
  const parsed: unknown = JSON.parse(raw);

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as { entries?: unknown }).entries)
  )
    return emptyTrackingMap();

  const entries = (parsed as { entries: unknown[] }).entries
    .map(normalizeEntry)
    .filter((entry): entry is TrackingEntry => entry !== undefined);

  return { name: 'lagune', entries };
};

export const loadTrackingMap = async (
  targetDir: string
): Promise<TrackingMap> => {
  try {
    const raw = await readFile(join(targetDir, TRACKING_PATH), 'utf8');

    return parseTrackingMap(raw);
  } catch {
    return emptyTrackingMap();
  }
};

export const serializeTrackingMap = (map: TrackingMap): string =>
  `${JSON.stringify(map, null, 2)}\n`;

export const writeTrackingMap = async (
  targetDir: string,
  map: TrackingMap
): Promise<void> => {
  await ensureDir(join(targetDir, TRACKING_DIR));
  await writeFileOverwrite(
    join(targetDir, TRACKING_PATH),
    serializeTrackingMap(map)
  );
};
