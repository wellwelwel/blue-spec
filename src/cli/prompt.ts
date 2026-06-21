import type { AgentChoice } from '../types/core.js';
import { stdin } from 'node:process';
import { interactiveSelect } from './interactive-select.js';
import {
  agentSelectHint,
  agentSelectTitle,
  selectionAborted,
} from './messages.js';

export const isInteractive = (): boolean => stdin.isTTY === true;

export const promptForAgent = async (
  agents: AgentChoice[]
): Promise<string> => {
  const index = await interactiveSelect({
    title: agentSelectTitle(),
    hint: agentSelectHint(),
    options: agents.map((agent) => ({
      label: agent.displayName,
      keywords: agent.key,
    })),
  });

  if (index === undefined) throw new Error(selectionAborted());

  return agents[index].key;
};
