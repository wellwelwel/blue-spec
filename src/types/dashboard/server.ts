import type { IncomingMessage, ServerResponse } from 'node:http';
import type { TrackingEntry } from '../core.js';
import type { ActionResponse } from './api.js';

export type { TrackingEntry } from '../core.js';

export type Tracking = {
  entries: TrackingEntry[];
};

export type StaticAsset = {
  status: number;
  type: string;
  body: Buffer | string;
};

export type LiveReload = {
  add: (client: ServerResponse) => void;
  remove: (client: ServerResponse) => void;
  close: () => void;
};

export type DashboardPaths = {
  lagune: string;
  dist: string;
};

export type StartDashboardOptions = {
  cwd: string;
  distDir: string;
  packageRoot: URL;
  port?: number;
  open?: boolean;
  allowedOrigins?: string[];
};

export type ActionContext = {
  cwd: string;
  packageRoot: URL;
};

export type ActionResult = {
  status: number;
  body: ActionResponse;
};

export type ActionHandler = (
  body: unknown,
  context: ActionContext
) => Promise<ActionResult>;

export type RequestGuards = {
  hostAllowed: (request: IncomingMessage) => boolean;
  originAllowed: (request: IncomingMessage) => boolean;
};

export type JsonBodyResult =
  | { kind: 'ok'; value: unknown }
  | { kind: 'unsupported-type' }
  | { kind: 'too-large' }
  | { kind: 'timeout' }
  | { kind: 'malformed' };

export type DashboardServerOptions = {
  paths: DashboardPaths;
  cwd: string;
  packageRoot: URL;
  allowedOrigins: string[];
  token: string;
};
