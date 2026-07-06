import type { Finding } from '@/types/dashboard/dashboard';
import type { VNode } from 'preact';
import { useData } from '../../data/state';
import { countFindings, phasePercent } from '../../selectors/counts';
import { nextToVerify } from '../../selectors/verify';
import { formatDate } from '../../utils/format';
import { findingHref } from '../../utils/links';
import { CARD_TITLE } from '../../utils/tailwind-classes';
import { SeverityDot } from '../findings/severity';
import { Icon } from '../primitives/icons';
import { ProgressRing } from '../primitives/progress-ring';

const RAIL_BLOCK = 'rounded-lg bg-surface-2 p-4.5';
const RAIL_HEAD = 'mb-4 flex items-baseline justify-between gap-3';
const RAIL_HINT = 'text-[0.76rem] font-semibold text-muted';

const VerifyNext = (props: { findings: Finding[] }): VNode | null => {
  const queue = nextToVerify(props.findings);
  if (queue === null) return null;
  const { next, pending, blocking } = queue;

  return (
    <div class={RAIL_BLOCK}>
      <div class={RAIL_HEAD}>
        <h3 class={CARD_TITLE}>Verify next</h3>
        {pending.length > 1 && (
          <span class={RAIL_HINT}>{pending.length - 1} more waiting</span>
        )}
      </div>
      <a
        class='flex items-start gap-2.5 rounded-md bg-surface p-3.5 text-inherit no-underline shadow-card transition-shadow duration-220 hover:shadow-pop'
        href={findingHref(next.id)}
      >
        <span class='mt-1 inline-flex'>
          <SeverityDot severity={next.severity} />
        </span>
        <span class='min-w-0 flex-1'>
          <span class='clamp-2 text-[0.82rem] font-bold leading-[1.35]'>
            {next.name}
          </span>
          <span class='mt-1 block text-[0.76rem] text-muted'>
            {blocking > 0
              ? `${blocking} other ${blocking === 1 ? 'fix depends' : 'fixes depend'} on this one`
              : 'Highest severity in the queue'}
          </span>
        </span>
        <span class='inline-flex text-[0.95rem] text-accent'>
          <Icon name='arrowUpRight' />
        </span>
      </a>
    </div>
  );
};

const RunTimeline = (): VNode => {
  const data = useData();
  const counts = countFindings(data.findings);
  const verified = counts.total > 0 && counts.verified === counts.total;
  const steps = [
    { label: 'Mapped', detail: formatDate(data.dates.mapped) },
    { label: 'Planned', detail: formatDate(data.dates.planned) },
    { label: 'Hardened', detail: formatDate(data.dates.hardened) },
    { label: 'Verified', detail: verified ? 'Complete' : null },
  ];

  return (
    <div class={RAIL_BLOCK}>
      <div class={RAIL_HEAD}>
        <h3 class={CARD_TITLE}>This run</h3>
        {data.scope && (
          <span class={`${RAIL_HINT} truncate`}>{data.scope}</span>
        )}
      </div>
      <div class='relative'>
        <span
          class='absolute top-2.5 bottom-2.5 left-1.25 w-px bg-line-2'
          aria-hidden='true'
        />
        {steps.map((step) => (
          <div class='relative flex items-center gap-3 py-2'>
            <span
              class={`z-1 size-2.75 flex-none rounded-full ring-4 ring-surface-2 ${
                step.detail ? 'bg-accent' : 'bg-faint'
              }`}
            />
            <span class='flex-1 text-[0.82rem] font-bold'>{step.label}</span>
            <span class='text-[0.76rem] font-semibold text-muted tabular-nums'>
              {step.detail ?? 'Pending'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Installed = (): VNode | null => {
  const { version, running } = useData().install;
  if (!version) return null;

  const updateAvailable = running !== null && running !== version;

  return (
    <div class={RAIL_BLOCK}>
      <div class='flex items-baseline justify-between gap-3'>
        <h3 class={CARD_TITLE}>Installed</h3>
        <span class={`${RAIL_HINT} tabular-nums`}>v{version}</span>
      </div>
      {updateAvailable && (
        <a
          class='group mt-4 flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2.5 text-[0.8rem] font-bold text-white no-underline transition-[background-color] duration-200 hover:bg-accent-3'
          href='/settings?tab=update'
        >
          <span class='relative grid size-[1rem] flex-none place-items-center overflow-hidden text-[1rem]'>
            <span class='col-start-1 row-start-1 inline-flex transition-transform duration-300 ease-house group-hover:-translate-y-[120%]'>
              <Icon name='arrowUp' />
            </span>
            <span class='col-start-1 row-start-1 inline-flex translate-y-[120%] transition-transform duration-300 ease-house group-hover:translate-y-0'>
              <Icon name='arrowUp' />
            </span>
          </span>
          <span>
            Update to <span class='tabular-nums'>v{running}</span>
          </span>
        </a>
      )}
    </div>
  );
};

export const RightRail = (): VNode => {
  const data = useData();
  const percent = phasePercent(data.phases);
  const counts = countFindings(data.findings);
  const current = data.phases.find((phase) => phase.state === 'current');

  return (
    <aside class='flex min-h-0 flex-col'>
      <div class='flex flex-col gap-5 rounded-2xl bg-surface px-5.5 py-6 shadow-card min-[1280px]:scroll-slim min-[1280px]:min-h-0 min-[1280px]:flex-1 min-[1280px]:overflow-y-auto'>
        <div class='flex flex-col items-center gap-1 py-1.5 text-center'>
          <ProgressRing percent={percent} centerIcon='shieldCheck' />
          <div class='mt-2.5 text-[0.95rem] font-extrabold tracking-[-0.01em]'>
            {current ? `${current.name} in progress` : 'Chain at rest'}
          </div>
          <p class='max-w-57.5 text-[0.8rem] text-muted'>
            {counts.applied} of {counts.total} hardened · {counts.verified}{' '}
            verified
          </p>
        </div>

        <VerifyNext findings={data.findings} />
        <RunTimeline />
        <Installed />
      </div>
    </aside>
  );
};
