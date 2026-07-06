import type { Skill } from '@/types/dashboard/dashboard';
import type { VNode } from 'preact';
import {
  catalogSkillNames,
  skillDescription,
  skillGroups,
  skillLabel,
  skillPromptSpec,
} from '@/dashboard/shared/skill-meta';
import { SkillIcon } from '../components/findings/skill-icon';
import { BannerButton, PageHeader } from '../components/page-header';
import { CopyButton } from '../components/primitives/copy-button';
import { Icon } from '../components/primitives/icons';
import { MaskIcon } from '../components/primitives/mask-icon';
import { PromptPreview } from '../components/prompt/preview';
import { useData } from '../data/state';
import { BADGE, classes, MICRO_LABEL } from '../utils/tailwind-classes';

const SkillCard = ({
  skill,
  seed,
  installed = true,
}: {
  skill: Skill;
  seed: number;
  installed?: boolean;
}): VNode => {
  const installedGroups = new Set(useData().install.categories);
  return (
    <article
      class={classes(
        'group/eg-host flex flex-col overflow-hidden rounded-lg',
        installed
          ? 'bg-surface shadow-card'
          : 'border border-dashed border-line-2 bg-surface/50'
      )}
    >
      <header class='flex items-center gap-3 p-4.5 pb-3.5'>
        <span
          class={classes(
            'grid size-8 flex-none place-items-center rounded-md text-[1rem] ring-1 ring-offset-2 ring-offset-surface',
            skill.applied
              ? 'bg-accent-soft text-accent ring-accent/15'
              : 'bg-surface-2 text-faint ring-line-2'
          )}
        >
          <SkillIcon name={skill.name} />
        </span>
        <h3
          class={classes(
            'min-w-0 flex-1 truncate text-[0.9rem] font-bold tracking-[-0.01em]',
            skill.applied ? 'text-accent' : 'text-ink-2'
          )}
        >
          {skill.label}
        </h3>
        {skill.applied && (
          <span
            class={`${BADGE} flex-none font-bold uppercase tracking-[0.03em] bg-accent-soft text-accent`}
          >
            Applied
          </span>
        )}
      </header>
      <p
        class={classes(
          'px-4.5 text-[0.82rem] leading-normal',
          skill.applied ? 'text-muted' : 'text-faint'
        )}
      >
        {skillDescription(skill.name)}
      </p>
      <div class='flex flex-1 items-end justify-between gap-3 px-4.5 pt-3 pb-4.5'>
        <div class='flex flex-wrap items-end content-end gap-1.5'>
          {skillGroups(skill.name).map((group) => (
            <span
              class={classes(
                'group/chip relative grid size-8 place-items-center rounded-sm',
                installedGroups.has(group.key)
                  ? 'bg-accent-soft text-accent'
                  : 'bg-surface-2 text-faint'
              )}
            >
              <MaskIcon src={group.icon} class='size-4 bg-current' />
              <span class='pointer-events-none absolute bottom-[calc(100%+0.375rem)] left-1/2 -translate-x-1/2 translate-y-1 scale-95 whitespace-nowrap rounded-sm bg-dark px-2 py-1 text-[0.68rem] font-bold text-white opacity-0 transition-[opacity,scale,translate] duration-200 ease-house group-hover/chip:translate-y-0 group-hover/chip:scale-100 group-hover/chip:opacity-100'>
                {group.label}
              </span>
            </span>
          ))}
        </div>
        <PromptPreview spec={skillPromptSpec(skill)} seed={seed} />
      </div>
      {installed ? (
        <div class='flex flex-col gap-1 border-t border-line bg-surface-2 px-4.5 py-0.5'>
          <div class='flex items-center gap-2'>
            <span class='inline-flex flex-none text-[0.9rem] text-faint'>
              <Icon name='messageAi' />
            </span>
            <code class='min-w-0 flex-1 truncate border-0 bg-transparent p-0 font-mono text-[0.72rem] font-semibold text-[#6b737a]'>
              @.bluespec/skills/{skill.name}.md
            </code>
            <CopyButton
              text={`@.bluespec/skills/${skill.name}.md`}
              label={`Copy path for ${skill.label}`}
            />
          </div>
        </div>
      ) : (
        <a
          class='flex items-center gap-2 border-t border-dashed border-line-2 px-4.5 py-2.75 text-[0.72rem] font-bold text-faint no-underline transition-colors hover:text-accent'
          href='/settings?tab=specializations'
        >
          <span class='inline-flex flex-none text-[0.9rem]'>
            <Icon name='package' />
          </span>
          <span class='flex-1'>Not installed</span>
          <span class='inline-flex flex-none text-[0.8rem]'>
            <Icon name='arrowUpRight' />
          </span>
        </a>
      )}
    </article>
  );
};

const SkillGrid = ({
  skills,
  seedOffset = 0,
  installed = true,
}: {
  skills: Skill[];
  seedOffset?: number;
  installed?: boolean;
}): VNode => (
  <div class='grid grid-cols-2 gap-4 min-[1720px]:grid-cols-3'>
    {skills.map((skill, index) => (
      <SkillCard
        skill={skill}
        seed={seedOffset + index}
        installed={installed}
      />
    ))}
  </div>
);

export const Skills = (): VNode => {
  const data = useData();
  const applied = data.skills.filter((skill) => skill.applied);
  const installedSkills = data.skills.filter((skill) => !skill.applied);
  const present = new Set(data.skills.map((skill) => skill.name));
  const available: Skill[] = catalogSkillNames()
    .filter((name) => !present.has(name))
    .map((name) => ({ name, label: skillLabel(name), applied: false }));
  return (
    <>
      <PageHeader
        background='https://bluespec.weslley.io/img/docs/banner-4.png'
        eyebrow='Knowledge'
        title='Skills'
        description='Security skills applied, installed, and available for this project.'
        actions={
          <BannerButton
            href='/settings?tab=specializations'
            label='Manage specializations'
          />
        }
      />
      <div class='route-rise flex flex-col gap-6'>
        {applied.length > 0 && (
          <section class='flex flex-col gap-3'>
            <h2 class={MICRO_LABEL}>Applied</h2>
            <SkillGrid skills={applied} seedOffset={0} />
          </section>
        )}
        {installedSkills.length > 0 && (
          <section class='flex flex-col gap-3'>
            <h2 class={MICRO_LABEL}>Installed</h2>
            <SkillGrid skills={installedSkills} seedOffset={applied.length} />
          </section>
        )}
        {available.length > 0 && (
          <section class='flex flex-col gap-3'>
            <h2 class={MICRO_LABEL}>Not installed</h2>
            <SkillGrid
              skills={available}
              seedOffset={applied.length + installedSkills.length}
              installed={false}
            />
          </section>
        )}
      </div>
    </>
  );
};
