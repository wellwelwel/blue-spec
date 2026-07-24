import type { WalkFilter } from '../../types/scan.js';
import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const isIgnoredDir = (
  filter: WalkFilter,
  scanRoot: string,
  path: string,
  name: string
): boolean =>
  filter.ignoredDirs.has(name) ||
  filter.ignoredDirPatterns.some((pattern) => pattern.test(name)) ||
  path === join(scanRoot, '.lagune');

const collect = async (
  scanRoot: string,
  displayRoot: string,
  current: string,
  filter: WalkFilter
): Promise<string[]> => {
  let entries;

  try {
    entries = await readdir(current, { withFileTypes: true });
  } catch {
    return [];
  }

  const found: string[] = [];

  for (const entry of entries.toSorted((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    const path = join(current, entry.name);

    if (entry.isDirectory()) {
      if (isIgnoredDir(filter, scanRoot, path, entry.name)) continue;

      found.push(...(await collect(scanRoot, displayRoot, path, filter)));
      continue;
    }

    if (entry.isFile()) {
      const rel = relative(displayRoot, path);

      if (filter.accept(rel)) found.push(rel);
    }
  }

  return found;
};

export const walk = async (
  displayRoot: string,
  target: string,
  filter: WalkFilter
): Promise<string[]> => {
  try {
    const stats = await stat(target);

    if (stats.isFile()) {
      const rel = relative(displayRoot, target);

      return filter.accept(rel) ? [rel] : [];
    }

    return collect(target, displayRoot, target, filter);
  } catch {
    return [];
  }
};
