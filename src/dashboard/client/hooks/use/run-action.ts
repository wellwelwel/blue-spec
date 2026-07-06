import type { ActionResponse } from '@/types/dashboard/api';
import type { ActionRunState, RunButton } from '@/types/dashboard/client';
import { useState } from 'preact/hooks';

export const actionFailed = (label: string): string =>
  `${label} failed. Check the terminal running the dashboard.`;

export const useRunAction = (buttons: Record<ActionRunState, RunButton>) => {
  const [run, setRun] = useState<ActionRunState>('idle');

  const trigger = (task: () => Promise<ActionResponse>) => {
    if (run === 'pending') return;
    setRun('pending');
    task().then((result) => setRun(result.ok ? 'success' : 'error'));
  };

  return { run, setRun, button: buttons[run], trigger };
};
