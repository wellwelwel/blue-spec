import type { IncomingMessage } from 'node:http';
import type {
  JsonBodyResult,
  RequestGuards,
} from '../../types/dashboard/server';

const MAX_BODY_BYTES = 16384;
const BODY_TIMEOUT_MS = 5000;

const mediaTypeOf = (request: IncomingMessage): string =>
  (request.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();

export const readJsonBody = (
  request: IncomingMessage,
  maxBytes: number = MAX_BODY_BYTES,
  timeoutMs: number = BODY_TIMEOUT_MS
): Promise<JsonBodyResult> => {
  if (mediaTypeOf(request) !== 'application/json')
    return Promise.resolve({ kind: 'unsupported-type' });

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let received = 0;
    let settled = false;

    const settle = (result: JsonBodyResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      request.removeAllListeners('data');
      request.pause();
      settle({ kind: 'timeout' });
    }, timeoutMs);

    timer.unref?.();

    request.on('data', (chunk: Buffer) => {
      received += chunk.length;

      if (received > maxBytes) {
        request.removeAllListeners('data');
        request.pause();
        settle({ kind: 'too-large' });
        return;
      }

      chunks.push(chunk);
    });

    request.on('end', () => {
      try {
        const value: unknown = JSON.parse(
          Buffer.concat(chunks).toString('utf8')
        );

        settle({ kind: 'ok', value });
      } catch {
        settle({ kind: 'malformed' });
      }
    });

    request.on('error', () => settle({ kind: 'malformed' }));
  });
};

export const crossSiteFetch = (request: IncomingMessage): boolean => {
  const site = request.headers['sec-fetch-site'];

  return typeof site === 'string' && site !== 'same-origin' && site !== 'none';
};

const LOOPBACK_NAMES = ['127.0.0.1', 'localhost', '[::1]'];

const loopbackHosts = (port: number | undefined): string[] =>
  LOOPBACK_NAMES.map((name) => `${name}:${port ?? 0}`);

export const createRequestGuards = (
  allowedOrigins: string[]
): RequestGuards => {
  const devOrigins = new Set(allowedOrigins);
  const devHosts = new Set(
    allowedOrigins.map((origin) => new URL(origin).host)
  );

  const hostAllowed = (request: IncomingMessage): boolean => {
    const requestHost = request.headers.host;

    if (typeof requestHost !== 'string') return false;

    return (
      loopbackHosts(request.socket.localPort).includes(requestHost) ||
      devHosts.has(requestHost)
    );
  };

  const originAllowed = (request: IncomingMessage): boolean => {
    const requestOrigin = request.headers.origin;

    if (typeof requestOrigin !== 'string') return false;

    const ownOrigins = loopbackHosts(request.socket.localPort).map(
      (own) => `http://${own}`
    );

    return ownOrigins.includes(requestOrigin) || devOrigins.has(requestOrigin);
  };

  return { hostAllowed, originAllowed };
};
