import type {
  AgentProvider,
  BundledAssets,
  CommandWrite,
  FileOutcome,
  RefreshResult,
  ScaffoldOptions,
  ScaffoldResult,
  TemplateKey,
} from '../types/core.js';
import { dirname, join } from 'node:path';
import {
  ensureDir,
  writeFileIfAbsent,
  writeFileOverwrite,
} from './fs-actions.js';
import {
  buildManifest,
  restampManifestVersion,
  serializeManifest,
} from './manifest.js';
import {
  emptySkillsCatalog,
  serializeSkillsCatalog,
} from './skills-catalog.js';
import { emptyTrackingMap, serializeTrackingMap } from './tracking.js';

const MEMORY_DIR = '.bluespec/memory';
const MANIFEST_PATH = '.bluespec/manifest.json';
const TRACKING_PATH = '.bluespec/tracking.json';
const SKILLS_CATALOG_PATH = '.bluespec/skills.json';

const templateJobs = (
  templates: ScaffoldOptions['assets']['templates']
): CommandWrite[] => {
  const keys = Object.keys(templates) as TemplateKey[];

  return keys.map((key) => ({
    relativePath: `.bluespec/templates/${templates[key].fileName}`,
    contents: templates[key].contents,
  }));
};

const hookJobs = (hooks: ScaffoldOptions['assets']['hooks']): CommandWrite[] =>
  hooks.map((hook) => ({
    relativePath: `.bluespec/hooks/${hook.fileName}`,
    contents: hook.contents,
  }));

const skillJobs = (
  skills: ScaffoldOptions['assets']['skills']
): CommandWrite[] =>
  skills.map((skill) => ({
    relativePath: `.bluespec/skills/${skill.fileName}`,
    contents: skill.contents,
  }));

const toAbsolute = (targetDir: string, relativePath: string): string =>
  join(targetDir, relativePath);

const blueSpecOwnedJobs = (
  provider: AgentProvider,
  assets: BundledAssets
): CommandWrite[] => [
  ...templateJobs(assets.templates),
  ...hookJobs(assets.hooks),
  ...skillJobs(assets.skills),
  ...provider.buildCommands(assets),
];

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

export const scaffold = async (
  options: ScaffoldOptions
): Promise<ScaffoldResult> => {
  const { targetDir, provider, assets, version, now, categories } = options;
  const jobs = [...blueSpecOwnedJobs(provider, assets), ...userStateJobs()];

  await ensureDir(toAbsolute(targetDir, MEMORY_DIR));
  await ensureJobDirs(targetDir, jobs);

  const outcomes: FileOutcome[] = await Promise.all(
    jobs.map(async (job) => {
      const outcome = await writeFileIfAbsent(
        toAbsolute(targetDir, job.relativePath),
        job.contents
      );

      return { path: job.relativePath, status: outcome.status };
    })
  );

  const created = outcomes
    .filter((outcome) => outcome.status === 'created')
    .map((outcome) => outcome.path);
  const skipped = outcomes
    .filter((outcome) => outcome.status === 'skipped')
    .map((outcome) => outcome.path);

  const manifest = buildManifest({
    version,
    agent: provider.key,
    now,
    files: created,
    categories,
  });

  await writeFileIfAbsent(
    toAbsolute(targetDir, MANIFEST_PATH),
    serializeManifest(manifest)
  );

  return { created, skipped, manifestPath: MANIFEST_PATH };
};

export const refresh = async (
  options: ScaffoldOptions
): Promise<RefreshResult> => {
  const { targetDir, provider, assets, version, now } = options;
  const jobs = blueSpecOwnedJobs(provider, assets);

  await ensureJobDirs(targetDir, jobs);

  const refreshed = await Promise.all(
    jobs.map(async (job): Promise<string> => {
      await writeFileOverwrite(
        toAbsolute(targetDir, job.relativePath),
        job.contents
      );

      return job.relativePath;
    })
  );

  await restampManifestVersion(targetDir, { version, now, files: refreshed });

  return { refreshed, manifestPath: MANIFEST_PATH };
};
