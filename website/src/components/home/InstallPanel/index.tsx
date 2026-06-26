import { AgentButton } from '@site/src/components/home/AgentButton';
import { CategoryCheckbox } from '@site/src/components/home/CategoryCheckbox';
import { CopyButton } from '@site/src/components/home/CopyButton';
import { GroupHead } from '@site/src/components/home/GroupHead';
import { IconSwap } from '@site/src/components/home/IconSwap';
import { AGENTS, ALL_AGENTS, CATEGORIES } from '@site/src/data/home';
import { memo, useMemo } from 'react';
import { LuCircleCheckBig, LuLayoutGrid, LuPlus } from 'react-icons/lu';

const InstallPanelComponent = ({
  selected,
  onSelect,
  onOpenAgents,
  skills,
  onToggleSkill,
}: {
  selected: string;
  onSelect: (key: string) => void;
  onOpenAgents: () => void;
  skills: string[];
  onToggleSkill: (key: string) => void;
}) => {
  const orderedSkills = useMemo(
    () =>
      skills
        .map((key) => CATEGORIES.find((category) => category.key === key))
        .filter((category) => category !== undefined),
    [skills]
  );

  const installCommand = useMemo(
    () =>
      orderedSkills.length
        ? `npx blue-spec@latest init ${selected} --skills ${orderedSkills.map((category) => category.key).join(' ')}`
        : `npx blue-spec@latest init ${selected}`,
    [selected, orderedSkills]
  );

  const selectedFromModal = !AGENTS.some((agent) => agent.key === selected);
  const selectedName = ALL_AGENTS.find((agent) => agent.key === selected)?.name;

  return (
    <div className='flex flex-col min-w-0'>
      <GroupHead title='Choose your agents' meta='Required' />

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
          className={`flex items-center gap-3 p-[13px_14px] rounded-[14px] border text-left cursor-pointer transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
            selectedFromModal
              ? 'text-ink border-accent/50 bg-accent/10'
              : 'text-[rgba(233,237,247,0.78)] border-line bg-card hover:bg-card-hover hover:border-white/[0.16] hover:text-ink'
          }`}
        >
          <span
            className={`shrink-0 size-5 flex items-center justify-center [&>svg]:size-5 transition-colors duration-200 ease-out ${
              selectedFromModal ? 'text-accent' : 'text-[#888c99]'
            }`}
          >
            <LuLayoutGrid aria-hidden />
          </span>
          <span className='flex-1 min-w-0 text-[14px] font-medium tracking-[-0.01em] overflow-hidden text-ellipsis whitespace-nowrap'>
            {ALL_AGENTS.length - AGENTS.length} more
            {selectedFromModal && selectedName ? ` (${selectedName})` : ''}
          </span>
          <IconSwap
            on={selectedFromModal}
            className={`shrink-0 [&_svg]:size-[18px] ${selectedFromModal ? 'text-accent' : 'text-[#888c99]'}`}
            active={<LuCircleCheckBig />}
            inactive={<LuPlus />}
          />
        </button>
      </div>

      <GroupHead title='Add specializations' meta='Optional' />

      <div
        className='grid grid-cols-2 gap-2 mb-[22px] max-[460px]:grid-cols-1'
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
      </div>

      <GroupHead title='Run this' />

      <div className='flex items-center gap-3 p-[15px_16px] rounded-[14px] border border-line bg-[rgba(6,7,9,0.5)] font-mono text-[13px]'>
        <span className='select-none text-accent' aria-hidden>
          $
        </span>
        <code className='flex-1 min-w-0 text-ink overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          npx blue-spec@latest init{' '}
          <span key={selected} className='bs-token-in text-[#5191ff]'>
            {selected}
          </span>
          {orderedSkills.length > 0 && (
            <>
              {' '}
              <span className='bs-token-in text-muted'>--skills</span>
              {orderedSkills.map((category) => (
                <span key={category.key}>
                  {' '}
                  <span className='bs-token-in text-[#5191ff]'>
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
        it once and Blue Spec sets it all up in your project.
      </p>
    </div>
  );
};

export const InstallPanel = memo(InstallPanelComponent);
