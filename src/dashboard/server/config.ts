import type { DashboardPaths } from '../../types/dashboard/server';
import { join } from 'node:path';

export const host = '127.0.0.1';

export const defaultPort = 0;

export const resolvePaths = (cwd: string, distDir: string): DashboardPaths => ({
  bluespec: join(cwd, '.bluespec'),
  dist: distDir,
});
