import type { Finding } from '@/types/dashboard/dashboard';
import type { VNode } from 'preact';
import { hotspots } from '../../selectors/hotspots';
import { SeverityDot } from '../findings/severity';
import { Icon } from '../primitives/icons';
import { ListCard, ListRow } from '../primitives/list-card';
import { SectionHead } from './section-head';

export const Hotspots = (props: { findings: Finding[] }): VNode | null => {
  const spots = hotspots(props.findings);
  if (spots.length === 0) return null;

  return (
    <section class='flex min-w-0 flex-col'>
      <SectionHead title='Hotspots' hint='findings per file' />
      <ListCard>
        {spots.map((spot) => (
          <ListRow>
            <span class='grid size-8.5 flex-none place-items-center rounded-sm bg-surface-2 text-[1.05rem] text-muted'>
              <Icon name='file' />
            </span>
            <span class='min-w-0 flex-1 truncate font-mono text-[0.78rem] font-semibold'>
              {spot.path}
            </span>
            <span class='flex flex-none items-center gap-1.25'>
              {spot.severities.map((severity) => (
                <SeverityDot severity={severity} />
              ))}
            </span>
            <span class='w-4 text-right text-[0.8rem] font-bold tabular-nums'>
              {spot.severities.length}
            </span>
          </ListRow>
        ))}
      </ListCard>
    </section>
  );
};
