import type { PhaseCommand } from '@/types/dashboard/client';

export const PHASE_COMMANDS: PhaseCommand[] = [
  {
    key: 'charter',
    label: 'Charter',
    icon: 'charter',
    tone: 'bg-accent-soft text-accent',
    command: '/lagune.charter',
    purpose:
      "Back in your agent, establish your project's security principles, the rules every later phase respects.",
  },
  {
    key: 'detect',
    label: 'Detect',
    icon: 'search',
    tone: 'bg-blue-soft text-blue',
    command: '/lagune.detect',
    purpose:
      'Back in your agent, read your code and map what your system does and where the risks are.',
  },
  {
    key: 'plan',
    label: 'Plan',
    icon: 'layers',
    tone: 'bg-accent-soft text-accent',
    command: '/lagune.plan',
    purpose:
      'Back in your agent, turn what detect found into a defense plan, ranking each finding by priority and pairing it with a fix.',
  },
  {
    key: 'harden',
    label: 'Harden',
    icon: 'shield',
    tone: 'bg-amber-soft text-amber',
    command: '/lagune.harden',
    purpose:
      "Back in your agent, apply the plan's fixes to your code, safely and one at a time.",
  },
  {
    key: 'verify',
    label: 'Verify',
    icon: 'checkCircle',
    tone: 'bg-teal-soft text-teal',
    command: '/lagune.verify',
    purpose:
      'Back in your agent, prove each applied fix holds, then close out the ones that do.',
  },
];

export const phaseCommand = (label: string): PhaseCommand | null =>
  PHASE_COMMANDS.find(
    (item) => item.label.toLowerCase() === label.toLowerCase()
  ) ?? null;
