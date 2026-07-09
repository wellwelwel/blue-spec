import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startDashboard } from '../src/dashboard/server/start';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '..', 'lib', 'dashboard');

startDashboard({
  cwd: '/tmp/lagune-verify',
  distDir,
  packageRoot: new URL('../', import.meta.url),
  port: 4390,
  open: false,
});
