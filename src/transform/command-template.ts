import type {
  BundledAsset,
  CommandFormat,
  CommandKey,
  TemplateKey,
} from '../types/core.js';

const ARGUMENT_HINTS: Record<CommandKey, string> = {
  charter:
    'Optionally describe your project, or leave empty to let Blue Spec propose',
  detect:
    'Optionally name files/dirs or a focus, or leave empty for a full scan',
  plan: 'Optionally name files/dirs or a concern, or leave empty to plan every finding',
  harden:
    'Optionally name fixes, files/dirs, or priorities, or leave empty to apply every fix',
  verify:
    'Optionally name controls, files/dirs, or priorities, or leave empty to verify every applied control',
  repair:
    'Optionally name a phase or scope, or leave empty to repair the whole tracking map',
  skills:
    'Name a sub-skill to load (for example `redos`), or leave empty to list them',
  list: 'Takes no input, it lists every tracked finding by name',
  specialize:
    'Describe the security topic the sub-skill should cover, or name an existing sub-skill to refine',
  prove:
    'Optionally name findings or files/dirs to prove, or leave empty to prove every detected finding',
};

const TEMPLATE_FILES: Record<TemplateKey, string> = {
  charter: 'charter-template.md',
  detect: 'detect-template.md',
  plan: 'plan-template.md',
  harden: 'harden-template.md',
  verify: 'verify-template.md',
  specialize: 'specialize-template.md',
  prove: 'proof-template.md',
};

const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n/;

const skillName = (key: CommandKey): string => `bluespec.${key}`;

const hasTemplate = (key: CommandKey): key is TemplateKey =>
  key in TEMPLATE_FILES;

const rewriteTemplatePath = (body: string, key: CommandKey): string => {
  if (!hasTemplate(key)) return body;

  const fileName = TEMPLATE_FILES[key];

  return body.replaceAll(
    `\`templates/${fileName}\``,
    `\`.bluespec/templates/${fileName}\``
  );
};

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

const assemble = (
  frontmatterLines: string[],
  body: string,
  key: CommandKey
): string =>
  rewriteTemplatePath(`---\n${frontmatterLines.join('\n')}\n---\n${body}`, key);

const injectSkillFrontmatter = (
  asset: BundledAsset,
  key: CommandKey,
  { withUserInvocable }: { withUserInvocable: boolean }
): string => {
  const { frontmatter, body } = parseFrontmatter(asset, key);

  if (hasField(frontmatter, 'name'))
    return rewriteTemplatePath(asset.contents, key);

  const lines = [`name: ${skillName(key)}`, frontmatter.trim()];

  if (!hasField(frontmatter, 'argument-hint'))
    lines.push(`argument-hint: ${ARGUMENT_HINTS[key]}`);

  if (withUserInvocable && !hasField(frontmatter, 'user-invocable'))
    lines.push('user-invocable: true');

  return assemble(lines, body, key);
};

const transformSkill = (asset: BundledAsset, key: CommandKey): string =>
  injectSkillFrontmatter(asset, key, { withUserInvocable: true });

const transformCopilotPrompt = (asset: BundledAsset, key: CommandKey): string =>
  injectSkillFrontmatter(asset, key, { withUserInvocable: false });

const keepFrontmatterRewriteTemplatePath = (
  asset: BundledAsset,
  key: CommandKey
): string => {
  parseFrontmatter(asset, key);

  return rewriteTemplatePath(asset.contents, key);
};

const transformForge = (asset: BundledAsset, key: CommandKey): string =>
  keepFrontmatterRewriteTemplatePath(asset, key).replaceAll(
    '$ARGUMENTS',
    '{{parameters}}'
  );

const splitDescriptionAndBody = (
  asset: BundledAsset,
  key: CommandKey
): { description: string; body: string } => {
  const { frontmatter, body } = parseFrontmatter(asset, key);

  return {
    description: readDescription(frontmatter),
    body: rewriteTemplatePath(body, key),
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
    `title: "${skillName(key)}"`,
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
  markdown: keepFrontmatterRewriteTemplatePath,
  forge: transformForge,
  'gemini-toml': transformGeminiToml,
  'goose-yaml': transformGooseYaml,
};

export const transformCommand = (
  asset: BundledAsset,
  key: CommandKey,
  format: CommandFormat
): string => TRANSFORMS[format](asset, key);
