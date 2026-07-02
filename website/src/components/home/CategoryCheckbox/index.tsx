import type { Category } from '@site/src/data/registry';
import { MaskIcon } from '@site/src/components/MaskIcon';
import {
  selectableCard,
  selectableTint,
} from '@site/src/components/selectable';

export const CategoryCheckbox = ({
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
    className={`flex items-center gap-3 p-[12px_14px] ${selectableCard(on)}`}
  >
    <MaskIcon
      src={category.icon}
      className={`shrink-0 size-5 bg-current transition-colors duration-200 ease-out ${selectableTint(on)}`}
    />
    <span className='flex-1 min-w-0 text-[12px] font-bold tracking-[-0.01em] overflow-hidden text-ellipsis whitespace-nowrap'>
      {category.name}
    </span>
  </button>
);
