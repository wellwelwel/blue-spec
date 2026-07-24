export type DocsNavCategory = {
  label: string;
  collapsed?: boolean;
  items: string[];
};

export type DocsNavEntry = string | DocsNavCategory;

export const docsNav: DocsNavEntry[] = [
  'intro',
  {
    label: 'Get Started',
    collapsed: false,
    items: ['get-started/install', 'get-started/commands', 'supported-agents'],
  },
  {
    label: 'Development Flow',
    collapsed: false,
    items: ['commands/lagune'],
  },
  {
    label: 'The Blue Team Flow',
    collapsed: false,
    items: [
      'commands/charter',
      'commands/detect',
      'commands/plan',
      'commands/harden',
      'commands/verify',
    ],
  },
  {
    label: 'Tools',
    collapsed: false,
    items: ['commands/skills', 'commands/specialize', 'commands/prove'],
  },
  {
    label: 'Hooks',
    items: [
      'hooks/agent',
      'hooks/cors',
      'hooks/crypto',
      'hooks/infra',
      'hooks/interpreter',
      'hooks/jwt',
      'hooks/network',
      'hooks/regex',
      'hooks/secrets',
    ],
  },
  {
    label: 'References & Sources',
    items: [
      'references/paper',
      'references/glossary',
      'references/comparison',
      'references/skills-sources',
    ],
  },
  {
    label: 'Maintenance',
    items: ['commands/repair', 'commands/migrate'],
  },
];
