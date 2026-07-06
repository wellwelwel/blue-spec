import type {
  InstallRequest,
  SpecializeRequest,
} from '../../types/dashboard/api';
import type { ActionHandler, ActionResult } from '../../types/dashboard/server';
import {
  performInit,
  performPull,
  performSpecialize,
  performUpdate,
} from '../../core/init';
import { SKILL_GROUPS } from '../../hooks/skills/groups';
import { getProvider } from '../../providers/registry';
import { AGENT_SPECS } from '../../providers/specs';

const AGENT_KEYS: ReadonlySet<string> = new Set(
  AGENT_SPECS.map((spec) => spec.key)
);

const CATEGORY_KEYS: ReadonlySet<string> = new Set(
  SKILL_GROUPS.map((group) => group.key)
);

const INSTALL_FIELDS: ReadonlySet<string> = new Set(['agent', 'categories']);

const SPECIALIZE_FIELDS: ReadonlySet<string> = new Set(['categories']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseCategories = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value) || value.length > SKILL_GROUPS.length)
    return undefined;

  const valid = value.every(
    (item) => typeof item === 'string' && CATEGORY_KEYS.has(item)
  );

  if (!valid) return undefined;

  return [...new Set(value.filter((item) => typeof item === 'string'))];
};

const parseFields = <T>(
  body: unknown,
  fields: ReadonlySet<string>,
  build: (record: Record<string, unknown>) => T | undefined
): T | undefined => {
  if (!isRecord(body)) return undefined;

  const keys = Object.keys(body);

  if (keys.length > fields.size) return undefined;

  if (!keys.every((key) => fields.has(key))) return undefined;

  return build(body);
};

const parseInstallRequest = (body: unknown): InstallRequest | undefined =>
  parseFields(body, INSTALL_FIELDS, (record) => {
    const agent = record.agent;
    const categories = parseCategories(record.categories);

    if (typeof agent !== 'string' || !AGENT_KEYS.has(agent)) return undefined;
    if (categories === undefined) return undefined;

    return { agent, categories };
  });

const parseSpecializeRequest = (body: unknown): SpecializeRequest | undefined =>
  parseFields(body, SPECIALIZE_FIELDS, (record) => {
    const categories = parseCategories(record.categories);

    if (categories === undefined) return undefined;

    return { categories };
  });

const isEmptyBody = (body: unknown): boolean =>
  isRecord(body) && Object.keys(body).length === 0;

const INVALID_REQUEST: ActionResult = {
  status: 400,
  body: { ok: false, error: 'Invalid request' },
};

const NOT_INITIALIZED: ActionResult = {
  status: 409,
  body: { ok: false, error: 'Not initialized' },
};

const runAction = async (
  labels: { log: string; error: string },
  fn: () => Promise<ActionResult>
): Promise<ActionResult> => {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const oneLine = message.replaceAll('\r', ' ').replaceAll('\n', ' ');

    process.stderr.write(`[dashboard] ${labels.log} failed: ${oneLine}\n`);

    return { status: 500, body: { ok: false, error: labels.error } };
  }
};

const handleInstall: ActionHandler = async (body, context) => {
  const request = parseInstallRequest(body);

  if (request === undefined) return INVALID_REQUEST;

  return runAction({ log: 'install', error: 'Install failed' }, async () => {
    const result = await performInit({
      cwd: context.cwd,
      packageRoot: context.packageRoot,
      provider: getProvider(request.agent),
      categoryKeys: request.categories,
      now: new Date(),
    });

    return {
      status: 200,
      body: {
        ok: true,
        created: result.scaffold.created.length,
        skipped: result.scaffold.skipped.length,
      },
    };
  });
};

const handlePull: ActionHandler = async (body, context) => {
  if (!isEmptyBody(body)) return INVALID_REQUEST;

  return runAction({ log: 'pull', error: 'Pull failed' }, async () => {
    const result = await performPull({
      cwd: context.cwd,
      packageRoot: context.packageRoot,
    });

    if (!result.initialized) return NOT_INITIALIZED;

    return {
      status: 200,
      body: {
        ok: true,
        created: result.scaffold.created.length,
        skipped: result.scaffold.skipped.length,
      },
    };
  });
};

const handleUpdate: ActionHandler = async (body, context) => {
  if (!isEmptyBody(body)) return INVALID_REQUEST;

  return runAction({ log: 'update', error: 'Update failed' }, async () => {
    const result = await performUpdate({
      cwd: context.cwd,
      packageRoot: context.packageRoot,
      now: new Date(),
    });

    if (!result.initialized) return NOT_INITIALIZED;

    return {
      status: 200,
      body: { ok: true, refreshed: result.refresh.refreshed.length },
    };
  });
};

const handleSpecialize: ActionHandler = async (body, context) => {
  const request = parseSpecializeRequest(body);

  if (request === undefined) return INVALID_REQUEST;

  return runAction(
    { log: 'specialize', error: 'Specialization failed' },
    async () => {
      const result = await performSpecialize({
        cwd: context.cwd,
        packageRoot: context.packageRoot,
        categories: request.categories,
        now: new Date(),
      });

      if (!result.initialized) return NOT_INITIALIZED;

      return {
        status: 200,
        body: { ok: true, added: result.added, removed: result.removed },
      };
    }
  );
};

export const ACTIONS: ReadonlyMap<string, ActionHandler> = new Map([
  ['/api/actions/install', handleInstall],
  ['/api/actions/pull', handlePull],
  ['/api/actions/update', handleUpdate],
  ['/api/actions/specialize', handleSpecialize],
]);
