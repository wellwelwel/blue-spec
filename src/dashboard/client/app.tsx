import type { VNode } from 'preact';
import { LocationProvider, Route, Router, useLocation } from 'preact-iso';
import { useEffect, useRef } from 'preact/hooks';
import { RightRail } from './components/layout/right-rail';
import { Sidebar } from './components/layout/sidebar';
import { Topbar } from './components/layout/topbar';
import { ActionModal } from './components/settings/action-modal';
import { data, status, useData } from './data/state';
import { useDashboardData } from './hooks/use/data';
import { Charter } from './routes/charter';
import { FindingDetail } from './routes/finding-detail';
import { Findings } from './routes/findings';
import { Overview } from './routes/overview';
import { Settings } from './routes/settings';
import { SideQuests } from './routes/sidequests';
import { Skills } from './routes/skills';

const InstallLock = (): null => {
  const { path, route } = useLocation();
  const { present, missing } = useData().install;
  const firstRun = useRef(true);

  useEffect(() => {
    const isFirstRun = firstRun.current;
    firstRun.current = false;

    const escapedInstall = !present && !path.startsWith('/settings');
    const landedIncomplete =
      isFirstRun && present && missing.length > 0 && path === '/';

    if (escapedInstall) route('/settings?tab=install', true);
    else if (landedIncomplete) route('/settings?tab=pull', true);
  }, [present, missing.length, path]);

  return null;
};

const Workspace = (): VNode => (
  <div class='grid h-screen grid-cols-[250px_minmax(0,1fr)] overflow-hidden bg-canvas max-[1280px]:grid-cols-[224px_minmax(0,1fr)]'>
    <InstallLock />
    <ActionModal />
    <Sidebar />
    <div class='flex min-w-0 flex-col overflow-hidden'>
      <Topbar />
      <div class='scroll-slim flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-7 pt-2 pb-7 min-[1280px]:grid min-[1280px]:grid-cols-[minmax(0,1fr)_350px] min-[1280px]:overflow-hidden'>
        <main class='flex min-w-0 flex-col min-[1280px]:scroll-slim min-[1280px]:overflow-y-auto'>
          <Router>
            <Route path='/' component={Overview} />
            <Route path='/findings' component={Findings} />
            <Route path='/findings/:id' component={FindingDetail} />
            <Route path='/sidequests' component={SideQuests} />
            <Route path='/charter' component={Charter} />
            <Route path='/skills' component={Skills} />
            <Route path='/settings' component={Settings} />
            <Route default component={Overview} />
          </Router>
        </main>
        <RightRail />
      </div>
    </div>
  </div>
);

const Boot = (props: { message: VNode | string; error?: boolean }): VNode => (
  <div
    class={`grid min-h-[60vh] place-items-center p-10 text-center text-base ${
      props.error ? 'text-red' : 'text-muted'
    }`}
  >
    {props.message}
  </div>
);

export const App = (): VNode => {
  useDashboardData();

  return (
    <LocationProvider>
      {status.value === 'error' ? (
        <Boot
          error
          message='Could not reach the dashboard server. Restart it and reload.'
        />
      ) : data.value ? (
        <Workspace />
      ) : (
        <Boot
          message={
            <>
              Loading{' '}
              <code class='rounded-md bg-surface px-2 py-0.5 font-mono font-semibold'>
                .bluespec/
              </code>{' '}
              …
            </>
          }
        />
      )}
    </LocationProvider>
  );
};
