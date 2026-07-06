import type { Finding, Skill } from '@/types/dashboard/dashboard';
import type { VNode } from 'preact';
import { SkillIcon } from '../findings/skill-icon';
import { ListCard, ListRow } from '../primitives/list-card';
import { SectionHead } from './section-head';

export const Surfaces = (props: {
  skills: Skill[];
  findings: Finding[];
}): VNode | null => {
  const applied = props.skills.filter((skill) => skill.applied);
  if (applied.length === 0) return null;

  const rows = applied
    .map((skill) => ({
      skill,
      count: props.findings.filter((finding) =>
        finding.skills.some((used) => used.name === skill.name)
      ).length,
    }))
    .sort((left, right) => right.count - left.count);

  return (
    <section class='flex min-w-0 flex-col'>
      <SectionHead
        title='Detected surfaces'
        link={{ href: '/skills', label: 'All skills' }}
      />
      <ListCard>
        {rows.map(({ skill, count }) => (
          <ListRow title={skill.surfaced}>
            <span class='grid size-8.5 flex-none place-items-center rounded-sm bg-accent-soft text-[1.05rem] text-accent'>
              <SkillIcon name={skill.name} />
            </span>
            <span class='min-w-0 flex-1 truncate text-[0.82rem] font-bold'>
              {skill.label}
            </span>
            <span class='flex flex-none items-baseline gap-1.5'>
              <span
                class={`text-[0.8rem] font-bold tabular-nums ${count === 0 ? 'text-faint' : ''}`}
              >
                {count}
              </span>
              <span class='text-[0.76rem] text-muted'>
                {count === 1 ? 'finding' : 'findings'}
              </span>
            </span>
          </ListRow>
        ))}
      </ListCard>
    </section>
  );
};
