import type { VNode } from 'preact';
import { FindingTable } from '../components/findings/finding-table';
import { Hotspots } from '../components/overview/hotspots';
import { InstallStatus } from '../components/overview/install-status';
import { NextStep } from '../components/overview/next-step';
import { SectionHead } from '../components/overview/section-head';
import { Surfaces } from '../components/overview/surfaces';
import { BannerButton, PageHeader } from '../components/page-header';
import { useData } from '../data/state';
import { countFindings } from '../selectors/counts';
import { postureState } from '../selectors/overview';

export const Overview = (): VNode => {
  const data = useData();
  const counts = countFindings(data.findings);
  const posture = postureState(data.project, counts);

  return (
    <>
      <PageHeader
        background='https://bluespec.weslley.io/img/docs/banner-1.png'
        eyebrow='Security posture'
        title={posture.headline}
        description={posture.subline}
        actions={<BannerButton href='/findings' label='Review findings' />}
      />

      <div class='route-rise'>
        <InstallStatus install={data.install} />

        <NextStep phases={data.phases} install={data.install} />

        {data.findings.length > 0 && (
          <section class='mb-6'>
            <SectionHead
              title='The chain'
              link={{ href: '/findings', label: 'See all' }}
            />
            <FindingTable findings={data.findings} />
          </section>
        )}

        <div class='mb-6 grid items-stretch gap-6 min-[1280px]:grid-cols-2'>
          <Surfaces skills={data.skills} findings={data.findings} />
          <Hotspots findings={data.findings} />
        </div>
      </div>
    </>
  );
};
