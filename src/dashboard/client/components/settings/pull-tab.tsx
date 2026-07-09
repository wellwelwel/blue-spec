import type { ActionRunState, RunButton } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { runPull } from '../../data/api';
import { modal, useData } from '../../data/state';
import { actionFailed, useRunAction } from '../../hooks/use/run-action';
import { resumeStepKey } from '../../selectors/overview';
import { ActionCard } from './action-card';

const RUN_BUTTON: Record<ActionRunState, RunButton> = {
  idle: { icon: 'pullDown', label: 'Run pull' },
  pending: { icon: 'refresh', label: 'Pulling…' },
  success: { icon: 'check', label: 'Pulled' },
  error: { icon: 'pullDown', label: 'Run pull' },
};

const IN_PLACE_BUTTON: Record<ActionRunState, RunButton> = {
  ...RUN_BUTTON,
  idle: { icon: 'pullDown', label: 'Pull anyway' },
  error: { icon: 'pullDown', label: 'Pull anyway' },
};

export const PullTab = (): VNode => {
  const data = useData();
  const { install, phases } = data;
  const inPlace = install.present && install.missing.length === 0;
  const { run, trigger } = useRunAction(RUN_BUTTON);

  const pull = () => {
    const defaultKey = resumeStepKey(phases);
    modal.value = {
      kind: 'pull',
      run: 'pending',
      created: 0,
      skipped: 0,
      defaultKey,
    };

    trigger(async () => {
      const response = await runPull();
      const succeeded = response.ok && 'created' in response;

      modal.value = {
        kind: 'pull',
        run: succeeded ? 'success' : 'error',
        created: succeeded ? response.created : 0,
        skipped: succeeded ? response.skipped : 0,
        defaultKey,
      };

      return response;
    });
  };

  return (
    <ActionCard
      icon={inPlace ? 'shieldCheck' : 'pullDown'}
      title={
        inPlace
          ? 'Every manifest file is in place'
          : 'Rebuild from the committed manifest'
      }
      body={
        inPlace
          ? `All ${install.filesTotal} manifest files from .lagune/manifest.json are already in place, so there is nothing to rebuild. Pull anyway to restore any file that has drifted from the committed manifest.`
          : 'After cloning a repo that already uses Lagune, pull reconstructs everything from the committed .lagune/manifest.json, so a fresh checkout is ready without a full re-install.'
      }
      action={inPlace ? 'Pull anyway' : 'Run pull'}
      run={run}
      runButton={inPlace ? IN_PLACE_BUTTON : RUN_BUTTON}
      onRun={pull}
      errorText={actionFailed('Pull')}
    />
  );
};
