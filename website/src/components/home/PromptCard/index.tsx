import type { PromptMode } from '@site/src/data/home';
import { LuTerminal } from 'react-icons/lu';
import { ReactTyped } from 'react-typed';

export const PromptCard = ({
  command,
  mode,
  onDone,
}: {
  command: string;
  mode: PromptMode;
  onDone: () => void;
}) => {
  const body = mode.prompt ? ` ${mode.prompt}` : '';

  return (
    <div className='relative mt-3 rounded-2xl border border-white/[0.07] bg-[#040406] overflow-hidden [box-shadow:inset_0_1px_0_0_rgba(255,255,255,0.06),0_18px_40px_-24px_rgba(0,0,0,0.9)]'>
      <div className='flex items-center gap-3 px-[18px] pt-3.5 pb-1'>
        <span className='inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.06em] uppercase text-faint [&>svg]:size-3.5 [&>svg]:text-[#5fb4ff]'>
          <LuTerminal />
          Example
        </span>
      </div>
      <p className='m-0 px-[18px] pt-1 pb-[18px] font-mono text-[13.5px] leading-[1.65] text-ink text-justify [&_.typed-cursor]:text-[#5fb4ff]'>
        <ReactTyped
          key={`${command}${body}`}
          strings={[`<span style="color:#5fb4ff">${command}</span>${body}`]}
          typeSpeed={12.5}
          startDelay={250}
          showCursor
          cursorChar='▍'
          loop={false}
          onComplete={onDone}
        />
      </p>
    </div>
  );
};
