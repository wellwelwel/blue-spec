import type { Counts, PhaseCommand } from '@/types/dashboard/client';
import type { Phase } from '@/types/dashboard/dashboard';
import { phaseCommand } from '../domain/commands';

export const nextStep = (phases: Phase[]): PhaseCommand | null => {
  const pending = phases.find((phase) => phase.state !== 'done');
  return pending ? phaseCommand(pending.name) : null;
};

export const resumeStepKey = (phases: Phase[]): string =>
  nextStep(phases)?.key ?? 'detect';

export const postureState = (
  project: string,
  counts: Counts
): { headline: string; subline: string } => {
  if (counts.total === 0)
    return {
      headline: `${project} has a clean chain`,
      subline:
        'Nothing is waiting on a fix. Detect maps what the system does and surfaces what matters.',
    };
  if (counts.verified === counts.total)
    return {
      headline: `${project} is verified and closed`,
      subline:
        'Every finding was proven closed and stood down. The chain rests until the code changes.',
    };
  if (counts.applied === counts.total)
    return {
      headline: `${project} is hardened, awaiting proof`,
      subline:
        'Every fix is in place. Verify proves each control holds and stands the finding down.',
    };
  return {
    headline: `${project} hardening in progress`,
    subline:
      'Fixes are being applied. Each finding carries its own detect, plan, harden, verify trail.',
  };
};
