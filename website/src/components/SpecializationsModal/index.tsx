import type { Category } from '@site/src/data/home';
import type { ReactNode } from 'react';
import { ScrollFade } from '@site/src/components/ScrollFade';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuArrowLeft, LuSearch } from 'react-icons/lu';

const SpecializationRow = ({
  category,
  on,
  onToggle,
}: {
  category: Category;
  on: boolean;
  onToggle: () => void;
}) => (
  <button
    type='button'
    role='checkbox'
    aria-checked={on}
    onClick={onToggle}
    className={`flex h-full min-h-[88px] flex-col justify-center gap-2 p-[14px] rounded-[14px] border text-left cursor-pointer transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
      on
        ? 'text-ink border-accent/50 bg-accent/10'
        : 'text-[rgba(233,237,247,0.78)] border-line bg-card hover:bg-card-hover hover:border-white/[0.16] hover:text-ink'
    }`}
  >
    <span className='flex items-center gap-2.5 min-w-0'>
      <span
        className={`shrink-0 size-5 bg-current [mask-repeat:no-repeat] [mask-position:center] [mask-size:contain] transition-colors duration-200 ease-out ${
          on ? 'text-accent' : 'text-[#888c99]'
        }`}
        style={{
          maskImage: `url(${category.icon})`,
          WebkitMaskImage: `url(${category.icon})`,
        }}
      />
      <span className='flex-1 min-w-0 text-[13.5px] font-semibold tracking-[-0.01em] overflow-hidden text-ellipsis whitespace-nowrap'>
        {category.name}
      </span>
    </span>
    <span className='text-[12.5px] leading-[1.5] text-muted [text-wrap:pretty]'>
      {category.desc}
    </span>
  </button>
);

export const SpecializationsModal = ({
  open,
  categories,
  skills,
  onToggle,
  onClose,
}: {
  open: boolean;
  categories: Category[];
  skills: string[];
  onToggle: (key: string) => void;
  onClose: () => void;
}): ReactNode => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () =>
      [...categories].sort((left, right) =>
        left.name.localeCompare(right.name)
      ),
    [categories]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) return sorted;

    return sorted.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        category.desc.toLowerCase().includes(term)
    );
  }, [sorted, query]);

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
        aria-label='All specializations'
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className='bs-modal-panel relative flex flex-col w-full max-w-[680px] h-[800px] max-h-full rounded-[20px] border border-[#0c155c] bg-[#0a0f1f] overflow-hidden [box-shadow:0_40px_120px_-30px_rgba(0,0,0,0.8)] outline-none'
      >
        <div className='flex items-center justify-between gap-4 shrink-0 px-[clamp(20px,3vw,32px)] py-4 border-b border-[#0c155c] bg-[#0a0f1f]'>
          <button
            type='button'
            onClick={onClose}
            aria-label='Back'
            className='relative inline-flex items-center gap-1.5 -ml-2 pl-2 pr-2.5 h-9 rounded-full font-mono text-[11px] tracking-[0.14em] uppercase text-[#9499a5] cursor-pointer transition-[color,background-color] duration-200 ease-out hover:bg-white/[0.08] hover:text-ink after:absolute after:top-1/2 after:left-1/2 after:h-10 after:w-[calc(100%+8px)] after:-translate-x-1/2 after:-translate-y-1/2 [&>svg]:size-[16px]'
          >
            <LuArrowLeft />
            Back
          </button>
          <span className='font-mono text-[11px] tracking-[0.14em] uppercase text-muted tabular-nums'>
            {query.trim()
              ? `Specializations · ${filtered.length}`
              : `All specializations · ${categories.length}`}
          </span>
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
              placeholder='Search specializations'
              aria-label='Search specializations'
              autoFocus
              className='w-full rounded-[14px] border border-line bg-card py-[12px] pl-[42px] pr-[14px] font-mono !text-[16px] text-ink placeholder:text-[#888c99] transition-[border-color,background-color] duration-200 ease-out hover:border-white/[0.16] focus:border-accent/50 focus:bg-accent/[0.06] focus:outline-none'
            />
          </div>
        </div>

        <ScrollFade
          className='grow'
          scrollClassName='bs-paper h-full overflow-y-auto px-[clamp(20px,3vw,32px)] py-[clamp(20px,3vw,28px)]'
          role='group'
          aria-label='Add security specializations'
        >
          {filtered.length > 0 ? (
            <div className='grid grid-cols-2 gap-2 max-[520px]:grid-cols-1'>
              {filtered.map((category) => (
                <SpecializationRow
                  key={category.key}
                  category={category}
                  on={skills.includes(category.key)}
                  onToggle={() => onToggle(category.key)}
                />
              ))}
            </div>
          ) : (
            <p className='py-6 text-center text-[13.5px] text-muted'>
              No specializations match “{query.trim()}”.
            </p>
          )}
        </ScrollFade>
      </div>
    </div>,
    document.body
  );
};
