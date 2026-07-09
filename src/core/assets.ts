import type {
  BundledAsset,
  BundledAssets,
  CommandKey,
  TemplateKey,
} from '../types/core.js';
import { readdir, readFile } from 'node:fs/promises';

const COMMAND_FILES: Record<CommandKey, string> = {
  lagune: 'spec/commands/lagune.md',
  charter: 'spec/commands/lagune.charter.md',
  detect: 'spec/commands/lagune.detect.md',
  plan: 'spec/commands/lagune.plan.md',
  harden: 'spec/commands/lagune.harden.md',
  verify: 'spec/commands/lagune.verify.md',
  repair: 'spec/commands/lagune.repair.md',
  specialize: 'spec/commands/lagune.specialize.md',
  prove: 'spec/commands/lagune.prove.md',
};

const TEMPLATE_FILES: Record<TemplateKey, string> = {
  charter: 'spec/templates/charter-template.md',
  detect: 'spec/templates/detect-template.md',
  plan: 'spec/templates/plan-template.md',
  harden: 'spec/templates/harden-template.md',
  specialize: 'spec/templates/specialize-template.md',
  prove: 'spec/templates/proof-template.md',
};

const HOOKS_DIR = 'lib/hooks';
const SKILLS_DIR = 'spec/skills';

const fileNameOf = (relativePath: string): string =>
  relativePath.slice(relativePath.lastIndexOf('/') + 1);

const readAsset = async (
  packageRoot: URL,
  relativePath: string
): Promise<BundledAsset> => {
  const contents = await readFile(new URL(relativePath, packageRoot), 'utf8');

  return { fileName: fileNameOf(relativePath), contents };
};

const readGroup = async <Key extends string>(
  packageRoot: URL,
  files: Record<Key, string>
): Promise<Record<Key, BundledAsset>> => {
  const keys = Object.keys(files) as Key[];
  const entries = await Promise.all(
    keys.map(
      async (key) => [key, await readAsset(packageRoot, files[key])] as const
    )
  );

  return Object.fromEntries(entries) as Record<Key, BundledAsset>;
};

const readHooks = async (packageRoot: URL): Promise<BundledAsset[]> => {
  const entries = await readdir(new URL(`${HOOKS_DIR}/`, packageRoot));
  const hooks = entries.filter((entry) => entry.endsWith('.mjs')).toSorted();

  return Promise.all(
    hooks.map((hook) => readAsset(packageRoot, `${HOOKS_DIR}/${hook}`))
  );
};

const readSkills = async (packageRoot: URL): Promise<BundledAsset[]> => {
  const entries = await readdir(new URL(`${SKILLS_DIR}/`, packageRoot));
  const skills = entries.filter((entry) => entry.endsWith('.md')).toSorted();

  return Promise.all(
    skills.map((skill) => readAsset(packageRoot, `${SKILLS_DIR}/${skill}`))
  );
};

export const loadAssets = async (packageRoot: URL): Promise<BundledAssets> => {
  const [commands, templates, hooks, skills] = await Promise.all([
    readGroup(packageRoot, COMMAND_FILES),
    readGroup(packageRoot, TEMPLATE_FILES),
    readHooks(packageRoot),
    readSkills(packageRoot),
  ]);

  return { commands, templates, hooks, skills };
};

export const loadVersion = async (packageRoot: URL): Promise<string> => {
  const raw = await readFile(new URL('package.json', packageRoot), 'utf8');
  const parsed: { version?: unknown } = JSON.parse(raw);

  if (typeof parsed.version !== 'string')
    throw new Error('package.json is missing a string `version` field');

  return parsed.version;
};
