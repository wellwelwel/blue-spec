import type {
  AgentProvider,
  BundledAssets,
  CommandWrite,
  FileOutcome,
  ReconstructOptions,
  RefreshOptions,
  RefreshResult,
  ScaffoldOptions,
  ScaffoldResult,
  TemplateKey,
} from '../types/core.js';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  ensureDir,
  writeFileIfAbsent,
  writeFileOverwrite,
} from './fs-actions.js';
import { restampManifestVersion } from './manifest.js';
import {
  emptySkillsCatalog,
  serializeSkillsCatalog,
} from './skills-catalog.js';
import { renderSpecializations } from './specializations.js';
import { emptyTrackingMap, serializeTrackingMap } from './tracking.js';

const MEMORY_DIR = '.lagune/memory';
const MANIFEST_PATH = '.lagune/manifest.json';
const TRACKING_PATH = '.lagune/tracking.json';
const SKILLS_CATALOG_PATH = '.lagune/skills.json';

const templateJobs = (
  templates: ScaffoldOptions['assets']['templates']
): CommandWrite[] => {
  const keys = Object.keys(templates) as TemplateKey[];

  return keys.map((key) => ({
    relativePath: `.lagune/templates/${templates[key].fileName}`,
    contents: templates[key].contents,
  }));
};

const hookJobs = (hooks: ScaffoldOptions['assets']['hooks']): CommandWrite[] =>
  hooks.map((hook) => ({
    relativePath: `.lagune/hooks/${hook.fileName}`,
    contents: hook.contents,
  }));

const skillJobs = (
  skills: ScaffoldOptions['assets']['skills']
): CommandWrite[] =>
  skills.map((skill) => ({
    relativePath: `.lagune/skills/${skill.fileName}`,
    contents: skill.contents,
  }));

const toAbsolute = (targetDir: string, relativePath: string): string =>
  join(targetDir, relativePath);

const sharedJobs = (assets: BundledAssets): CommandWrite[] => [
  ...templateJobs(assets.templates),
  ...hookJobs(assets.hooks),
  ...skillJobs(assets.skills),
];

const laguneOwnedJobs = (
  provider: AgentProvider,
  assets: BundledAssets
): CommandWrite[] => [...sharedJobs(assets), ...provider.buildCommands(assets)];

const userStateJobs = (): CommandWrite[] => [
  {
    relativePath: TRACKING_PATH,
    contents: serializeTrackingMap(emptyTrackingMap()),
  },
  {
    relativePath: SKILLS_CATALOG_PATH,
    contents: serializeSkillsCatalog(emptySkillsCatalog()),
  },
];

const ensureJobDirs = async (
  targetDir: string,
  jobs: CommandWrite[]
): Promise<void> => {
  await Promise.all(
    jobs.map((job) =>
      ensureDir(dirname(toAbsolute(targetDir, job.relativePath)))
    )
  );
};

const writeJobsIfAbsent = (
  targetDir: string,
  jobs: CommandWrite[]
): Promise<FileOutcome[]> =>
  Promise.all(
    jobs.map(async (job): Promise<FileOutcome> => {
      const outcome = await writeFileIfAbsent(
        toAbsolute(targetDir, job.relativePath),
        job.contents
      );

      return { path: job.relativePath, status: outcome.status };
    })
  );

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);

    return true;
  } catch {
    return false;
  }
};

const renderSpecializationsOutcome = async (
  targetDir: string
): Promise<FileOutcome> => {
  const existed = await pathExists(
    toAbsolute(targetDir, '.lagune/specializations.md')
  );
  const path = await renderSpecializations(targetDir);

  return { path, status: existed ? 'skipped' : 'created' };
};

const pathsWithStatus = (
  outcomes: FileOutcome[],
  status: FileOutcome['status']
): string[] =>
  outcomes
    .filter((outcome) => outcome.status === status)
    .map((outcome) => outcome.path);

const toScaffoldResult = (outcomes: FileOutcome[]): ScaffoldResult => ({
  created: pathsWithStatus(outcomes, 'created'),
  skipped: pathsWithStatus(outcomes, 'skipped'),
  manifestPath: MANIFEST_PATH,
});

export const scaffold = async (
  options: ScaffoldOptions
): Promise<ScaffoldResult> => {
  const { targetDir, provider, assets } = options;
  const ownedJobs = provider
    ? laguneOwnedJobs(provider, assets)
    : sharedJobs(assets);
  const jobs = [...ownedJobs, ...userStateJobs()];

  await ensureDir(toAbsolute(targetDir, MEMORY_DIR));
  await ensureJobDirs(targetDir, jobs);

  const outcomes = await writeJobsIfAbsent(targetDir, jobs);

  return toScaffoldResult([
    ...outcomes,
    await renderSpecializationsOutcome(targetDir),
  ]);
};

const dedupeByPath = (jobs: CommandWrite[]): CommandWrite[] => {
  const seen = new Set<string>();

  return jobs.filter((job) => {
    if (seen.has(job.relativePath)) return false;

    seen.add(job.relativePath);
    return true;
  });
};

export const refresh = async (
  options: RefreshOptions
): Promise<RefreshResult> => {
  const { targetDir, providers, assets, version, now } = options;
  const jobs = dedupeByPath([
    ...sharedJobs(assets),
    ...providers.flatMap((provider) => provider.buildCommands(assets)),
  ]);

  await ensureJobDirs(targetDir, jobs);

  const written = await Promise.all(
    jobs.map(async (job): Promise<string> => {
      await writeFileOverwrite(
        toAbsolute(targetDir, job.relativePath),
        job.contents
      );

      return job.relativePath;
    })
  );

  const refreshed = [...written, await renderSpecializations(targetDir)];

  await restampManifestVersion(targetDir, { version, now, files: refreshed });

  return { refreshed, manifestPath: MANIFEST_PATH };
};

export const reconstruct = async (
  options: ReconstructOptions
): Promise<ScaffoldResult> => {
  const { targetDir, providers, assets } = options;
  const jobs = dedupeByPath([
    ...sharedJobs(assets),
    ...providers.flatMap((provider) => provider.buildCommands(assets)),
  ]);

  await ensureJobDirs(targetDir, jobs);

  const outcomes = await writeJobsIfAbsent(targetDir, jobs);

  return toScaffoldResult([
    ...outcomes,
    await renderSpecializationsOutcome(targetDir),
  ]);
};
