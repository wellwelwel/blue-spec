import type {
  DocsGlobalData,
  DocsSidebarCategory,
  DocsSidebarEntry,
  DocsSidebarLink,
} from '@site/plugins/docs-content';
import { usePluginData } from '@docusaurus/useGlobalData';

export type DocContext = {
  eyebrow: string;
  banner: string;
  previous: DocsSidebarLink | undefined;
  next: DocsSidebarLink | undefined;
};

export const useDocsData = (): DocsGlobalData => {
  const data = usePluginData('lagune-docs-content');
  return data as DocsGlobalData;
};

const isCategory = (entry: DocsSidebarEntry): entry is DocsSidebarCategory =>
  entry.type === 'category';

export const flattenSidebar = (
  sidebar: DocsSidebarEntry[]
): DocsSidebarLink[] =>
  sidebar.flatMap((entry) => (isCategory(entry) ? entry.items : [entry]));

export const findDocContext = (
  sidebar: DocsSidebarEntry[],
  docId: string
): DocContext => {
  const links = flattenSidebar(sidebar);
  const position = links.findIndex((link) => link.docId === docId);

  const owner = sidebar.findIndex((entry) =>
    isCategory(entry)
      ? entry.items.some((link) => link.docId === docId)
      : entry.docId === docId
  );
  const entry = owner === -1 ? undefined : sidebar[owner];

  return {
    eyebrow: entry && isCategory(entry) ? entry.label : 'Documentation',
    banner: `/img/docs/banner-${(Math.max(owner, 0) % 5) + 1}.png`,
    previous: position > 0 ? links[position - 1] : undefined,
    next:
      position !== -1 && position < links.length - 1
        ? links[position + 1]
        : undefined,
  };
};
