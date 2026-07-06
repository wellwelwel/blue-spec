import type { ActionRunState, RunButton } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { runUpdate } from '../../data/api';
import { modal, useData } from '../../data/state';
import { actionFailed, useRunAction } from '../../hooks/use/run-action';
import { resumeStepKey } from '../../selectors/overview';
import { ActionCard } from './action-card';

const RUN_BUTTON: Record<ActionRunState, RunButton> = {
  idle: { icon: 'upgrade', label: 'Run update' },
  pending: { icon: 'refresh', label: 'Updating…' },
  success: { icon: 'check', label: 'Updated' },
  error: { icon: 'upgrade', label: 'Run update' },
};

export const UpdateTab = (): VNode => {
  const { phases } = useData();
  const { run, trigger } = useRunAction(RUN_BUTTON);

  const update = () => {
    const defaultKey = resumeStepKey(phases);
    modal.value = { kind: 'update', run: 'pending', refreshed: 0, defaultKey };

    trigger(async () => {
      const response = await runUpdate();
      const succeeded = response.ok && 'refreshed' in response;

      modal.value = {
        kind: 'update',
        run: succeeded ? 'success' : 'error',
        refreshed: succeeded ? response.refreshed : 0,
        defaultKey,
      };

      return response;
    });
  };

  return (
    <ActionCard
      icon='upgrade'
      title='Update to the latest version'
      body='Refresh the Blue Spec command, template, hook, and specialization files to their newest version, keeping your charter, findings, and tracking untouched.'
      action='Run update'
      run={run}
      runButton={RUN_BUTTON}
      onRun={update}
      errorText={actionFailed('Update')}
    />
  );
};
