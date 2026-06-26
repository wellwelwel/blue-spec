import type { Category } from '@site/src/data/home';

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
    className={`flex items-center gap-3 p-[12px_14px] rounded-[14px] border text-left cursor-pointer transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
      on
        ? 'text-ink border-accent/50 bg-accent/10'
        : 'text-[rgba(233,237,247,0.78)] border-line bg-card hover:bg-card-hover hover:border-white/[0.16] hover:text-ink'
    }`}
  >
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
  </button>
);
