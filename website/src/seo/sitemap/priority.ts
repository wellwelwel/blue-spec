export type ChangeFreq =
  'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

const DEFAULT_PRIORITY = 0.5;

type Tier = {
  priority: number;
  match: (pathname: string) => boolean;
};

const tiers: Tier[] = [
  {
    priority: 1.0,
    match: (pathname) => pathname === '/',
  },
  {
    priority: 0.9,
    match: (pathname) => pathname === '/docs',
  },
  {
    priority: 0.8,
    match: (pathname) =>
      pathname.startsWith('/docs/get-started/') ||
      pathname === '/docs/supported-agents' ||
      pathname === '/docs/commands/lagune' ||
      pathname === '/docs/references/paper',
  },
  {
    priority: 0.7,
    match: (pathname) => pathname.startsWith('/docs/commands/'),
  },
  {
    priority: 0.6,
    match: (pathname) =>
      pathname.startsWith('/docs/references/') ||
      pathname.startsWith('/docs/hooks/'),
  },
];

const pathnameOf = (url: string): string => {
  try {
    return new URL(url).pathname.replace(/\/$/, '') || '/';
  } catch {
    return url;
  }
};

export const sitemapPriority = (url: string): number => {
  const pathname = pathnameOf(url);
  const tier = tiers.find(({ match }) => match(pathname));

  return tier ? tier.priority : DEFAULT_PRIORITY;
};
