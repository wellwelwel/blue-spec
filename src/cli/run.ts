import type {
  BundledAssets,
  FileOutcome,
  ListTarget,
  ParsedCliArgs,
} from '../types/core.js';
import { stdout } from 'node:process';
import { loadAssets, loadVersion } from '../core/assets.js';
import {
  applyManifestChange,
  readManifestCategories,
  readManifestInstall,
} from '../core/manifest.js';
import {
  groupOutcomes,
  groupScaffoldOutcomes,
} from '../core/scaffold-groups.js';
import { refresh, scaffold } from '../core/scaffold.js';
import { loadTrackingMap } from '../core/tracking.js';
import { SKILLS_CATALOG } from '../hooks/skills/catalog.js';
import { SKILL_GROUPS } from '../hooks/skills/groups.js';
import {
  expandCategories,
  findGroup,
  groupOutcomesByCategory,
  skillNamesForGroups,
  unknownGroupKeys,
} from '../hooks/skills/skills.js';
import {
  getProvider,
  listAgentChoices,
  listAgentKeys,
} from '../providers/registry.js';
import { addSkills, removeSkills } from './manage-skills.js';
import {
  addSummary,
  addUsage,
  banner,
  categoryList,
  findingsReport,
  groupedReport,
  helpText,
  nextSteps,
  removeSummary,
  removeUsage,
  summaryLine,
  unknownCategories,
  updateNotInitialized,
  updateSummary,
} from './messages.js';
import { promptForListTarget } from './prompt.js';
import { selectAgent } from './select-agent.js';
import { selectCategories } from './select-categories.js';

const print = (line: string): void => {
  stdout.write(`${line}\n`);
};

const countStatus = (outcomes: FileOutcome[], status: string): number =>
  outcomes.filter((outcome) => outcome.status === status).length;

const pathsWithStatus = (outcomes: FileOutcome[], status: string): string[] =>
  outcomes
    .filter((outcome) => outcome.status === status)
    .map((outcome) => outcome.path);

const sameCategories = (left: string[], right: string[]): boolean =>
  left.length === right.length && left.every((key) => right.includes(key));

const resolveCategoryKeys = (categories: string[]): string[] => {
  const keys = expandCategories(SKILL_GROUPS, categories);
  const unknown = unknownGroupKeys(SKILL_GROUPS, keys);

  if (unknown.length > 0)
    throw new Error(
      unknownCategories(
        unknown,
        SKILL_GROUPS.map((group) => group.key)
      )
    );

  return keys;
};

const skillsForKeys = (
  assets: BundledAssets,
  keys: string[]
): BundledAssets['skills'] => {
  const chosen = new Set(
    skillNamesForGroups(SKILLS_CATALOG, keys).map((name) => `${name}.md`)
  );

  return assets.skills.filter((skill) => chosen.has(skill.fileName));
};

const groupsForKeys = (keys: string[]): typeof SKILL_GROUPS =>
  keys
    .map((key) => findGroup(SKILL_GROUPS, key))
    .filter((group) => group !== undefined);

const runInit = async (
  args: ParsedCliArgs,
  cwd: string,
  packageRoot: URL
): Promise<void> => {
  const provider = await selectAgent(args.agent);
  const categories = await selectCategories({
    requested: args.skills,
    shouldPrompt: args.skillsRequested || typeof args.agent !== 'string',
    groups: SKILL_GROUPS,
  });
  const keys = resolveCategoryKeys(categories);
  const [assets, version] = await Promise.all([
    loadAssets(packageRoot),
    loadVersion(packageRoot),
  ]);

  const result = await scaffold({
    targetDir: cwd,
    provider,
    assets: { ...assets, skills: skillsForKeys(assets, keys) },
    version,
    now: new Date(),
    categories: keys,
  });

  const groups = groupScaffoldOutcomes(result, provider.displayName);

  print(banner());
  print('');

  if (groups.length > 0) {
    print(groupedReport(groups));
    print('');
  }

  print(summaryLine(provider.displayName, result));

  if (result.created.length > 0) {
    print('');
    print(nextSteps(provider.displayName));
    print('');
  }
};

const runUpdate = async (cwd: string, packageRoot: URL): Promise<void> => {
  const { agent, categories } = await readManifestInstall(cwd);

  if (agent === '') {
    print(updateNotInitialized(listAgentKeys()));
    return;
  }

  const provider = getProvider(agent);
  const keys = resolveCategoryKeys(categories);
  const [assets, version] = await Promise.all([
    loadAssets(packageRoot),
    loadVersion(packageRoot),
  ]);

  const result = await refresh({
    targetDir: cwd,
    provider,
    assets: { ...assets, skills: skillsForKeys(assets, keys) },
    version,
    now: new Date(),
    categories: keys,
  });

  const groups = groupOutcomes(
    result.refreshed.map((path) => ({ path, status: 'refreshed' })),
    provider.displayName
  );

  print(banner());
  print('');

  if (groups.length > 0) {
    print(groupedReport(groups));
    print('');
  }

  print(updateSummary(provider.displayName, result.refreshed.length));

  if (result.refreshed.length > 0) {
    print('');
    print(nextSteps(provider.displayName));
    print('');
  }
};

const runAdd = async (
  args: ParsedCliArgs,
  cwd: string,
  packageRoot: URL
): Promise<void> => {
  if (!args.skillsRequested) {
    print(addUsage());
    return;
  }

  const categories = await selectCategories({
    requested: args.skills,
    shouldPrompt: true,
    groups: SKILL_GROUPS,
  });
  const [assets, version, installed] = await Promise.all([
    loadAssets(packageRoot),
    loadVersion(packageRoot),
    readManifestCategories(cwd),
  ]);
  const change = await addSkills(cwd, assets, installed, categories);

  if (!sameCategories(change.categories, installed))
    await applyManifestChange(
      cwd,
      {
        categories: change.categories,
        addFiles: pathsWithStatus(change.outcomes, 'created'),
        removeFiles: [],
      },
      { version, now: new Date() }
    );

  const groups = groupOutcomesByCategory(
    change.outcomes,
    SKILLS_CATALOG,
    SKILL_GROUPS,
    resolveCategoryKeys(categories)
  );

  print(banner());
  print('');

  if (groups.length > 0) {
    print(groupedReport(groups));
    print('');
  }

  print(
    addSummary(
      countStatus(change.outcomes, 'created'),
      countStatus(change.outcomes, 'skipped')
    )
  );
};

const runRemove = async (
  args: ParsedCliArgs,
  cwd: string,
  packageRoot: URL
): Promise<void> => {
  if (!args.skillsRequested) {
    print(removeUsage());

    return;
  }

  const [version, installed] = await Promise.all([
    loadVersion(packageRoot),
    readManifestCategories(cwd),
  ]);
  const categories = await selectCategories({
    requested: args.skills,
    shouldPrompt: true,
    groups: groupsForKeys(installed),
  });
  const change = await removeSkills(cwd, installed, categories);

  if (!sameCategories(change.categories, installed))
    await applyManifestChange(
      cwd,
      {
        categories: change.categories,
        addFiles: [],
        removeFiles: pathsWithStatus(change.outcomes, 'removed'),
      },
      { version, now: new Date() }
    );

  const groups = groupOutcomesByCategory(
    change.outcomes,
    SKILLS_CATALOG,
    SKILL_GROUPS,
    resolveCategoryKeys(categories)
  );

  print(banner());
  print('');

  if (groups.length > 0) {
    print(groupedReport(groups));
    print('');
  }

  print(
    removeSummary(
      countStatus(change.outcomes, 'removed'),
      countStatus(change.outcomes, 'absent'),
      countStatus(change.outcomes, 'kept')
    )
  );
};

const findingNames = async (cwd: string): Promise<string[]> => {
  const map = await loadTrackingMap(cwd);

  return map.entries.map((entry) => entry.name);
};

const resolveListTarget = async (
  args: ParsedCliArgs
): Promise<ListTarget | undefined> => {
  if (args.findingsRequested) return 'findings';

  if (args.skillsRequested) return 'skills';

  return promptForListTarget();
};

const listBody = async (target: ListTarget, cwd: string): Promise<string> => {
  if (target === 'findings') return findingsReport(await findingNames(cwd));

  return categoryList(SKILL_GROUPS, await readManifestCategories(cwd));
};

const runList = async (args: ParsedCliArgs, cwd: string): Promise<void> => {
  const target = await resolveListTarget(args);

  if (target === undefined) return;

  print(banner());
  print('');
  print(await listBody(target, cwd));
};

export const run = async (
  args: ParsedCliArgs,
  cwd: string,
  packageRoot: URL
): Promise<void> => {
  if (args.version) {
    print(await loadVersion(packageRoot));

    return;
  }

  if (args.command === 'init') {
    await runInit(args, cwd, packageRoot);

    return;
  }

  if (args.command === 'update') {
    await runUpdate(cwd, packageRoot);

    return;
  }

  if (args.command === 'add') {
    await runAdd(args, cwd, packageRoot);
    return;
  }

  if (args.command === 'remove') {
    await runRemove(args, cwd, packageRoot);
    return;
  }

  if (args.command === 'list') {
    await runList(args, cwd);
    return;
  }

  print(helpText(listAgentChoices()));
};
