import type { BundledAsset, CommandFormat, CommandKey } from '../types/core.js';

const ARGUMENT_HINTS: Record<CommandKey, string> = {
  lagune: 'Describe the work to do, and Lagune builds it safely',
  charter:
    'Optionally describe your project, or leave empty to let Lagune propose',
  detect:
    'Optionally name files/dirs or a focus, or leave empty for a full scan',
  plan: 'Optionally name files/dirs or a concern, or leave empty to plan every finding',
  harden:
    'Optionally name fixes, files/dirs, or priorities, or leave empty to apply every fix',
  verify:
    'Optionally name controls, files/dirs, or priorities, or leave empty to verify every applied control',
  repair:
    'Optionally name a phase or scope, or leave empty to repair the whole tracking map',
  specialize:
    'Describe the security topic the sub-skill should cover, or name an existing sub-skill to refine',
  prove:
    'Optionally name findings or files/dirs to prove, or leave empty to prove every detected finding',
};

const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n/;

export const commandName = (key: CommandKey): string =>
  key === 'lagune' ? 'lagune' : `lagune.${key}`;

const hasField = (frontmatter: string, field: string): boolean =>
  frontmatter
    .split('\n')
    .some((line) => line.trimStart().startsWith(`${field}:`));

const parseFrontmatter = (
  asset: BundledAsset,
  key: CommandKey
): {
  frontmatter: string;
  body: string;
} => {
  const match = asset.contents.match(FRONTMATTER_PATTERN);

  if (!match) throw new Error(`Command ${key} is missing frontmatter`);

  if (!hasField(match[1], 'description'))
    throw new Error(
      `Command ${key} is missing a \`description\` in its frontmatter`
    );

  return { frontmatter: match[1], body: asset.contents.slice(match[0].length) };
};

const readDescription = (frontmatter: string): string => {
  const match = frontmatter.match(/^description:\s*(.+)$/m);

  if (!match)
    throw new Error('Command frontmatter is missing a `description` value');

  return match[1].trim();
};

const assemble = (frontmatterLines: string[], body: string): string =>
  `---\n${frontmatterLines.join('\n')}\n---\n${body}`;

const injectSkillFrontmatter = (
  asset: BundledAsset,
  key: CommandKey,
  {
    withUserInvocable,
    withInternalMetadata,
  }: { withUserInvocable: boolean; withInternalMetadata: boolean }
): string => {
  const { frontmatter, body } = parseFrontmatter(asset, key);

  if (hasField(frontmatter, 'name')) return asset.contents;

  const lines = [`name: ${commandName(key)}`, frontmatter.trim()];

  if (!hasField(frontmatter, 'argument-hint'))
    lines.push(`argument-hint: ${ARGUMENT_HINTS[key]}`);

  if (withUserInvocable && !hasField(frontmatter, 'user-invocable'))
    lines.push('user-invocable: true');

  if (withInternalMetadata && !hasField(frontmatter, 'metadata'))
    lines.push('metadata:', '  internal: true');

  return assemble(lines, body);
};

const transformSkill = (asset: BundledAsset, key: CommandKey): string =>
  injectSkillFrontmatter(asset, key, {
    withUserInvocable: true,
    withInternalMetadata: true,
  });

const transformCopilotPrompt = (asset: BundledAsset, key: CommandKey): string =>
  injectSkillFrontmatter(asset, key, {
    withUserInvocable: false,
    withInternalMetadata: false,
  });

const validateFrontmatter = (asset: BundledAsset, key: CommandKey): string => {
  parseFrontmatter(asset, key);

  return asset.contents;
};

const transformForge = (asset: BundledAsset, key: CommandKey): string =>
  validateFrontmatter(asset, key).replaceAll('$ARGUMENTS', '{{parameters}}');

const splitDescriptionAndBody = (
  asset: BundledAsset,
  key: CommandKey
): { description: string; body: string } => {
  const { frontmatter, body } = parseFrontmatter(asset, key);

  return {
    description: readDescription(frontmatter),
    body,
  };
};

const tomlString = (value: string): string =>
  `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;

const transformGeminiToml = (asset: BundledAsset, key: CommandKey): string => {
  const { description, body } = splitDescriptionAndBody(asset, key);
  const prompt = body.replaceAll('$ARGUMENTS', '{{args}}');

  return [
    `description = ${tomlString(description)}`,
    '',
    'prompt = """',
    prompt.replace(/\n$/, ''),
    '"""',
    '',
  ].join('\n');
};

const transformGooseYaml = (asset: BundledAsset, key: CommandKey): string => {
  const { description, body } = splitDescriptionAndBody(asset, key);
  const prompt = body.replaceAll('$ARGUMENTS', '{{ args }}');
  const indented = prompt
    .replace(/\n$/, '')
    .split('\n')
    .map((line) => (line.length > 0 ? `  ${line}` : ''))
    .join('\n');

  return [
    'version: 1.0.0',
    `title: "${commandName(key)}"`,
    `description: ${JSON.stringify(description)}`,
    `instructions: ${JSON.stringify(description)}`,
    'prompt: |',
    indented,
    '',
  ].join('\n');
};

const TRANSFORMS: Record<
  CommandFormat,
  (asset: BundledAsset, key: CommandKey) => string
> = {
  skill: transformSkill,
  'copilot-prompt': transformCopilotPrompt,
  markdown: validateFrontmatter,
  forge: transformForge,
  'gemini-toml': transformGeminiToml,
  'goose-yaml': transformGooseYaml,
};

export const transformCommand = (
  asset: BundledAsset,
  key: CommandKey,
  format: CommandFormat
): string => TRANSFORMS[format](asset, key);
