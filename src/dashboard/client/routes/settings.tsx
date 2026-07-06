import type { SettingsTab } from '@/types/dashboard/client';
import type { ComponentType, VNode } from 'preact';
import { useLocation } from 'preact-iso';
import { useState } from 'preact/hooks';
import { BANNER_CHIP, PageHeader } from '../components/page-header';
import { Icon } from '../components/primitives/icons';
import { InstallTab } from '../components/settings/install-tab';
import { PullTab } from '../components/settings/pull-tab';
import { SpecializationsTab } from '../components/settings/specializations-tab';
import { initialTab, TabBar } from '../components/settings/tab-bar';
import { UpdateTab } from '../components/settings/update-tab';
import { useData } from '../data/state';
import { AGENTS, isLocked } from '../domain/install';

const TAB_VIEW: Record<SettingsTab, ComponentType> = {
  install: InstallTab,
  pull: PullTab,
  update: UpdateTab,
  specializations: SpecializationsTab,
};

export const Settings = (): VNode => {
  const { query } = useLocation();
  const locked = isLocked(useData().install);
  const [tab, setTab] = useState<SettingsTab>(initialTab(query.tab));
  const active = locked ? 'install' : tab;
  const View = TAB_VIEW[active];

  return (
    <>
      <PageHeader
        background='https://bluespec.weslley.io/img/docs/banner-5.png'
        eyebrow='Configuration'
        title='Settings'
        description='Install, update, and shape Blue Spec for this project.'
        actions={
          <span class={BANNER_CHIP}>
            <span class='inline-flex text-white/80'>
              <Icon name='package' />
            </span>
            <span class='tabular-nums'>{AGENTS.length}</span> agents
          </span>
        }
      />

      <TabBar
        active={active}
        only={locked ? 'install' : undefined}
        onSelect={setTab}
      />

      <View key={active} />
    </>
  );
};
