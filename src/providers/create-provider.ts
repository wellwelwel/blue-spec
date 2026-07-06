import type {
  AgentProvider,
  AgentSpec,
  BundledAssets,
  CommandKey,
  CommandWrite,
} from '../types/core.js';
import { transformCommand } from '../transform/command-template.js';

const commandPath = (spec: AgentSpec, key: CommandKey): string => {
  const name = `bluespec.${key}`;

  if (spec.layout === 'skill') return `${spec.dir}/${name}/SKILL.md`;

  return `${spec.dir}/${name}${spec.extension ?? '.md'}`;
};

export const createProvider = (spec: AgentSpec): AgentProvider => ({
  key: spec.key,
  displayName: spec.displayName,
  buildCommands: (assets: BundledAssets): CommandWrite[] => {
    const keys = Object.keys(assets.commands) as CommandKey[];

    return keys.map((key) => ({
      relativePath: commandPath(spec, key),
      contents: transformCommand(assets.commands[key], key, spec.format),
    }));
  },
});
