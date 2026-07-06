import type { VNode } from 'preact';
import { skillIconName } from '@/dashboard/shared/skill-meta';
import { Icon } from '../primitives/icons';

export const SkillIcon = (props: { name: string }): VNode => (
  <Icon name={skillIconName(props.name)} />
);
