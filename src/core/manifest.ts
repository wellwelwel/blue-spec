import type {
  ManifestAgent,
  ManifestChange,
  ManifestData,
  ManifestInput,
  ManifestInstall,
} from '../types/core.js';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { appendUnique } from './collections.js';
import { ensureDir, writeFileOverwrite } from './fs-actions.js';

const MANIFEST_PATH = '.lagune/manifest.json';

export const buildManifest = (input: ManifestInput): ManifestData => ({
  name: 'lagune',
  version: input.version,
  agent: input.agent,
  createdAt: input.now.toISOString(),
  files: input.files,
  categories: input.categories,
});

export const serializeManifest = (data: ManifestData): string =>
  `${JSON.stringify(data, null, 2)}\n`;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const readManifestFields = async (
  path: string
): Promise<Record<string, unknown>> => {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return Object.create(null);
  }
};

const fieldCategories = (fields: Record<string, unknown>): string[] =>
  isStringArray(fields.categories) ? fields.categories : [];

export const manifestAgents = (value: unknown): string[] => {
  if (typeof value === 'string') return value === '' ? [] : [value];
  if (isStringArray(value)) return value.filter((agent) => agent !== '');

  return [];
};

const fieldAgents = (fields: Record<string, unknown>): string[] =>
  manifestAgents(fields.agent);

export const serializeAgents = (agents: string[]): ManifestAgent =>
  agents.length === 1 ? agents[0] : agents;

export const readManifestCategories = async (
  targetDir: string
): Promise<string[]> =>
  fieldCategories(await readManifestFields(join(targetDir, MANIFEST_PATH)));

export const readManifestAgents = async (
  targetDir: string
): Promise<string[]> =>
  fieldAgents(await readManifestFields(join(targetDir, MANIFEST_PATH)));

export const readManifestInstall = async (
  targetDir: string
): Promise<ManifestInstall> => {
  const fields = await readManifestFields(join(targetDir, MANIFEST_PATH));

  return {
    agents: fieldAgents(fields),
    categories: fieldCategories(fields),
  };
};

const mergeFiles = (
  existing: unknown,
  addFiles: string[],
  removeFiles: string[]
): string[] => {
  const dropped = new Set(removeFiles);
  const current = isStringArray(existing)
    ? existing.filter((file) => !dropped.has(file))
    : [];

  return appendUnique(current, addFiles);
};

const upsertManifest = async (
  targetDir: string,
  seed: { version: string; now: Date },
  overrides: Partial<ManifestData>
): Promise<void> => {
  const path = join(targetDir, MANIFEST_PATH);
  const existing = await readManifestFields(path);
  const fresh = buildManifest({
    version: seed.version,
    agent: '',
    now: seed.now,
    files: [],
    categories: [],
  });

  await ensureDir(dirname(path));
  await writeFileOverwrite(
    path,
    `${JSON.stringify({ ...fresh, ...existing, ...overrides }, null, 2)}\n`
  );
};

export const applyManifestChange = async (
  targetDir: string,
  change: ManifestChange,
  defaults: { version: string; now: Date }
): Promise<void> => {
  const existing = await readManifestFields(join(targetDir, MANIFEST_PATH));

  await upsertManifest(targetDir, defaults, {
    categories: change.categories,
    files: mergeFiles(existing.files, change.addFiles, change.removeFiles),
  });
};

export const restampManifestVersion = async (
  targetDir: string,
  input: { version: string; now: Date; files: string[] }
): Promise<void> =>
  upsertManifest(targetDir, input, {
    version: input.version,
    files: input.files,
  });

export const recordManifestInstall = async (
  targetDir: string,
  input: {
    agent?: string;
    categories: string[];
    version: string;
    now: Date;
    addFiles: string[];
  }
): Promise<void> => {
  const existing = await readManifestFields(join(targetDir, MANIFEST_PATH));
  const agents = input.agent
    ? appendUnique(fieldAgents(existing), [input.agent])
    : fieldAgents(existing);

  await upsertManifest(
    targetDir,
    { version: input.version, now: input.now },
    {
      agent: serializeAgents(agents),
      categories: appendUnique(fieldCategories(existing), input.categories),
      files: mergeFiles(existing.files, input.addFiles, []),
    }
  );
};
