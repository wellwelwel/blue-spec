import { PhaseCard } from '@site/src/components/home/PhaseCard';
import { PromptCard } from '@site/src/components/home/PromptCard';
import { PHASE_STEPS, STEP_THEME } from '@site/src/data/home';
import { memo } from 'react';
import { LuArrowDown, LuCircleCheckBig } from 'react-icons/lu';

const UsagePanelComponent = ({
  usageStep,
  modeIndex,
  typedDone,
  onSelectMode,
  onStep,
  onTyped,
}: {
  usageStep: number;
  modeIndex: number;
  typedDone: boolean;
  onSelectMode: (index: number) => void;
  onStep: (index: number) => void;
  onTyped: () => void;
}) => {
  const step = PHASE_STEPS[usageStep];
  const next = PHASE_STEPS[usageStep + 1];

  return (
    <div key={usageStep} className='lagune-fade-in flex flex-col min-w-0'>
      <PhaseCard
        phase={step.phase}
        stage={step.group}
        Icon={STEP_THEME[usageStep]}
        modeIndex={modeIndex}
        onSelectMode={onSelectMode}
      />
      <PromptCard
        command={step.phase.command}
        mode={step.phase.modes[modeIndex]}
        onDone={onTyped}
      />
      {typedDone &&
        (next ? (
          <button
            type='button'
            onClick={() => onStep(usageStep + 1)}
            className='lagune-fade-in group inline-flex items-center gap-2 self-start mt-5 mx-1 font-mono text-[12px] tracking-[0.04em] uppercase text-muted cursor-pointer transition-colors duration-200 hover:text-ink [&>svg]:size-4 [&>svg]:text-accent'
            aria-label={`Next: ${next.phase.title}`}
          >
            Next:{' '}
            <span className='font-semibold text-[rgba(233, 237, 247,0.82)] group-hover:text-ink'>
              {next.phase.title}
            </span>
            <LuArrowDown className='transition-transform duration-200 group-hover:translate-y-0.5' />
          </button>
        ) : (
          <span className='lagune-fade-in inline-flex items-center gap-2 self-start mt-5 mx-1 font-mono text-[12px] tracking-[0.04em] uppercase text-muted [&>svg]:size-4 [&>svg]:text-accent'>
            <LuCircleCheckBig />
            After all proven, the cycle is settled
          </span>
        ))}
    </div>
  );
};

export const UsagePanel = memo(UsagePanelComponent);
