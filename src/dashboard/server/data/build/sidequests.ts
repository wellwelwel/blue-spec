import type { SideQuestItem } from '../../../../types/dashboard/dashboard';
import { sectionBullets } from '../markdown/sections';

export const buildSideQuests = (
  detect: string | null,
  plan: string | null,
  harden: string | null
): SideQuestItem[] => [
  ...sectionBullets(detect, 'Not determined').map(
    (text): SideQuestItem => ({ phase: 'Detect', text })
  ),
  ...sectionBullets(plan, 'Open questions').map(
    (text): SideQuestItem => ({ phase: 'Plan', text })
  ),
  ...sectionBullets(harden, 'Remaining').map(
    (text): SideQuestItem => ({ phase: 'Harden', text })
  ),
];
