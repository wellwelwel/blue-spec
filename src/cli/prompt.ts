import type { AgentChoice, ListTarget, SkillGroup } from '../types/core.js';
import { stdin } from 'node:process';
import {
  interactiveMultiSelect,
  interactiveSelect,
} from './interactive-select.js';
import {
  agentChoiceLabel,
  agentSelectHint,
  agentSelectTitle,
  listSelectHint,
  listSelectTitle,
  selectFooter,
  selectionAborted,
  skillsSelectFooter,
  skillsSelectHint,
  skillsSelectTitle,
} from './messages.js';

export const isInteractive = (): boolean => stdin.isTTY === true;

const lockedFirst = <Item>(
  items: Item[],
  isLocked: (item: Item) => boolean
): Item[] => [
  ...items.filter((item) => isLocked(item)),
  ...items.filter((item) => !isLocked(item)),
];

const LIST_TARGETS: { value: ListTarget; label: string }[] = [
  {
    value: 'findings',
    label: 'Findings: the security findings Lagune tracks',
  },
  {
    value: 'skills',
    label: 'Skills: the specialization categories and their state',
  },
];

export const promptForListTarget = async (): Promise<
  ListTarget | undefined
> => {
  const index = await interactiveSelect({
    title: listSelectTitle(),
    hint: listSelectHint(),
    options: LIST_TARGETS.map((target) => ({
      label: target.label,
      keywords: target.value,
    })),
    confirmLabel: 'List:',
    footer: selectFooter(),
  });

  if (index === undefined) return undefined;

  return LIST_TARGETS[index].value;
};

export const promptForAgent = async (
  agents: AgentChoice[],
  installed: string[]
): Promise<string> => {
  const ordered = lockedFirst(agents, (agent) => installed.includes(agent.key));
  const index = await interactiveSelect({
    title: agentSelectTitle(),
    hint: agentSelectHint(),
    options: ordered.map((agent) => ({
      label: agentChoiceLabel(agent.displayName, installed.includes(agent.key)),
      keywords: agent.key,
      locked: installed.includes(agent.key),
    })),
    footer: selectFooter(),
  });

  if (index === undefined) throw new Error(selectionAborted());

  return ordered[index].key;
};

export const promptForSkills = async (
  groups: SkillGroup[],
  options: { preselected: string[]; locked: string[] }
): Promise<string[]> => {
  const ordered = lockedFirst(groups, (group) =>
    options.locked.includes(group.key)
  );
  const indexes = await interactiveMultiSelect({
    title: skillsSelectTitle(),
    hint: skillsSelectHint(),
    options: ordered.map((group) => ({
      label: `${group.label}: ${group.description}`,
      keywords: group.key,
      selected: options.preselected.includes(group.key),
      locked: options.locked.includes(group.key),
    })),
    footer: skillsSelectFooter(),
  });

  if (indexes === undefined) return [];

  return indexes.map((index) => ordered[index].key);
};
