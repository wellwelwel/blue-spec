import Link from '@docusaurus/Link';
import { HIGHLIGHTS } from '@site/src/data/home';
import { memo } from 'react';
import { LuTerminal } from 'react-icons/lu';

const OverviewPanelComponent = ({ onInstall }: { onInstall: () => void }) => (
  <div className='flex flex-col min-w-0 h-full max-[920px]:h-auto'>
    <p className='mx-1 mb-9 text-[16px] leading-[1.6] font-semibold text-[rgba(233, 237, 247,0.78)]'>
      Lagune runs on Node.js, you use whatever stack you want.
    </p>

    <div className='grid grid-cols-2 max-[600px]:grid-cols-1'>
      {HIGHLIGHTS.map((item, index) => {
        const isLeft = index % 2 === 0;
        const isTop = index < 2;
        const cell = [
          'min-w-0',
          isLeft
            ? 'pr-7 border-r border-dashed border-[#021664] max-[600px]:pr-0 max-[600px]:border-r-0'
            : 'pl-7 max-[600px]:pl-0',
          isTop
            ? 'pb-7 border-b border-dashed border-[#021664]'
            : 'pt-7 max-[600px]:border-b-0',
          'max-[600px]:pt-7 max-[600px]:pb-7 max-[600px]:border-b max-[600px]:border-dashed max-[600px]:border-[#021664] max-[600px]:last:border-b-0 max-[600px]:last:pb-0 max-[600px]:first:pt-0',
        ].join(' ');

        return (
          <div key={item.title} className={cell}>
            <h3 className='flex items-center gap-2.5 m-0 text-[17px] font-semibold tracking-[-0.01em] text-ink'>
              <item.Icon className='size-[22px] shrink-0 text-accent' />
              {item.title}
            </h3>
            <p className='mt-3.5 m-0 text-[13px] leading-[1.55] text-[rgba(233, 237, 247,0.72)]'>
              {item.lead}
            </p>
            <p className='mt-3 m-0 text-[13px] italic font-medium leading-[1.55] text-muted'>
              {item.body}
            </p>
          </div>
        );
      })}
    </div>

    <div className='flex flex-wrap gap-3 mt-auto pt-10 max-[920px]:mt-10 max-[920px]:pt-0 max-[600px]:flex-col max-[600px]:flex-nowrap'>
      <button
        type='button'
        onClick={onInstall}
        className='lagune-cta group relative inline-flex items-center justify-center gap-2.5 pl-5 pr-[22px] py-[13px] rounded-[13px] overflow-hidden font-sans text-[14px] font-bold tracking-[-0.01em] text-white cursor-pointer transition-[box-shadow] duration-300 ease-out [background:linear-gradient(180deg,#1f7bff_0%,var(--color-accent)_100%)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.35),0_2px_6px_-2px_rgba(0,0,0,0.35)] hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.45),0_6px_14px_-4px_rgba(0,0,0,0.4)] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 max-[600px]:w-full max-[600px]:justify-start'
      >
        <LuTerminal className='size-[17px] shrink-0' aria-hidden />
        <span className='[text-shadow:0_1px_1px_rgba(0,0,0,.5)]'>Install</span>
      </button>
      <Link
        to='/docs'
        className='inline-flex items-center justify-center gap-2.5 pl-5 pr-[22px] py-[13px] rounded-[13px] overflow-hidden font-sans text-[14px] font-semibold tracking-[-0.01em] text-ink no-underline cursor-pointer transition-[background-color,border-color] duration-300 ease-out border border-accent/45 bg-accent/[0.12] hover:bg-accent/20 hover:border-accent/[0.65] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 max-[600px]:w-full max-[600px]:justify-start'
      >
        <img
          src='/img/icons/wave.svg'
          className='size-[17px] shrink-0'
          alt=''
          aria-hidden
        />
        <span>Docs</span>
      </Link>
    </div>
  </div>
);

export const OverviewPanel = memo(OverviewPanelComponent);
