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
    items: [
      'get-started/install',
      'get-started/commands',
      'supported-agents',
      'requirements',
    ],
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
    items: ['hooks/regex', 'hooks/network', 'hooks/skills'],
  },
  {
    label: 'References & Sources',
    items: ['references/skills-sources'],
  },
  {
    label: 'Maintenance',
    items: ['commands/repair'],
  },
];
