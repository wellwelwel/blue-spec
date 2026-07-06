import type { ActionRunState, RunButton } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { runSpecialize } from '../../data/api';
import { modal, useData } from '../../data/state';
import { CATEGORIES } from '../../domain/install';
import { actionFailed, useRunAction } from '../../hooks/use/run-action';
import { classes, GROUP_HEAD } from '../../utils/tailwind-classes';
import { Icon } from '../primitives/icons';
import { SearchField } from '../primitives/search-field';
import { ManageCategoryRow } from './tiles';

const RUN_BUTTON: Record<ActionRunState, RunButton> = {
  idle: { icon: 'refresh', label: 'Update specializations' },
  pending: { icon: 'refresh', label: 'Applying…' },
  success: { icon: 'check', label: 'Applied' },
  error: { icon: 'refresh', label: 'Update specializations' },
};

export const SpecializationsTab = (): VNode => {
  const data = useData();
  const [installed, setInstalled] = useState<string[]>(data.install.categories);
  const [manageQuery, setManageQuery] = useState('');
  const { run, setRun, button, trigger } = useRunAction(RUN_BUTTON);

  const toggleInstalled = (key: string) => {
    if (run === 'pending') return;

    setInstalled((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
    setRun('idle');
  };

  const apply = () => {
    modal.value = { kind: 'specialize', run: 'pending', added: 0, removed: 0 };

    trigger(async () => {
      const response = await runSpecialize({ categories: installed });
      const succeeded = response.ok && 'added' in response;

      modal.value = {
        kind: 'specialize',
        run: succeeded ? 'success' : 'error',
        added: succeeded ? response.added : 0,
        removed: succeeded ? response.removed : 0,
      };

      return response;
    });
  };

  const manageSkills = useMemo(() => {
    const term = manageQuery.trim().toLowerCase();
    if (!term) return CATEGORIES;
    return CATEGORIES.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        category.description.toLowerCase().includes(term)
    );
  }, [manageQuery]);

  const manifestChanged = useMemo(() => {
    const manifest = new Set(data.install.categories);
    return (
      installed.length !== manifest.size ||
      installed.some((key) => !manifest.has(key))
    );
  }, [installed, data.install.categories]);

  return (
    <div class='route-rise'>
      <section class='rounded-xl bg-surface p-6 shadow-card'>
        <div class={`${GROUP_HEAD} min-h-10`}>
          Manage specializations
          <button
            class={classes(
              'ml-auto flex h-10 items-center gap-2.5 rounded-md border-0 bg-accent pr-5 pl-4.5 text-[0.8rem] font-bold text-white transition-[background-color,opacity,scale] duration-200 hover:bg-accent-3 disabled:cursor-default disabled:opacity-70',
              manifestChanged
                ? 'scale-100 cursor-pointer opacity-100'
                : 'pointer-events-none scale-95 opacity-0'
            )}
            type='button'
            tabIndex={manifestChanged ? 0 : -1}
            aria-hidden={!manifestChanged}
            disabled={run === 'pending'}
            onClick={apply}
          >
            <span
              class={`inline-flex text-[0.95rem] ${run === 'pending' ? 'animate-spin' : ''}`}
            >
              <Icon name={button.icon} />
            </span>
            {button.label}
          </button>
        </div>
        {run === 'error' && (
          <p class='mb-3 text-right text-[0.8rem] text-red'>
            {actionFailed('Update')}
          </p>
        )}
        <p class='mb-4 text-[0.82rem] leading-[1.5] text-muted text-pretty'>
          On-demand security knowledge, by category. Add the ones that fit this
          project, remove the ones that do not.
        </p>
        <SearchField
          placeholder='Search specializations'
          query={manageQuery}
          onQuery={setManageQuery}
        />
        {manageSkills.length > 0 ? (
          <div class='grid grid-cols-2 gap-2.5 min-[1280px]:grid-cols-3 min-[1600px]:grid-cols-4'>
            {manageSkills.map((category) => (
              <ManageCategoryRow
                key={category.key}
                category={category}
                on={installed.includes(category.key)}
                onToggle={() => toggleInstalled(category.key)}
              />
            ))}
          </div>
        ) : (
          <p class='py-8 text-center text-[0.85rem] text-faint'>
            No specializations match “{manageQuery.trim()}”.
          </p>
        )}
      </section>
    </div>
  );
};
