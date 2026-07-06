export type InstallRequest = {
  agent: string;
  categories: string[];
};

export type SpecializeRequest = {
  categories: string[];
};

export type ActionSuccess =
  | { ok: true; created: number; skipped: number }
  | { ok: true; refreshed: number }
  | { ok: true; added: number; removed: number };

export type ActionFailure = {
  ok: false;
  error: string;
};

export type ActionResponse = ActionSuccess | ActionFailure;

export type SessionPayload = {
  token: string;
};
