import type { DocEntry } from '@site/plugins/docs-content';
import type { ComponentType, ReactNode } from 'react';
import type { DocTocItem } from '../Toc';
import { PageMetadata } from '@docusaurus/theme-common';
import MDXContent from '@theme/MDXContent';
import { findDocContext, useDocsData } from '../data';
import { DocsPagination } from '../Pagination';
import { DocsShell } from '../Shell';
import { DocsSmallPrint } from '../SmallPrint';
import { DocsToc } from '../Toc';

type DocContent = ComponentType<Record<string, unknown>> & {
  frontMatter: { keywords?: string[] };
  metadata: DocEntry;
  toc: DocTocItem[];
};

type DocPageProps = {
  content: DocContent;
};

export default function DocPage({ content: Content }: DocPageProps): ReactNode {
  const { metadata, frontMatter } = Content;
  const { sidebar } = useDocsData();
  const context = findDocContext(sidebar, metadata.docId);

  return (
    <DocsShell rail={<DocsToc toc={Content.toc} />}>
      <PageMetadata
        title={metadata.title}
        description={metadata.description}
        keywords={frontMatter.keywords}
      />
      <section className='lagune-docs-route-fade relative mb-5 flex-none overflow-hidden rounded-card bg-banner px-5 py-6 text-white shadow-card sm:px-9 sm:py-7.5'>
        <img
          className='lagune-docs-route-rise pointer-events-none absolute inset-0 z-0 size-full object-cover mask-[linear-gradient(to_right,transparent,rgba(0,0,0,0.35)_38%,black)]'
          src={context.banner}
          alt=''
          aria-hidden='true'
        />
        <span className='pointer-events-none absolute inset-0 z-1 bg-linear-to-r from-banner via-banner/85 to-banner/40' />
        <div className='relative z-2 max-w-145'>
          <span className='text-[0.7rem] font-bold uppercase tracking-[0.14em] text-white/82'>
            {context.eyebrow}
          </span>
          <h1 className='mt-2.5 text-[1.45rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-balance text-white sm:text-[1.7rem]'>
            {metadata.title}
          </h1>
          {metadata.description && (
            <p className='mt-2.5 mb-0 text-[0.85rem] text-pretty text-white/90'>
              {metadata.description}
            </p>
          )}
        </div>
      </section>
      <article className='lagune-docs-route-rise markdown rounded-card bg-surface px-5 py-6 shadow-card sm:px-9 sm:py-8'>
        <MDXContent>
          <Content />
        </MDXContent>
      </article>
      <DocsPagination previous={context.previous} next={context.next} />
      <DocsSmallPrint />
    </DocsShell>
  );
}
