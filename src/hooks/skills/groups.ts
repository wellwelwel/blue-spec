import type { SkillGroup } from '../../types/core.js';

export const SKILL_GROUPS: SkillGroup[] = [
  {
    key: 'owasp',
    label: 'OWASP',
    description: 'Harden against the application security risks OWASP tracks',
  },
  {
    key: 'infra',
    label: 'Infrastructure',
    description:
      'Container, workload, and serverless config: Dockerfile, Compose, Pod security, FaaS IAM and triggers',
  },
  {
    key: 'ai',
    label: 'AI / LLM',
    description:
      'AI and LLM integrations: prompts, tools, agents, retrieval, and MCP',
  },
  {
    key: 'lovable',
    label: 'Lovable',
    description:
      'AI-generated Supabase apps (Lovable and similar): RLS and key model, plus the access, secret, validation, and delivery defaults that ship insecure',
  },
  {
    key: 'javascript',
    label: 'JavaScript',
    description: 'JavaScript and its runtimes',
  },
  {
    key: 'python',
    label: 'Python',
    description: 'Python and its language-specific risks',
  },
  {
    key: 'rust',
    label: 'Rust',
    description: 'Rust and its language-specific risks',
  },
  {
    key: 'java',
    label: 'Java',
    description: 'Java and its language-specific risks',
  },
  {
    key: 'ruby',
    label: 'Ruby',
    description: 'Ruby and its language-specific risks',
  },
  {
    key: 'php',
    label: 'PHP',
    description: 'PHP and its language-specific risks',
  },
  {
    key: 'go',
    label: 'Go',
    description: 'Go and its language-specific risks',
  },
  {
    key: 'c-cpp',
    label: 'C / C++',
    description: 'C and C++ and their language-specific risks',
  },
  {
    key: 'dotnet',
    label: '.NET',
    description: '.NET and C# and their platform-specific risks',
  },
];
