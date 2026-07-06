import type { InstallAgent, InstallCategory } from '@/types/dashboard/client';
import type { Install } from '@/types/dashboard/dashboard';
import { skillGroupIcon } from '@/dashboard/shared/skill-meta';
import { SKILL_GROUPS } from '@/hooks/skills/groups';
import { AGENT_SPECS } from '@/providers/specs';

export const isLocked = (install: Install): boolean => !install.present;

const AGENT_ICONS: Record<string, string> = {
  claude: '/assets/icons/claude.svg',
  codex: '/assets/icons/codex.svg',
  'cursor-agent': '/assets/icons/cursor.svg',
  agy: '/assets/icons/antigravity.svg',
  opencode: '/assets/icons/opencode.svg',
};

export const AGENTS: InstallAgent[] = AGENT_SPECS.map((spec) => ({
  key: spec.key,
  name: spec.displayName,
  icon: AGENT_ICONS[spec.key] ?? null,
}));

export const CATEGORIES: InstallCategory[] = SKILL_GROUPS.map((group) => ({
  key: group.key,
  name: group.label,
  description: group.description,
  icon: skillGroupIcon(group.key),
}));
