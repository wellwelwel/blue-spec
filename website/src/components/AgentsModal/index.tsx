import type { ReactNode } from 'react';
import { IconSwap } from '@site/src/components/home/IconSwap';
import { ScrollFade } from '@site/src/components/ScrollFade';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCircle, LuCircleCheckBig, LuSearch, LuX } from 'react-icons/lu';

export type AgentEntry = { key: string; name: string };

const AgentRow = ({
  agent,
  on,
  onClick,
}: {
  agent: AgentEntry;
  on: boolean;
  onClick: () => void;
}) => (
  <button
    type='button'
    role='radio'
    aria-checked={on}
    onClick={onClick}
    className={`flex items-center gap-3 p-[12px_14px] rounded-[14px] border text-left cursor-pointer transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
      on
        ? 'text-ink border-accent/50 bg-accent/10'
        : 'text-[rgba(233,237,247,0.78)] border-line bg-card hover:bg-card-hover hover:border-white/[0.16] hover:text-ink'
    }`}
  >
    <span className='flex-1 min-w-0 text-[13.5px] font-semibold tracking-[-0.01em] overflow-hidden text-ellipsis whitespace-nowrap'>
      {agent.name}
    </span>
    <IconSwap
      on={on}
      className={`shrink-0 [&_svg]:size-[18px] ${on ? 'text-accent' : 'text-[#888c99]'}`}
      active={<LuCircleCheckBig />}
      inactive={<LuCircle />}
    />
  </button>
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
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) return agents;

    return agents.filter((agent) => agent.name.toLowerCase().includes(term));
  }, [agents, query]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className='bs-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-[clamp(12px,4vw,48px)] bg-[rgba(2,4,12,0.72)] [backdrop-filter:blur(6px)] [-webkit-backdrop-filter:blur(6px)]'
      onClick={onClose}
      role='presentation'
    >
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-label='All agents'
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className='bs-modal-panel relative flex flex-col w-full max-w-[680px] h-[860px] max-h-full rounded-[20px] border border-[#0c155c] bg-[#0a0f1f] overflow-hidden [box-shadow:0_40px_120px_-30px_rgba(0,0,0,0.8)] outline-none'
      >
        <div className='flex items-center justify-between gap-4 shrink-0 px-[clamp(20px,3vw,32px)] py-4 border-b border-[#0c155c] bg-[#0a0f1f]'>
          <span className='font-mono text-[11px] tracking-[0.14em] uppercase text-muted tabular-nums'>
            {query.trim()
              ? `Agents · ${filtered.length}`
              : `All agents · ${agents.length}`}
          </span>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close'
            className='relative inline-flex items-center justify-center size-9 -mr-1.5 rounded-full text-[#9499a5] cursor-pointer transition-[color,background-color] duration-200 ease-out hover:bg-white/[0.08] hover:text-ink after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-x-1/2 after:-translate-y-1/2 [&>svg]:size-[18px]'
          >
            <LuX />
          </button>
        </div>

        <div className='shrink-0 px-[clamp(20px,3vw,32px)] pt-[clamp(20px,3vw,28px)]'>
          <div className='relative'>
            <LuSearch
              aria-hidden
              className='pointer-events-none absolute left-[14px] top-1/2 size-[18px] -translate-y-1/2 text-[#888c99]'
            />
            <input
              type='text'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search agents'
              aria-label='Search agents'
              autoFocus
              className='w-full rounded-[14px] border border-line bg-card py-[12px] pl-[42px] pr-[14px] font-mono !text-[16px] text-ink placeholder:text-[#888c99] transition-[border-color,background-color] duration-200 ease-out hover:border-white/[0.16] focus:border-accent/50 focus:bg-accent/[0.06] focus:outline-none'
            />
          </div>
        </div>

        <ScrollFade
          className='grow'
          scrollClassName='bs-paper h-full overflow-y-auto px-[clamp(20px,3vw,32px)] py-[clamp(20px,3vw,28px)]'
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
                  onClick={() => {
                    onSelect(agent.key);
                    onClose();
                  }}
                />
              ))}
            </div>
          ) : (
            <p className='py-6 text-center text-[13.5px] text-muted'>
              No agents match “{query.trim()}”.
            </p>
          )}
        </ScrollFade>
      </div>
    </div>,
    document.body
  );
};
