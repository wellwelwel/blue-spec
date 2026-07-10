import type { PointerEvent } from 'react';
import { AgentButton } from '@site/src/components/home/AgentButton';
import { CopyButton } from '@site/src/components/home/CopyButton';
import { GroupHead } from '@site/src/components/home/GroupHead';
import { IconSwap } from '@site/src/components/IconSwap';
import { MaskIcon } from '@site/src/components/MaskIcon';
import {
  selectableCard,
  selectableTint,
} from '@site/src/components/selectable';
import { AGENTS, ALL_AGENTS, ALL_CATEGORIES } from '@site/src/data/registry';
import { memo, useMemo } from 'react';
import { LuChevronRight, LuCircleCheckBig, LuLayoutGrid } from 'react-icons/lu';

const clampTip = (event: PointerEvent<HTMLSpanElement>) => {
  const wrap = event.currentTarget;
  const tip = wrap.lastElementChild;
  const strip = wrap.parentElement;

  if (!(tip instanceof HTMLElement) || strip === null) return;

  const bounds = strip.getBoundingClientRect();
  const anchor = wrap.getBoundingClientRect();
  const center = anchor.left + anchor.width / 2;
  const overflowLeft = bounds.left - (center - tip.offsetWidth / 2);
  const overflowRight = bounds.right - (center + tip.offsetWidth / 2);

  tip.style.setProperty(
    '--tip-shift',
    `${overflowLeft > 0 ? overflowLeft : Math.min(overflowRight, 0)}px`
  );
};

const InstallPanelComponent = ({
  selected,
  onSelect,
  onOpenAgents,
  onOpenSpecs,
  skills,
}: {
  selected: string;
  onSelect: (key: string) => void;
  onOpenAgents: () => void;
  onOpenSpecs: () => void;
  skills: string[];
}) => {
  const orderedSkills = useMemo(
    () =>
      skills
        .map((key) => ALL_CATEGORIES.find((category) => category.key === key))
        .filter((category) => category !== undefined),
    [skills]
  );

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
            inactive={<LuChevronRight />}
          />
        </button>
      </div>

      <GroupHead title='Add specializations' meta='Optional' />

      <div className='flex flex-wrap items-center gap-3 mb-[22px]'>
        {ALL_CATEGORIES.map((category) => (
          <span
            key={category.key}
            role='img'
            aria-label={category.name}
            className='group/chip relative flex'
            onPointerEnter={clampTip}
          >
            <MaskIcon
              src={category.icon}
              className={`size-5 bg-current transition-colors duration-200 ease-out ${selectableTint(skills.includes(category.key))}`}
            />
            <span
              aria-hidden
              className='pointer-events-none absolute bottom-[calc(100%+0.375rem)] left-[calc(50%+var(--tip-shift,0px))] -translate-x-1/2 translate-y-1 scale-95 whitespace-nowrap rounded-chip bg-dark px-2 py-1 text-[0.68rem] font-bold text-white opacity-0 transition-[opacity,scale,translate] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover/chip:translate-y-0 group-hover/chip:scale-100 group-hover/chip:opacity-100'
            >
              {category.name}
            </span>
          </span>
        ))}
        <button
          type='button'
          onClick={onOpenSpecs}
          className={`flex items-center gap-3 p-[12px_14px] ml-auto ${selectableCard(false)}`}
        >
          <span
            className={`shrink-0 size-5 flex items-center justify-center [&>svg]:size-5 ${selectableTint(false)}`}
          >
            <LuLayoutGrid aria-hidden />
          </span>
          <span className='text-[13.5px] font-semibold tracking-[-0.01em] whitespace-nowrap'>
            Select
          </span>
          <LuChevronRight
            className={`shrink-0 size-[18px] ${selectableTint(false)}`}
            aria-hidden
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
