import { AgentButton } from '@site/src/components/home/AgentButton';
import { CategoryCheckbox } from '@site/src/components/home/CategoryCheckbox';
import { CopyButton } from '@site/src/components/home/CopyButton';
import { GroupHead } from '@site/src/components/home/GroupHead';
import { IconSwap } from '@site/src/components/IconSwap';
import {
  selectableCard,
  selectableTint,
} from '@site/src/components/selectable';
import {
  AGENTS,
  ALL_AGENTS,
  ALL_CATEGORIES,
  CATEGORIES,
} from '@site/src/data/registry';
import { memo, useMemo } from 'react';
import { LuCircleCheckBig, LuLayoutGrid, LuPlus } from 'react-icons/lu';

const InstallPanelComponent = ({
  selected,
  onSelect,
  onOpenAgents,
  onOpenSpecs,
  skills,
  onToggleSkill,
}: {
  selected: string;
  onSelect: (key: string) => void;
  onOpenAgents: () => void;
  onOpenSpecs: () => void;
  skills: string[];
  onToggleSkill: (key: string) => void;
}) => {
  const orderedSkills = useMemo(
    () =>
      skills
        .map((key) => ALL_CATEGORIES.find((category) => category.key === key))
        .filter((category) => category !== undefined),
    [skills]
  );

  const hiddenSelected = useMemo(() => {
    const visible = new Set(CATEGORIES.map((category) => category.key));

    return skills.some((key) => !visible.has(key));
  }, [skills]);

  const installCommand = useMemo(
    () =>
      orderedSkills.length
        ? `npx lagune@latest init ${selected} --skills ${orderedSkills.map((category) => category.key).join(' ')}`
        : `npx lagune@latest init ${selected}`,
    [selected, orderedSkills]
  );

  const selectedFromModal = !AGENTS.some((agent) => agent.key === selected);
  const selectedName = ALL_AGENTS.find((agent) => agent.key === selected)?.name;

  return (
    <div className='flex flex-col min-w-0'>
      <GroupHead title='Choose your agent' meta='Required' />

      <div
        className='grid grid-cols-2 gap-2 mb-[22px]'
        role='radiogroup'
        aria-label='Choose your agent'
      >
        {AGENTS.map((agent) => (
          <AgentButton
            key={agent.key}
            agent={agent}
            on={selected === agent.key}
            onClick={() => onSelect(agent.key)}
          />
        ))}
        <button
          type='button'
          onClick={onOpenAgents}
          className={`flex items-center gap-3 p-[13px_14px] ${selectableCard(selectedFromModal)}`}
        >
          <span
            className={`shrink-0 size-5 flex items-center justify-center [&>svg]:size-5 transition-colors duration-200 ease-out ${selectableTint(selectedFromModal)}`}
          >
            <LuLayoutGrid aria-hidden />
          </span>
          <span className='flex-1 min-w-0 text-[14px] font-medium tracking-[-0.01em] overflow-hidden text-ellipsis whitespace-nowrap'>
            {ALL_AGENTS.length - AGENTS.length} more
            {selectedFromModal && selectedName ? ` (${selectedName})` : ''}
          </span>
          <IconSwap
            on={selectedFromModal}
            className={`shrink-0 [&_svg]:size-[18px] ${selectableTint(selectedFromModal)}`}
            active={<LuCircleCheckBig />}
            inactive={<LuPlus />}
          />
        </button>
      </div>

      <GroupHead title='Add specializations' meta='Optional' />

      <div
        className='grid grid-cols-4 gap-2 mb-[22px] max-[600px]:grid-cols-2'
        role='group'
        aria-label='Add security specializations'
      >
        {CATEGORIES.map((category) => (
          <CategoryCheckbox
            key={category.key}
            category={category}
            on={skills.includes(category.key)}
            onToggle={() => onToggleSkill(category.key)}
          />
        ))}
        <button
          type='button'
          onClick={onOpenSpecs}
          className={`flex items-center gap-3 p-[12px_14px] ${selectableCard(hiddenSelected)}`}
        >
          <span
            className={`shrink-0 size-5 flex items-center justify-center [&>svg]:size-5 transition-colors duration-200 ease-out ${selectableTint(hiddenSelected)}`}
          >
            <LuLayoutGrid aria-hidden />
          </span>
          <span className='flex-1 min-w-0 text-[13.5px] font-semibold tracking-[-0.01em] overflow-hidden text-ellipsis whitespace-nowrap'>
            {ALL_CATEGORIES.length - CATEGORIES.length} more
          </span>
          <IconSwap
            on={hiddenSelected}
            className={`shrink-0 [&_svg]:size-[18px] ${selectableTint(hiddenSelected)}`}
            active={<LuCircleCheckBig />}
            inactive={<LuPlus />}
          />
        </button>
      </div>

      <GroupHead title='Run this' />

      <div className='flex items-center gap-3 p-[15px_16px] rounded-[14px] border border-line bg-[rgba(6,7,9,0.5)] font-mono text-[13px]'>
        <span className='select-none text-accent' aria-hidden>
          $
        </span>
        <code className='flex-1 min-w-0 text-ink overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          npx lagune@latest init{' '}
          <span key={selected} className='lagune-token-in text-[#5191ff]'>
            {selected}
          </span>
          {orderedSkills.length > 0 && (
            <>
              {' '}
              <span className='lagune-token-in text-muted'>--skills</span>
              {orderedSkills.map((category) => (
                <span key={category.key}>
                  {' '}
                  <span className='lagune-token-in text-[#5191ff]'>
                    {category.key}
                  </span>
                </span>
              ))}
            </>
          )}
        </code>
        <CopyButton value={installCommand} label='Copy install command' />
      </div>

      <p className='mx-1 mt-4 text-[13px] leading-[1.6] text-muted'>
        Pick the agent you use, and any security specializations you want. Run
        it once and Lagune sets it all up in your project.
      </p>
    </div>
  );
};

export const InstallPanel = memo(InstallPanelComponent);
