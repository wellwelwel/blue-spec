const monoLabel = 'font-mono text-[11px] tracking-[0.1em] uppercase';

export const GroupHead = ({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) => (
  <div className='flex items-baseline justify-between mx-1 mb-3 [&:not(:first-child)]:mt-[15px]'>
    <span className={`${monoLabel} !text-[13px] text-muted`}>{title}</span>
    {meta && (
      <span className={`${monoLabel} !text-[12px] text-faint`}>{meta}</span>
    )}
  </div>
);
