import type { Category } from '@site/src/data/registry';
import type { ReactNode } from 'react';
import { MaskIcon } from '@site/src/components/MaskIcon';
import { Modal, ModalHeader, ModalSearch } from '@site/src/components/Modal';
import { ScrollFade } from '@site/src/components/ScrollFade';
import {
  selectableCard,
  selectableTint,
} from '@site/src/components/selectable';
import { memo, useEffect, useMemo, useState } from 'react';
import { LuArrowLeft } from 'react-icons/lu';

const SpecializationRow = memo(
  ({
    category,
    on,
    onToggle,
  }: {
    category: Category;
    on: boolean;
    onToggle: (key: string) => void;
  }) => (
    <button
      type='button'
      role='checkbox'
      aria-checked={on}
      onClick={() => onToggle(category.key)}
      className={`flex h-full flex-col items-start gap-2 p-[14px] ${selectableCard(on)}`}
    >
      <span className='flex w-full items-center gap-2.5 min-w-0'>
        <MaskIcon
          src={category.icon}
          className={`shrink-0 size-5 bg-current transition-colors duration-200 ease-out ${selectableTint(on)}`}
        />
        <span className='flex-1 min-w-0 text-[13.5px] font-semibold tracking-[-0.01em] overflow-hidden text-ellipsis whitespace-nowrap'>
          {category.name}
        </span>
      </span>
      <span className='block h-[3lh] text-[12.5px] leading-[1.5] text-muted [text-wrap:pretty] line-clamp-3'>
        {category.desc}
      </span>
    </button>
  )
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
    if (!open) setQuery('');
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      label='All specializations'
      panelClassName='lagune-modal-panel relative flex flex-col w-full max-w-[680px] h-[860px] max-h-full rounded-[20px] border border-[#0c155c] bg-[#0a0f1f] overflow-hidden [box-shadow:0_40px_120px_-30px_rgba(0,0,0,0.8)] outline-none'
    >
      <ModalHeader>
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
      </ModalHeader>

      <ModalSearch
        value={query}
        onChange={setQuery}
        label='Search specializations'
      />

      <ScrollFade
        className='grow'
        scrollClassName='lagune-paper h-full overflow-y-auto px-[clamp(20px,3vw,32px)] py-[clamp(20px,3vw,28px)]'
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
                onToggle={onToggle}
              />
            ))}
          </div>
        ) : (
          <p className='py-6 text-center text-[13.5px] text-muted'>
            No specializations match “{query.trim()}”.
          </p>
        )}
      </ScrollFade>
    </Modal>
  );
};
