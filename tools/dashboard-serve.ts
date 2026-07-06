import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { startDashboard } from '../src/dashboard/server/start';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '..', 'lib', 'dashboard');

process.on('uncaughtException', (error) => {
  process.stderr.write(`[dashboard] recovered: ${error.message}\n`);
});

startDashboard({
  cwd: process.cwd(),
  distDir,
  packageRoot: new URL('../', import.meta.url),
  port: 3001,
  open: false,
  allowedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173'],
}).catch((error) => {
  process.stderr.write(
    `[dashboard] ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
});
