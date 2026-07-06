import type { Severity } from '@/types/dashboard/dashboard';
import type { VNode } from 'preact';
import { severityDot, severityIcon, severityTone } from '../../domain/severity';
import { BADGE, BADGE_IC } from '../../utils/tailwind-classes';
import { Icon } from '../primitives/icons';

export const SeverityDot = (props: { severity: Severity }): VNode => (
  <span
    class={`size-2.25 flex-none rounded-full ${severityDot(props.severity)}`}
  />
);

export const SeverityIcon = (props: { severity: Severity }): VNode => (
  <Icon name={severityIcon(props.severity)} />
);

export const SeverityTag = (props: { severity: Severity }): VNode => (
  <span
    class={`${BADGE} font-bold uppercase tracking-[0.03em] ${severityTone(props.severity)}`}
  >
    <span class={BADGE_IC}>
      <SeverityIcon severity={props.severity} />
    </span>
    {props.severity}
  </span>
);
