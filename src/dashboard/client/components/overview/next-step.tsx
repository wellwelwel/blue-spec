import type { Install, Phase } from '@/types/dashboard/dashboard';
import type { VNode } from 'preact';
import { nextStep } from '../../selectors/overview';
import { NextStepCard } from '../next-step-card';
import { SectionHead } from './section-head';

export const NextStep = (props: {
  phases: Phase[];
  install: Install;
}): VNode | null => {
  if (!props.install.present) return null;

  const step = nextStep(props.phases);
  if (step === null) return null;

  return (
    <section class='mb-6'>
      <SectionHead title='Next step' />
      <NextStepCard step={step} />
    </section>
  );
};
