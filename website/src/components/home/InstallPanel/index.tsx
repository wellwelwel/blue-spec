import { AgentButton } from '@site/src/components/home/AgentButton';
import { CopyButton } from '@site/src/components/home/CopyButton';
import { GroupHead } from '@site/src/components/home/GroupHead';
import { IconSwap } from '@site/src/components/home/IconSwap';
import { AGENTS, ALL_AGENTS } from '@site/src/data/home';
import { memo, useMemo } from 'react';
import { LuCircleCheckBig, LuLayoutGrid, LuPlus } from 'react-icons/lu';

const InstallPanelComponent = ({
  selected,
  onSelect,
  onOpenAgents,
}: {
  selected: string;
  onSelect: (key: string) => void;
  onOpenAgents: () => void;
}) => {
  const installCommand = useMemo(
    () => `npx blue-spec@latest init ${selected}`,
    [selected]
  );

  const selectedFromModal = !AGENTS.some((agent) => agent.key === selected);
  const selectedName = ALL_AGENTS.find((agent) => agent.key === selected)?.name;

  return (
    <div className='flex flex-col min-w-0'>
      <GroupHead title='Choose your agents' meta='37 AGENTS' />

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
          <span className='shrink-0 size-5 flex items-center justify-center [&>svg]:size-5'>
            <LuLayoutGrid aria-hidden />
          </span>
          <span className='flex-1 min-w-0 text-[14px] font-medium tracking-[-0.01em] overflow-hidden text-ellipsis whitespace-nowrap'>
            {ALL_AGENTS.length - AGENTS.length} more
            {selectedFromModal && selectedName ? ` (${selectedName})` : ''}
          </span>
          <IconSwap
            on={selectedFromModal}
            className={`shrink-0 [&_svg]:size-[18px] ${selectedFromModal ? 'text-accent' : 'text-[rgba(233,237,247,0.55)]'}`}
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
          npx blue-spec@latest init{' '}
          <span key={selected} className='bs-token-in'>
            {selected}
          </span>
        </code>
        <CopyButton value={installCommand} label='Copy install command' />
      </div>

      <p className='mx-1 mt-4 text-[13px] leading-[1.6] text-muted'>
        Pick the agent you use. Run it once and Blue Spec sets that agent up in
        your project.
      </p>
    </div>
  );
};

export const InstallPanel = memo(InstallPanelComponent);
