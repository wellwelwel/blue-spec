import type { AgentProvider, SelectAgentDeps } from '../types/core.js';
import {
  getProvider,
  listAgentChoices,
  listAgentKeys,
} from '../providers/registry.js';
import { noAgentSelected } from './messages.js';
import { isInteractive, promptForAgent } from './prompt.js';

const defaultDeps: SelectAgentDeps = { isInteractive, promptForAgent };

export const selectAgent = async (
  requested: string | undefined,
  installed: string[],
  deps: SelectAgentDeps = defaultDeps
): Promise<AgentProvider> => {
  if (typeof requested === 'string') return getProvider(requested);

  if (!deps.isInteractive()) throw new Error(noAgentSelected(listAgentKeys()));

  const choice = await deps.promptForAgent(listAgentChoices(), installed);

  return getProvider(choice);
};
