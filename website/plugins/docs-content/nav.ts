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
    items: ['hooks/regex', 'hooks/network'],
  },
  {
    label: 'References & Sources',
    items: ['references/paper', 'references/skills-sources'],
  },
  {
    label: 'Maintenance',
    items: ['commands/repair'],
  },
];
