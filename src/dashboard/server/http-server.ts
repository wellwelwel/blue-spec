import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { ActionResponse } from '../../types/dashboard/api';
import type {
  ActionHandler,
  DashboardServerOptions,
  JsonBodyResult,
  LiveReload,
} from '../../types/dashboard/server';
import { createServer } from 'node:http';
import { extname } from 'node:path';
import { ACTIONS } from './actions';
import { buildData } from './data/build/data';
import { createRequestGuards, crossSiteFetch, readJsonBody } from './guards';
import { createLiveReload } from './live-reload';
import { tokenMatches } from './session';
import { serveStatic } from './static-files';

const sendData = async (
  laguneDir: string,
  packageRoot: URL
): Promise<{ status: number; body: string }> => {
  try {
    return {
      status: 200,
      body: JSON.stringify(await buildData(laguneDir, packageRoot)),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 500, body: JSON.stringify({ error: message }) };
  }
};

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' https://lagune.weslley.io data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'none'",
].join('; ');

const DISABLED_FEATURES = [
  'camera',
  'microphone',
  'geolocation',
  'browsing-topics',
];

const PERMISSIONS_POLICY = DISABLED_FEATURES.map(
  (feature) => `${feature}=()`
).join(', ');

const setDocumentSecurityHeaders = (res: ServerResponse): void => {
  res.setHeader('content-security-policy', CONTENT_SECURITY_POLICY);
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('permissions-policy', PERMISSIONS_POLICY);
};

const sendJson = (res: ServerResponse, status: number, body: string): void => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(body);
};

const rejectCrossSite = (
  req: IncomingMessage,
  res: ServerResponse
): boolean => {
  if (!crossSiteFetch(req)) return false;

  sendJson(res, 403, JSON.stringify({ error: 'Forbidden' }));
  return true;
};

const sendMethodNotAllowed = (res: ServerResponse, allow: string): void => {
  res.setHeader('allow', allow);
  sendJson(res, 405, JSON.stringify({ error: 'Method not allowed' }));
};

const rejectionFor = (
  body: JsonBodyResult
): { status: number; response: ActionResponse } | undefined => {
  if (body.kind === 'unsupported-type')
    return {
      status: 415,
      response: { ok: false, error: 'Unsupported media type' },
    };

  if (body.kind === 'too-large')
    return { status: 413, response: { ok: false, error: 'Request too large' } };

  if (body.kind === 'timeout')
    return { status: 408, response: { ok: false, error: 'Request timed out' } };

  if (body.kind === 'malformed')
    return { status: 400, response: { ok: false, error: 'Malformed request' } };

  return undefined;
};

export const createDashboardServer = (
  options: DashboardServerOptions
): {
  server: Server;
  live: LiveReload;
} => {
  const { paths, cwd, packageRoot, token } = options;
  const live = createLiveReload(paths.lagune);
  const guards = createRequestGuards(options.allowedOrigins);
  let actionBusy = false;

  const runAction = async (
    req: IncomingMessage,
    res: ServerResponse,
    handler: ActionHandler
  ): Promise<void> => {
    if (
      crossSiteFetch(req) ||
      !guards.originAllowed(req) ||
      !tokenMatches(token, req.headers['x-lagune-token'])
    ) {
      sendJson(res, 403, JSON.stringify({ ok: false, error: 'Forbidden' }));
      return;
    }

    if (actionBusy) {
      sendJson(
        res,
        409,
        JSON.stringify({ ok: false, error: 'Another action is running' })
      );
      return;
    }

    actionBusy = true;

    try {
      const body = await readJsonBody(req);
      const rejection = rejectionFor(body);

      if (rejection !== undefined) {
        sendJson(res, rejection.status, JSON.stringify(rejection.response));

        if (body.kind === 'too-large' || body.kind === 'timeout')
          res.once('finish', () => req.destroy());

        return;
      }

      const result = await handler(
        body.kind === 'ok' ? body.value : undefined,
        { cwd, packageRoot }
      );

      sendJson(res, result.status, JSON.stringify(result.body));
    } finally {
      actionBusy = false;
    }
  };

  const server = createServer(async (req, res) => {
    const url = (req.url ?? '/').split('?')[0];
    const method = req.method ?? 'GET';

    if (!guards.hostAllowed(req)) {
      sendJson(res, 403, JSON.stringify({ error: 'Forbidden' }));
      return;
    }

    const handler = ACTIONS.get(url);

    if (handler !== undefined) {
      if (method !== 'POST') {
        sendMethodNotAllowed(res, 'POST');
        return;
      }

      await runAction(req, res, handler);
      return;
    }

    if (method !== 'GET') {
      sendMethodNotAllowed(res, 'GET');
      return;
    }

    if (url === '/api/session') {
      if (rejectCrossSite(req, res)) return;

      sendJson(res, 200, JSON.stringify({ token }));
      return;
    }

    if (url === '/api/data') {
      if (rejectCrossSite(req, res)) return;

      const { status, body } = await sendData(paths.lagune, packageRoot);
      sendJson(res, status, body);
      return;
    }

    if (url === '/events') {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        connection: 'keep-alive',
      });
      live.add(res);
      req.on('close', () => live.remove(res));
      res.on('error', () => live.remove(res));
      return;
    }

    const asset = await serveStatic(paths.dist, url);
    const fallback = asset.status === 404 && extname(url) === '';
    const served = fallback
      ? await serveStatic(paths.dist, '/index.html')
      : asset;
    const cacheable = url.startsWith('/assets/');

    if (served.type.startsWith('text/html')) setDocumentSecurityHeaders(res);

    res.writeHead(served.status, {
      'content-type': served.type,
      'cache-control': cacheable ? 'public, max-age=3600' : 'no-store',
      'x-content-type-options': 'nosniff',
    });
    res.end(served.body);
  });

  return { server, live };
};
