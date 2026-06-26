import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Get Started',
      collapsed: false,
      items: ['get-started/install', 'get-started/commands'],
    },
    {
      type: 'category',
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
      type: 'category',
      label: 'Tools',
      collapsed: false,
      items: ['commands/skills', 'commands/specialize', 'commands/prove'],
    },
    {
      type: 'category',
      label: 'Hooks',
      items: ['hooks/regex', 'hooks/url-safety', 'hooks/skills'],
    },
    'supported-agents',
    'requirements',
    {
      type: 'category',
      label: 'References & Sources',
      items: ['references/skills-sources'],
    },
    {
      type: 'category',
      label: 'Maintenance',
      items: ['commands/repair'],
    },
  ],
};

export default sidebars;
