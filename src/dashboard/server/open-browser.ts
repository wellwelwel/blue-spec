import { spawn } from 'node:child_process';
import { platform } from 'node:process';

const openerFor = (target: string): { command: string; args: string[] } => {
  if (platform === 'darwin') return { command: 'open', args: [target] };
  if (platform === 'win32')
    return { command: 'cmd', args: ['/c', 'start', '', target] };
  return { command: 'xdg-open', args: [target] };
};

export const openBrowser = (target: string): Promise<void> =>
  new Promise((resolve) => {
    const { command, args } = openerFor(target);
    const child = spawn(command, args, {
      stdio: 'ignore',
      detached: true,
      shell: false,
    });

    child.once('error', resolve);
    child.unref();
    resolve();
  });
