import { randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const createSessionToken = (): string => randomBytes(32).toString('hex');

const sessionDir = (): string => join(tmpdir(), 'blue-spec');

export const sessionTokenPath = (pid: number): string =>
  join(sessionDir(), `session-${pid}.token`);

export const persistSessionToken = async (
  token: string,
  pid: number
): Promise<string> => {
  const dir = sessionDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });

  const path = sessionTokenPath(pid);
  await writeFile(path, token, { encoding: 'utf8', mode: 0o600 });

  return path;
};

export const tokenMatches = (
  expected: string,
  received: string | string[] | undefined
): boolean => {
  if (typeof received !== 'string') return false;

  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);

  if (expectedBytes.length !== receivedBytes.length) return false;

  return timingSafeEqual(expectedBytes, receivedBytes);
};
