import type { PluginModule } from '@docusaurus/types';
import type { DocsNavEntry } from './nav';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createMDXLoaderRule } from '@docusaurus/mdx-loader';
import {
  addTrailingPathSeparator,
  aliasedSitePath,
  docuHash,
  Globby,
  parseMarkdownFile,
} from '@docusaurus/utils';
import { docsThemeBootScript } from '../../src/components/docs/theme';
import { docsNav } from './nav';

export type DocEntry = {
  docId: string;
  permalink: string;
  source: string;
  title: string;
  sidebarLabel: string;
  description: string | undefined;
};

export type DocsSidebarLink = {
  type: 'link';
  docId: string;
  label: string;
  permalink: string;
};

export type DocsSidebarCategory = {
  type: 'category';
  label: string;
  collapsed: boolean;
  items: DocsSidebarLink[];
};

export type DocsSidebarEntry = DocsSidebarLink | DocsSidebarCategory;

export type DocsGlobalData = {
  sidebar: DocsSidebarEntry[];
  docs: DocEntry[];
};

const pluginName = 'lagune-docs-content';
const docPageComponent = '@site/src/components/docs/DocPage/index.tsx';

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const joinRoutePath = (...segments: string[]): string =>
  `/${segments
    .flatMap((segment) => segment.split('/'))
    .filter(Boolean)
    .join('/')}`;

const resolvePermalink = ({
  baseUrl,
  docId,
  slug,
}: {
  baseUrl: string;
  docId: string;
  slug: string | undefined;
}): string => {
  if (slug === undefined) return joinRoutePath(baseUrl, 'docs', docId);
  if (slug.startsWith('/')) return joinRoutePath(baseUrl, 'docs', slug);

  const parentDirectory = path.posix.dirname(docId);
  const directory = parentDirectory === '.' ? '' : parentDirectory;

  return joinRoutePath(baseUrl, 'docs', directory, slug);
};

const buildSidebar = (docs: DocEntry[]): DocsSidebarEntry[] => {
  const docsById = new Map(docs.map((doc) => [doc.docId, doc]));

  const toLink = (docId: string): DocsSidebarLink => {
    const doc = docsById.get(docId);

    if (!doc)
      throw new Error(
        `[${pluginName}] The sidebar references the doc id "${docId}", but no MDX file matches it.`
      );

    return {
      type: 'link',
      docId: doc.docId,
      label: doc.sidebarLabel,
      permalink: doc.permalink,
    };
  };

  const toEntry = (entry: DocsNavEntry): DocsSidebarEntry => {
    if (typeof entry === 'string') return toLink(entry);

    return {
      type: 'category',
      label: entry.label,
      collapsed: entry.collapsed ?? true,
      items: entry.items.map(toLink),
    };
  };

  return docsNav.map(toEntry);
};

export const docsContentPlugin: PluginModule = async (context) => {
  const { siteConfig, siteDir, generatedFilesDir, baseUrl } = context;
  const contentPath = path.resolve(siteDir, 'docs');
  const dataDir = path.join(generatedFilesDir, pluginName, 'default');

  const readDoc = async (relativeFile: string): Promise<DocEntry> => {
    const filePath = path.join(contentPath, relativeFile);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const { frontMatter, contentTitle } = await parseMarkdownFile({
      filePath,
      fileContent,
      parseFrontMatter: siteConfig.markdown.parseFrontMatter,
    });

    const relativeId = relativeFile.replace(/\.mdx?$/, '');
    const parentDirectory = path.posix.dirname(relativeId);
    const baseName =
      asString(frontMatter.id) ?? path.posix.basename(relativeId);
    const docId =
      parentDirectory === '.'
        ? baseName
        : path.posix.join(parentDirectory, baseName);

    const title = asString(frontMatter.title) ?? contentTitle ?? docId;

    return {
      docId,
      permalink: resolvePermalink({
        baseUrl,
        docId,
        slug: asString(frontMatter.slug),
      }),
      source: aliasedSitePath(filePath, siteDir),
      title,
      sidebarLabel: asString(frontMatter.sidebar_label) ?? title,
      description: asString(frontMatter.description),
    };
  };

  const mdxLoaderRule = await createMDXLoaderRule({
    include: [addTrailingPathSeparator(contentPath)],
    options: {
      useCrossCompilerCache: siteConfig.future.faster.mdxCrossCompilerCache,
      admonitions: true,
      staticDirs: siteConfig.staticDirectories.map((directory) =>
        path.resolve(siteDir, directory)
      ),
      siteDir,
      isMDXPartial: (filePath) => path.basename(filePath).startsWith('_'),
      metadataPath: (mdxPath) =>
        path.join(
          dataDir,
          `${docuHash(aliasedSitePath(mdxPath, siteDir))}.json`
        ),
      markdownConfig: siteConfig.markdown,
    },
  });

  let loadedDocs: DocEntry[] = [];

  return {
    name: pluginName,

    getPathsToWatch: () => [`${contentPath}/**/*.{md,mdx}`],

    loadContent: async () => {
      const relativeFiles = await Globby(['**/*.{md,mdx}'], {
        cwd: contentPath,
      });
      const visibleFiles = relativeFiles
        .filter((relativeFile) => !path.basename(relativeFile).startsWith('_'))
        .sort();

      loadedDocs = await Promise.all(visibleFiles.map(readDoc));

      return { docs: loadedDocs };
    },

    contentLoaded: async ({ actions }) => {
      const { addRoute, createData, setGlobalData } = actions;

      await Promise.all(
        loadedDocs.map(async (doc) => {
          await createData(`${docuHash(doc.source)}.json`, doc);

          addRoute({
            path: doc.permalink,
            component: docPageComponent,
            exact: true,
            modules: { content: doc.source },
          });
        })
      );

      setGlobalData({
        sidebar: buildSidebar(loadedDocs),
        docs: loadedDocs,
      } satisfies DocsGlobalData);
    },

    configureWebpack: () => ({
      module: { rules: [mdxLoaderRule] },
    }),

    injectHtmlTags: () => ({
      headTags: [
        {
          tagName: 'script',
          innerHTML: docsThemeBootScript,
        },
      ],
    }),
  };
};
