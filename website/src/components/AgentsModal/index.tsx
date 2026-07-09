import type { AgentEntry } from '@site/src/data/registry';
import type { ReactNode } from 'react';
import { IconSwap } from '@site/src/components/IconSwap';
import {
  Modal,
  ModalClose,
  ModalHeader,
  ModalSearch,
} from '@site/src/components/Modal';
import { ScrollFade } from '@site/src/components/ScrollFade';
import {
  selectableCard,
  selectableTint,
} from '@site/src/components/selectable';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { LuCircle, LuCircleCheckBig } from 'react-icons/lu';

const AgentRow = memo(
  ({
    agent,
    on,
    onPick,
  }: {
    agent: AgentEntry;
    on: boolean;
    onPick: (key: string) => void;
  }) => (
    <button
      type='button'
      role='radio'
      aria-checked={on}
      onClick={() => onPick(agent.key)}
      className={`flex items-center gap-3 p-[12px_14px] ${selectableCard(on)}`}
    >
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
  )
);

export const AgentsModal = ({
  open,
  agents,
  onSelect,
  onClose,
}: {
  open: boolean;
  agents: AgentEntry[];
  onSelect: (key: string) => void;
  onClose: () => void;
}): ReactNode => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) return agents;

    return agents.filter((agent) => agent.name.toLowerCase().includes(term));
  }, [agents, query]);

  const handlePick = useCallback(
    (key: string) => {
      onSelect(key);
      onClose();
    },
    [onSelect, onClose]
  );

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      label='All agents'
      panelClassName='lagune-modal-panel relative flex flex-col w-full max-w-[680px] h-[860px] max-h-full rounded-[20px] border border-[#0c155c] bg-[#0a0f1f] overflow-hidden [box-shadow:0_40px_120px_-30px_rgba(0,0,0,0.8)] outline-none'
    >
      <ModalHeader>
        <span className='font-mono text-[11px] tracking-[0.14em] uppercase text-muted tabular-nums'>
          {query.trim()
            ? `Agents · ${filtered.length}`
            : `All agents · ${agents.length}`}
        </span>
        <ModalClose onClose={onClose} />
      </ModalHeader>

      <ModalSearch value={query} onChange={setQuery} label='Search agents' />

      <ScrollFade
        className='grow'
        scrollClassName='lagune-paper h-full overflow-y-auto px-[clamp(20px,3vw,32px)] py-[clamp(20px,3vw,28px)]'
        role='radiogroup'
        aria-label='Choose your agent'
      >
        {filtered.length > 0 ? (
          <div className='grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2'>
            {filtered.map((agent) => (
              <AgentRow
                key={agent.key}
                agent={agent}
                on={false}
                onPick={handlePick}
              />
            ))}
          </div>
        ) : (
          <p className='py-6 text-center text-[13.5px] text-muted'>
            No agents match “{query.trim()}”.
          </p>
        )}
      </ScrollFade>
    </Modal>
  );
};
