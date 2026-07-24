export type InfraKind = 'terraform' | 'dockerfile' | 'github-actions';

export type InfraVerdict =
  | 'public-ingress'
  | 'iam-wildcard'
  | 'secret-in-data'
  | 'encryption-disabled'
  | 'unpinned-module'
  | 'unpinned-action'
  | 'root-user'
  | 'curl-pipe'
  | 'mutable-tag'
  | 'script-injection'
  | 'write-all'
  | 'safe';

export type InfraSeverity = 'finding' | 'advisory';

export type InfraRule = {
  tag: InfraVerdict;
  severity: InfraSeverity;
  detail: string;
  test: (content: string) => boolean;
};
