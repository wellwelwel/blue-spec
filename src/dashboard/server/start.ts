import type { Server } from 'node:http';
import type { StartDashboardOptions } from '../../types/dashboard/server';
import { pid } from 'node:process';
import { defaultPort, host, resolvePaths } from './config';
import { createDashboardServer } from './http-server';
import { openBrowser } from './open-browser';
import { createSessionToken, persistSessionToken } from './session';

const announce = (port: number): void => {
  const url = `http://${host}:${port}`;
  process.stdout.write(`\n  🌊 Lagune dashboard → ${url}\n`);
  process.stdout.write('\n  Watching .lagune/ — changes reload the browser.\n');
  process.stdout.write('  Press Ctrl+C to stop.\n\n');
};

const listen = (
  server: Server,
  port: number,
  triesLeft: number
): Promise<number> =>
  new Promise((resolve, reject) => {
    const onError = (error: NodeJS.ErrnoException): void => {
      if (error.code === 'EADDRINUSE' && triesLeft > 0) {
        listen(server, port + 1, triesLeft - 1).then(resolve, reject);
        return;
      }
      reject(error);
    };

    server.once('error', onError);
    server.listen(port, host, () => {
      server.removeListener('error', onError);
      const address = server.address();
      resolve(typeof address === 'object' && address ? address.port : port);
    });
  });

export const startDashboard = async (
  options: StartDashboardOptions
): Promise<void> => {
  const paths = resolvePaths(options.cwd, options.distDir);
  const token = createSessionToken();

  await persistSessionToken(token, pid);

  const { server, live } = createDashboardServer({
    paths,
    cwd: options.cwd,
    packageRoot: options.packageRoot,
    allowedOrigins: options.allowedOrigins ?? [],
    token,
  });
  const port = await listen(server, options.port ?? defaultPort, 10);

  announce(port);

  if (options.open !== false) await openBrowser(`http://${host}:${port}`);

  return new Promise((resolve) => {
    const shutdown = (): void => {
      live.close();
      server.close(() => resolve());
      server.closeAllConnections();
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  });
};
