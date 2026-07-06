import type { FSWatcher } from 'node:fs';
import type { ServerResponse } from 'node:http';
import type { LiveReload } from '../../types/dashboard/server';
import { watch } from 'node:fs';
import { access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { buildInstall, installWatchRoots } from './data/build/install';
import { readText } from './data/read';

const dirExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const watchDir = (dir: string, onChange: () => void): FSWatcher => {
  try {
    return watch(dir, { recursive: true }, onChange);
  } catch {
    return watch(dir, onChange);
  }
};

export const createLiveReload = (dir: string): LiveReload => {
  const clients = new Set<ServerResponse>();
  let timer: NodeJS.Timeout | null = null;

  const notify = (): void => {
    syncInstallWatchers();

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      for (const client of clients) {
        try {
          client.write('data: reload\n\n');
        } catch {
          clients.delete(client);
        }
      }
    }, 120);
  };

  const tryWatchTarget = (): FSWatcher | null => {
    try {
      const target = watchDir(dir, notify);
      target.on('error', () => {});
      return target;
    } catch {
      return null;
    }
  };

  const watchParentUntilCreated = (): FSWatcher => {
    const parent = watch(dirname(dir), () => {
      const target = tryWatchTarget();

      if (target === null) return;

      parent.close();
      watcher = target;
      notify();
    });

    parent.on('error', () => {});

    return parent;
  };

  let watcher = tryWatchTarget() ?? watchParentUntilCreated();

  const projectRoot = resolve(dir, '..');
  const manifestPath = join(dir, 'manifest.json');
  const installWatchers = new Map<string, FSWatcher>();

  const reconcileWatchers = async (): Promise<void> => {
    const { files } = buildInstall(await readText(manifestPath));
    const roots = new Set(installWatchRoots(files));

    for (const [root, active] of installWatchers) {
      if (roots.has(root)) continue;
      active.close();
      installWatchers.delete(root);
    }

    for (const root of roots) {
      if (installWatchers.has(root)) continue;
      const path = resolve(projectRoot, root);
      if (!(await dirExists(path))) continue;
      const active = watchDir(path, notify);
      active.on('error', () => {});
      installWatchers.set(root, active);
    }
  };

  let syncing: Promise<void> | null = null;
  let syncQueued = false;

  const syncInstallWatchers = (): void => {
    if (syncing) {
      syncQueued = true;
      return;
    }
    syncing = reconcileWatchers().finally(() => {
      syncing = null;
      if (!syncQueued) return;
      syncQueued = false;
      syncInstallWatchers();
    });
  };

  const rootWatcher = watch(projectRoot, syncInstallWatchers);
  rootWatcher.on('error', () => {});

  syncInstallWatchers();

  return {
    add: (client) => {
      clients.add(client);
      client.write('retry: 1000\n\n');
    },
    remove: (client) => {
      clients.delete(client);
    },
    close: () => {
      if (timer) clearTimeout(timer);
      watcher.close();
      rootWatcher.close();
      for (const active of installWatchers.values()) active.close();
      installWatchers.clear();
      for (const client of clients) client.end();
      clients.clear();
    },
  };
};
