import type {
  ActionRunState,
  InstallSubtab,
  InstallSubtabItem,
  RunButton,
} from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { runInstall } from '../../data/api';
import { modal, useData } from '../../data/state';
import { AGENTS, CATEGORIES } from '../../domain/install';
import { actionFailed, useRunAction } from '../../hooks/use/run-action';
import { classes, GROUP_HEAD } from '../../utils/tailwind-classes';
import { Icon } from '../primitives/icons';
import { MaskIcon } from '../primitives/mask-icon';
import { SearchField } from '../primitives/search-field';
import { AgentButton, ManageCategoryRow } from './tiles';

const SUBTABS: InstallSubtabItem[] = [
  { key: 'agent', label: 'Agent', icon: 'terminal' },
  { key: 'specializations', label: 'Specializations', icon: 'graduationCap' },
];

const RUN_BUTTON: Record<ActionRunState, RunButton> = {
  idle: { icon: 'play', label: 'Run install' },
  pending: { icon: 'refresh', label: 'Installing…' },
  success: { icon: 'check', label: 'Installed' },
  error: { icon: 'play', label: 'Run install' },
};

export const InstallTab = (): VNode => {
  const data = useData();
  const present = data.install.present;
  const agentsKey = [...data.install.agents].sort().join(',');
  const skillsKey = [...data.install.categories].sort().join(',');
  const installedAgents = useMemo(
    () => new Set(data.install.agents),
    [agentsKey]
  );
  const installedSkills = useMemo(
    () => new Set(data.install.categories),
    [skillsKey]
  );

  const [subtab, setSubtab] = useState<InstallSubtab>('agent');
  const [agent, setAgent] = useState<string | null>(null);
  const [picks, setPicks] = useState<string[]>(present ? [] : ['owasp']);
  const [agentQuery, setAgentQuery] = useState('');
  const [skillQuery, setSkillQuery] = useState('');
  const { run, setRun, button, trigger } = useRunAction(RUN_BUTTON);

  const wasPresent = useRef(present);

  useEffect(() => {
    const installStateFlipped = wasPresent.current !== present;
    wasPresent.current = present;

    if (installStateFlipped) {
      setPicks(present ? [] : ['owasp']);
      setAgent(null);
    } else {
      setPicks((current) => current.filter((key) => !installedSkills.has(key)));
      setAgent((current) =>
        current !== null && installedAgents.has(current) ? null : current
      );
    }
    setRun('idle');
  }, [present, agentsKey, skillsKey]);

  const chooseAgent = (key: string) => {
    if (installedAgents.has(key)) return;
    setAgent(key);
    setRun('idle');
  };

  const toggleSkill = (key: string) => {
    if (installedSkills.has(key)) return;
    setPicks((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
    setRun('idle');
  };

  const selectedSkills = useMemo(
    () =>
      CATEGORIES.filter(
        (category) =>
          installedSkills.has(category.key) || picks.includes(category.key)
      ).map((category) => category.key),
    [installedSkills, picks]
  );
  const selectedAgent = AGENTS.find((item) => item.key === agent);

  const install = () => {
    if (agent === null) return;

    const agentName = selectedAgent?.name ?? 'your agent';
    modal.value = {
      kind: 'install',
      run: 'pending',
      agentName,
      created: 0,
      skipped: 0,
    };

    trigger(async () => {
      const response = await runInstall({ agent, categories: selectedSkills });
      const succeeded = response.ok && 'created' in response;

      modal.value = {
        kind: 'install',
        run: succeeded ? 'success' : 'error',
        agentName,
        created: succeeded ? response.created : 0,
        skipped: succeeded ? response.skipped : 0,
      };

      return response;
    });
  };

  const filteredAgents = useMemo(() => {
    const sorted = [...AGENTS].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
    const term = agentQuery.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter((item) => item.name.toLowerCase().includes(term));
  }, [agentQuery]);

  const filteredSkills = useMemo(() => {
    const sorted = [...CATEGORIES].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
    const term = skillQuery.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        category.description.toLowerCase().includes(term)
    );
  }, [skillQuery]);

  const onAgent = subtab === 'agent';

  return (
    <div class='route-rise'>
      <section class='flex flex-col rounded-xl bg-surface p-4.5 shadow-card'>
        <div class='mb-4.5 flex gap-1.5 rounded-lg bg-surface-2 p-1.5'>
          {SUBTABS.map((item) => {
            const on = subtab === item.key;
            const count =
              item.key === 'specializations' && selectedSkills.length > 0
                ? selectedSkills.length
                : undefined;
            return (
              <button
                key={item.key}
                class={classes(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-[0.82rem] font-bold whitespace-nowrap transition-[background-color,color,box-shadow] duration-200',
                  on
                    ? 'bg-accent-soft text-accent shadow-card-half'
                    : 'text-muted hover:bg-surface hover:text-ink-2'
                )}
                type='button'
                aria-pressed={on}
                onClick={() => setSubtab(item.key)}
              >
                <span class='inline-flex text-[1.05rem]'>
                  <Icon name={item.icon} />
                </span>
                {item.label}
                {count !== undefined && (
                  <span class='rounded-full bg-accent px-1.5 py-px text-[0.62rem] tabular-nums text-white'>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {onAgent ? (
          <>
            <div class={GROUP_HEAD}>
              Choose your agent
              <span class='rounded-full bg-accent-soft px-2 py-px text-[0.62rem] text-accent'>
                Required
              </span>
            </div>
            <SearchField
              placeholder='Search agents'
              query={agentQuery}
              onQuery={setAgentQuery}
            />
            {filteredAgents.length > 0 ? (
              <div
                class='grid grid-cols-2 gap-2.5 min-[1280px]:grid-cols-3 min-[1600px]:grid-cols-4'
                role='radiogroup'
              >
                {filteredAgents.map((item) => (
                  <AgentButton
                    key={item.key}
                    agent={item}
                    on={agent === item.key}
                    locked={installedAgents.has(item.key)}
                    onClick={() => chooseAgent(item.key)}
                  />
                ))}
              </div>
            ) : (
              <p class='py-8 text-center text-[0.85rem] text-faint'>
                No agents match “{agentQuery.trim()}”.
              </p>
            )}
          </>
        ) : (
          <>
            <div class={GROUP_HEAD}>
              Add specializations
              <span class='rounded-full bg-surface-2 px-2 py-px text-[0.62rem] text-muted'>
                Optional
              </span>
              {selectedSkills.length > 0 && (
                <span class='ml-auto text-[0.68rem] font-bold tabular-nums text-accent'>
                  {selectedSkills.length} selected
                </span>
              )}
            </div>
            <SearchField
              placeholder='Search specializations'
              query={skillQuery}
              onQuery={setSkillQuery}
            />
            {filteredSkills.length > 0 ? (
              <div class='grid grid-cols-2 gap-2.5 min-[1280px]:grid-cols-3 min-[1600px]:grid-cols-4'>
                {filteredSkills.map((category) => (
                  <ManageCategoryRow
                    key={category.key}
                    category={category}
                    on={selectedSkills.includes(category.key)}
                    locked={installedSkills.has(category.key)}
                    onToggle={() => toggleSkill(category.key)}
                  />
                ))}
              </div>
            ) : (
              <p class='py-8 text-center text-[0.85rem] text-faint'>
                No specializations match “{skillQuery.trim()}”.
              </p>
            )}
          </>
        )}
      </section>

      <button
        class='mt-4 flex w-full cursor-pointer flex-col items-start gap-2 rounded-xl border-0 bg-accent px-5 py-4 text-left text-white transition-[background-color] duration-200 hover:bg-accent-3 disabled:cursor-default disabled:opacity-70'
        type='button'
        disabled={run === 'pending' || agent === null}
        onClick={install}
      >
        <span class='flex h-4 items-center gap-2.5 text-[0.72rem] text-white'>
          <span
            key={agent ?? 'none'}
            class='icon-in flex min-w-0 items-center gap-1.5'
          >
            {selectedAgent?.icon ? (
              <MaskIcon
                src={selectedAgent.icon}
                class='size-3.5 flex-none bg-white'
              />
            ) : (
              <span class='inline-flex flex-none font-bold text-[0.85rem] text-white'>
                <Icon name='terminal' />
              </span>
            )}
            <span class='truncate font-semibold'>
              {selectedAgent?.name ?? 'Select an agent'}
            </span>
          </span>
          {selectedSkills.length > 0 && (
            <span class='h-3.5 w-px flex-none bg-white/70' />
          )}
          <span class='flex items-center'>
            {CATEGORIES.map((category) => {
              const on = selectedSkills.includes(category.key);
              return (
                <MaskIcon
                  key={category.key}
                  src={category.icon}
                  class={classes(
                    'size-3.5 origin-center flex-none bg-white transition-[opacity,scale,filter,width,margin] duration-300 ease-house',
                    on
                      ? 'mr-1.5 scale-100 opacity-100 blur-0'
                      : 'mr-0 w-0 scale-[0.25] opacity-0 blur-[4px]'
                  )}
                />
              );
            })}
          </span>
        </span>
        <span class='mt-2 mb-0.5 h-px w-[calc(100%-2px)] self-center bg-white/20' />
        <span class='flex h-6 items-center gap-2.5 text-[0.95rem] font-bold'>
          <span
            class={`inline-flex text-[1rem] ${run === 'pending' ? 'animate-spin' : ''}`}
          >
            <Icon name={button.icon} />
          </span>
          {button.label}
        </span>
      </button>
      {run === 'error' && (
        <p class='mt-3 text-center text-[0.8rem] text-red'>
          {actionFailed('Install')}
        </p>
      )}
    </div>
  );
};
