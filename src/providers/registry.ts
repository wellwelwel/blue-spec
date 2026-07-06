import type { AgentChoice, AgentProvider } from '../types/core.js';
import { createProvider } from './create-provider.js';
import { AGENT_SPECS } from './specs.js';

export const AGENT_PROVIDERS: Record<string, AgentProvider> =
  Object.fromEntries(
    AGENT_SPECS.map((spec) => [spec.key, createProvider(spec)])
  );

export const listAgentKeys = (): string[] => Object.keys(AGENT_PROVIDERS);

export const listAgentChoices = (): AgentChoice[] =>
  Object.values(AGENT_PROVIDERS).map(({ key, displayName }) => ({
    key,
    displayName,
  }));

export const getProvider = (key: string): AgentProvider => {
  const provider = AGENT_PROVIDERS[key];

  if (!provider)
    throw new Error(
      `Unknown agent "${key}". Available: ${listAgentKeys().join(', ')}.`
    );

  return provider;
};

export const getProviders = (keys: string[]): AgentProvider[] =>
  keys.map(getProvider);
