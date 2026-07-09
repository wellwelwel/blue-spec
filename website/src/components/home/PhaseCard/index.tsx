import type { Phase } from '@site/src/data/home';
import type { ComponentType } from 'react';
import { CopyButton } from '@site/src/components/home/CopyButton';

export const PhaseCard = ({
  phase,
  stage,
  Icon,
  modeIndex,
  onSelectMode,
}: {
  phase: Phase;
  stage: string;
  Icon: ComponentType<{ className?: string }>;
  modeIndex: number;
  onSelectMode: (index: number) => void;
}) => (
  <div className='flex flex-col rounded-2xl border border-line bg-card overflow-hidden'>
    <div className='relative h-[140px] bg-[linear-gradient(135deg,rgba(10,26,74,0.55),rgba(3,8,28,0.65))]'>
      <img
        src={phase.banner}
        alt=''
        decoding='async'
        className='lagune-img-outline absolute inset-0 size-full object-cover'
        aria-hidden
      />
      <div
        className='absolute inset-x-0 bottom-0 h-[72px] [background:linear-gradient(to_top,rgba(4,8,22,0.85),transparent)]'
        aria-hidden
      />
      <span className='absolute top-3.5 left-4 font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(233, 237, 247,0.78)] [text-shadow:0_1px_4px_rgba(0,0,0,0.7)]'>
        {phase.no}
      </span>
      <span className='absolute -bottom-[10px] left-4 z-[1] flex items-center justify-center size-[52px] rounded-[15px] border border-accent/40 bg-accent text-ink [box-shadow:0_12px_24px_-6px_rgba(0,0,0,0.7),0_4px_8px_-2px_rgba(0,0,0,0.5)] [&>svg]:size-[26px]'>
        <Icon />
      </span>
    </div>

    <div className='flex flex-col px-[18px] pt-[20px] pb-[18px]'>
      <div className='flex items-center gap-2.5'>
        <span className='text-[17px] font-semibold tracking-[-0.01em] text-ink'>
          {phase.title}
        </span>
        <span className='inline-flex items-center px-2.5 py-1 rounded-md bg-[#033791] font-mono text-[0.7em]! tracking-[0.06em] uppercase text-[#a8bbdb]'>
          {stage}
        </span>
      </div>
      <p className='mt-2.5 m-0 text-[13.5px] leading-[1.55] text-[rgba(233, 237, 247,0.72)]'>
        {phase.desc}
      </p>
    </div>

    <div className='flex items-center justify-between gap-3 px-[18px] py-[15px] border-t border-line max-[600px]:flex-col max-[600px]:items-stretch max-[600px]:gap-3'>
      <div className='flex items-center gap-2 min-w-0'>
        <code className='px-2.5 py-[5px] rounded-md bg-accent/10 font-mono text-[12px] tracking-[0.02em] text-accent overflow-hidden text-ellipsis whitespace-nowrap'>
          {phase.command}
        </code>
        <CopyButton value={phase.command} label={`Copy ${phase.command}`} />
      </div>
      <div className='flex shrink-0 rounded-lg border border-line overflow-hidden max-[600px]:w-full'>
        {phase.modes.map((mode, index) => (
          <button
            key={mode.label}
            type='button'
            onClick={() => onSelectMode(index)}
            aria-pressed={index === modeIndex}
            className={`px-3.5 py-2 text-[12px] font-semibold tracking-[-0.01em] whitespace-nowrap cursor-pointer transition-[color,background-color] duration-200 ease-out max-[600px]:flex-1 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-line ${
              index === modeIndex
                ? 'bg-accent/15 text-accent'
                : 'text-muted hover:text-ink hover:bg-white/[0.03]'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);
