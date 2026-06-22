import type { ReactNode } from 'react';

export const RailTip = ({
  tip,
  children,
}: {
  tip: string;
  children: ReactNode;
}) => (
  <span className='group/rail relative inline-flex max-[600px]:contents'>
    {children}
    <span
      role='tooltip'
      className='pointer-events-none absolute left-full top-1/2 z-30 ml-3.5 origin-left whitespace-nowrap rounded-lg border border-white/10 bg-[#0d1430] px-3 py-2 text-[12px] font-semibold leading-none tracking-[-0.01em] text-ink opacity-0 [transform:translateY(-50%)_translateX(-6px)_scale(0.96)] [box-shadow:inset_0_1px_0_0_rgba(255,255,255,0.07),0_12px_28px_-12px_rgba(0,0,0,0.8)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover/rail:opacity-100 group-hover/rail:[transform:translateY(-50%)_translateX(0)_scale(1)] group-focus-within/rail:opacity-100 group-focus-within/rail:[transform:translateY(-50%)_translateX(0)_scale(1)] max-[600px]:hidden'
    >
      <span
        className='absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#0d1430]'
        aria-hidden
      />
      {tip}
    </span>
  </span>
);
