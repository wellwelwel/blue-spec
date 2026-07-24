import type { WalkFilter } from '../../types/scan.js';

export const BASE_IGNORED_DIRS: ReadonlySet<string> = new Set([
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

export const BASE_IGNORED_DIR_PATTERNS: readonly RegExp[] = [
  /^lagune\./,
  /\.egg-info$/,
];

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
  /\.(test|spec)\.[^.]{1,200}$/i,
  /(^|[/\\])\.env(\.[^/\\]*)?$/i,
  /\.min\.[^./\\]{1,10}$/i,
];

const hasIgnoredExtension = (path: string): boolean => {
  const dot = path.lastIndexOf('.');

  return dot !== -1 && IGNORED_EXTENSIONS.has(path.slice(dot).toLowerCase());
};

export const SOURCE_FILTER: WalkFilter = {
  ignoredDirs: BASE_IGNORED_DIRS,
  ignoredDirPatterns: BASE_IGNORED_DIR_PATTERNS,
  accept: (relativePath) =>
    !hasIgnoredExtension(relativePath) &&
    !IGNORED_NAME_PATTERNS.some((pattern) => pattern.test(relativePath)),
};
