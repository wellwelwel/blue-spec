import type { Agent } from '@site/src/data/registry';
import { IconSwap } from '@site/src/components/IconSwap';
import { MaskIcon } from '@site/src/components/MaskIcon';
import {
  selectableCard,
  selectableTint,
} from '@site/src/components/selectable';
import { LuCircle, LuCircleCheckBig } from 'react-icons/lu';

export const AgentButton = ({
  agent,
  on,
  onClick,
}: {
  agent: Agent;
  on: boolean;
  onClick: () => void;
}) => (
  <button
    type='button'
    role='radio'
    aria-checked={on}
    onClick={onClick}
    className={`flex items-center gap-3 p-[12px_14px] ${selectableCard(on)}`}
  >
    <MaskIcon
      src={agent.icon}
      className={`shrink-0 size-5 bg-current transition-colors duration-200 ease-out ${selectableTint(on)}`}
    />
    <span className='flex-1 min-w-0 text-[13.5px] font-semibold tracking-[-0.01em] overflow-hidden text-ellipsis whitespace-nowrap'>
      {agent.name}
    </span>
    <IconSwap
      on={on}
      className={`shrink-0 [&_svg]:size-[18px] ${selectableTint(on)}`}
      active={<LuCircleCheckBig />}
      inactive={<LuCircle />}
    />
  </button>
);
