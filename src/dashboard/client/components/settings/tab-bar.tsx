import type { SettingsTab, SettingsTabItem } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { Tabs } from '../primitives/tabs';

export const SETTINGS_TABS: SettingsTabItem[] = [
  { key: 'install', label: 'Install', icon: 'package' },
  { key: 'pull', label: 'Pull', icon: 'pullDown' },
  { key: 'update', label: 'Update', icon: 'upgrade' },
  { key: 'specializations', label: 'Specializations', icon: 'graduationCap' },
];

export const initialTab = (value: string | undefined): SettingsTab =>
  SETTINGS_TABS.find((item) => item.key === value)?.key ?? 'install';

const isSettingsTab = (value: string): value is SettingsTab =>
  SETTINGS_TABS.some((item) => item.key === value);

export const TabBar = (props: {
  active: SettingsTab;
  only?: SettingsTab;
  onSelect: (tab: SettingsTab) => void;
}): VNode => (
  <div class='route-fade mb-5'>
    <Tabs
      items={SETTINGS_TABS}
      active={props.active}
      only={props.only}
      onSelect={(key) => isSettingsTab(key) && props.onSelect(key)}
    />
  </div>
);
