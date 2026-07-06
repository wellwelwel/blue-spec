import type { IconName, SeverityFilter } from '@/types/dashboard/client';
import type { Severity } from '@/types/dashboard/dashboard';
import { SEVERITY_ORDER } from '@/dashboard/shared/severity';
import { SOFT_TONE } from '../utils/tailwind-classes';

export const SEVERITY_PRESENTATION: Record<
  Severity,
  { icon: IconName; tone: string; dot: string }
> = {
  Critical: { icon: 'flame', tone: SOFT_TONE.red, dot: 'bg-red' },
  High: { icon: 'alertTriangle', tone: SOFT_TONE.amber, dot: 'bg-amber' },
  Medium: { icon: 'layers', tone: SOFT_TONE.blue, dot: 'bg-blue' },
  Low: { icon: 'checkCircle', tone: SOFT_TONE.teal, dot: 'bg-teal' },
  Unranked: {
    icon: 'shield',
    tone: 'bg-surface-2 text-muted',
    dot: 'bg-faint',
  },
};

export const severityIcon = (severity: Severity): IconName =>
  SEVERITY_PRESENTATION[severity].icon;

export const severityTone = (severity: Severity): string =>
  SEVERITY_PRESENTATION[severity].tone;

export const severityDot = (severity: Severity): string =>
  SEVERITY_PRESENTATION[severity].dot;

export const SEVERITY_FILTERS: SeverityFilter[] = ['All', ...SEVERITY_ORDER];
