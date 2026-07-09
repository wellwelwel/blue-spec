import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const IGNORED_DIRS = new Set([
  '.git',
  '.hg',
  '.svn',
  'node_modules',
  'bower_components',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.angular',
  '.astro',
  '.parcel-cache',
  '.turbo',
  '.output',
  '.cache',
  '__pycache__',
  '.venv',
  '.tox',
  '.mypy_cache',
  '.pytest_cache',
  '.ruff_cache',
  '.gradle',
  '.bundle',
  '.dart_tool',
  '.build',
  'Pods',
  'Carthage',
  'DerivedData',
  '.terraform',
  '.idea',
  '__test__',
  '__tests__',
  '__fixture__',
  '__fixtures__',
]);

const IGNORED_DIR_PATTERNS = [/^lagune\./, /\.egg-info$/];

const isIgnoredDir = (scanRoot: string, path: string, name: string): boolean =>
  IGNORED_DIRS.has(name) ||
  IGNORED_DIR_PATTERNS.some((pattern) => pattern.test(name)) ||
  path === join(scanRoot, '.lagune');

const IGNORED_EXTENSIONS = new Set([
  '.gif',
  '.gz',
  '.ico',
  '.jpeg',
  '.jpg',
  '.lock',
  '.pdf',
  '.png',
  '.svg',
  '.tar',
  '.webp',
  '.woff',
  '.woff2',
  '.zip',
  '.md',
  '.mdx',
  '.yml',
  '.yaml',
  '.txt',
  '.json',
  '.jsonc',
  '.toml',
  '.csv',
  '.xml',
  '.css',
  '.scss',
]);

const IGNORED_NAME_PATTERNS = [
  /\.(test|spec)\.[^.]{1,200}$/,
  /(^|[/\\])\.env(\.[^/\\]*)?$/,
];

const isIgnoredFile = (name: string): boolean => {
  const dot = name.lastIndexOf('.');

  if (dot !== -1 && IGNORED_EXTENSIONS.has(name.slice(dot))) return true;

  return IGNORED_NAME_PATTERNS.some((pattern) => pattern.test(name));
};

const collect = async (
  scanRoot: string,
  displayRoot: string,
  current: string
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
    if (entry.isDirectory()) {
      const path = join(current, entry.name);

      if (isIgnoredDir(scanRoot, path, entry.name)) continue;

      found.push(...(await collect(scanRoot, displayRoot, path)));
      continue;
    }

    if (entry.isFile() && !isIgnoredFile(entry.name))
      found.push(relative(displayRoot, join(current, entry.name)));
  }

  return found;
};

/** Lists the scannable source files under a path, failing closed to [] when unreadable */
export const walk = async (
  displayRoot: string,
  target: string
): Promise<string[]> => {
  try {
    const stats = await stat(target);

    if (stats.isFile())
      return isIgnoredFile(target) ? [] : [relative(displayRoot, target)];

    return collect(target, displayRoot, target);
  } catch {
    return [];
  }
};
