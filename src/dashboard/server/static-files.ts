import type { StaticAsset } from '../../types/dashboard/server';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

const resolveWithin = (root: string, urlPath: string): string | null => {
  const base = normalize(root).replace(/[/\\]+$/, '');
  const relative = normalize(decodeURIComponent(urlPath)).replace(
    /^[/\\]+/,
    ''
  );
  const target = relative === '' ? 'index.html' : relative;
  const fullPath = join(base, target);
  if (fullPath !== base && !fullPath.startsWith(base + sep)) return null;
  return fullPath;
};

export const serveStatic = async (
  root: string,
  urlPath: string
): Promise<StaticAsset> => {
  const fullPath = resolveWithin(root, urlPath);
  if (!fullPath)
    return {
      status: 403,
      type: 'text/plain; charset=utf-8',
      body: 'forbidden',
    };

  try {
    const body = await readFile(fullPath);
    return {
      status: 200,
      type: CONTENT_TYPES[extname(fullPath)] ?? 'application/octet-stream',
      body,
    };
  } catch {
    return {
      status: 404,
      type: 'text/plain; charset=utf-8',
      body: 'not found',
    };
  }
};
