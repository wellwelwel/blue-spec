import type { Install } from '../../../../types/dashboard/dashboard';
import { access } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { manifestAgents } from '../../../../core/manifest';

const LAGUNE_DIR = '.lagune';

const EMPTY_INSTALL: Install & { files: string[] } = {
  agents: [],
  version: null,
  running: null,
  createdAt: null,
  categories: [],
  present: false,
  filesTotal: 0,
  missing: [],
  files: [],
};

const stringField = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

export const buildInstall = (
  manifest: string | null
): Install & { files: string[] } => {
  if (!manifest) return EMPTY_INSTALL;
  try {
    const parsed: unknown = JSON.parse(manifest);
    if (typeof parsed === 'object' && parsed !== null) {
      const source = parsed as {
        agent?: unknown;
        version?: unknown;
        createdAt?: unknown;
        categories?: unknown;
        files?: unknown;
      };
      const files = stringList(source.files);
      return {
        agents: manifestAgents(source.agent),
        version: stringField(source.version),
        running: null,
        createdAt: stringField(source.createdAt),
        categories: stringList(source.categories),
        present: true,
        filesTotal: files.length,
        missing: [],
        files,
      };
    }
    return EMPTY_INSTALL;
  } catch {
    return EMPTY_INSTALL;
  }
};

const topSegment = (file: string): string => file.split('/')[0];

export const installWatchRoots = (files: string[]): string[] => [
  ...new Set(
    files
      .map(topSegment)
      .filter((segment) => segment !== '' && segment !== LAGUNE_DIR)
  ),
];

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

export const missingFiles = async (
  root: string,
  files: string[]
): Promise<string[]> => {
  const checks = await Promise.all(
    files.map(async (file) => {
      const full = resolve(root, file);
      if (!full.startsWith(root + sep)) return null;
      return (await fileExists(full)) ? null : file;
    })
  );

  return checks.filter((file): file is string => file !== null);
};
