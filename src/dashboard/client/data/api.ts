import type {
  ActionResponse,
  InstallRequest,
  SessionPayload,
  SpecializeRequest,
} from '@/types/dashboard/api';

const fetchSession = async (): Promise<SessionPayload> => {
  const response = await fetch('/api/session', { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

const postAction = async (
  path: string,
  payload: unknown
): Promise<ActionResponse> => {
  try {
    const session = await fetchSession();
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-lagune-token': session.token,
      },
      body: JSON.stringify(payload),
    });
    const body: ActionResponse = await response.json();

    return body;
  } catch {
    return { ok: false, error: 'Request failed' };
  }
};

export const runInstall = (request: InstallRequest): Promise<ActionResponse> =>
  postAction('/api/actions/install', request);

export const runPull = (): Promise<ActionResponse> =>
  postAction('/api/actions/pull', Object.create(null));

export const runUpdate = (): Promise<ActionResponse> =>
  postAction('/api/actions/update', Object.create(null));

export const runSpecialize = (
  request: SpecializeRequest
): Promise<ActionResponse> => postAction('/api/actions/specialize', request);
