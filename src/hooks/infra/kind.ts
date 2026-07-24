import type { InfraKind } from '../../types/hooks/infra.js';

const KINDS: readonly InfraKind[] = [
  'terraform',
  'dockerfile',
  'github-actions',
];

export const infraKindOf = (relativePath: string): InfraKind | null => {
  const posix = relativePath.replace(/\\/g, '/');
  const base = posix.split('/').pop() ?? '';

  if (/\.(?:tf|hcl)$/i.test(base) || /\.tf\.json$/i.test(base))
    return 'terraform';

  if (/^dockerfile(?:\.[\w.-]+)?$/i.test(base) || /\.dockerfile$/i.test(base))
    return 'dockerfile';

  if (
    /(?:^|\/)\.github\/(?:workflows|actions)\/[^\n]{1,200}\.ya?ml$/i.test(posix)
  )
    return 'github-actions';

  return null;
};

export const isInfraKind = (value: string): value is InfraKind =>
  (KINDS as readonly string[]).includes(value);
