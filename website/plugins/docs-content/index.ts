import type { PluginModule } from '@docusaurus/types';
import type { DocsNavEntry } from './nav';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createMDXLoaderRule } from '@docusaurus/mdx-loader';
import {
  addTrailingPathSeparator,
  aliasedSitePath,
  aliasedSitePathToRelativePath,
  docuHash,
  getFileCommitDate,
  Globby,
  parseMarkdownFile,
} from '@docusaurus/utils';
import { docsThemeBootScript } from '../../src/components/docs/theme';
import { renderDocMarkdown } from './markdown';
import { docsNav } from './nav';

export type DocEntry = {
  docId: string;
  permalink: string;
  source: string;
  title: string;
  sidebarLabel: string;
  description: string | undefined;
  datePublished: string | undefined;
  dateModified: string | undefined;
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

const orderDocsByNav = (docs: DocEntry[]): DocEntry[] => {
  const docsById = new Map(docs.map((doc) => [doc.docId, doc]));
  const navIds = docsNav.flatMap((entry) =>
    typeof entry === 'string' ? [entry] : entry.items
  );
  const inNav = navIds.flatMap((docId) => {
    const doc = docsById.get(docId);
    return doc ? [doc] : [];
  });
  const seen = new Set(inNav.map((doc) => doc.docId));
  const rest = docs
    .filter((doc) => !seen.has(doc.docId))
    .sort((a, b) => a.permalink.localeCompare(b.permalink));

  return [...inNav, ...rest];
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

    let datePublished: string | undefined;
    let dateModified: string | undefined;
    try {
      datePublished = (
        await getFileCommitDate(filePath, { age: 'oldest' })
      ).date.toISOString();
      dateModified = (
        await getFileCommitDate(filePath, { age: 'newest' })
      ).date.toISOString();
    } catch {
      datePublished = undefined;
      dateModified = undefined;
    }

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
      datePublished,
      dateModified,
    };
  };

  const mdxLoaderRule = await createMDXLoaderRule({
    include: [addTrailingPathSeparator(contentPath)],
    options: {
      useCrossCompilerCache: siteConfig.future.faster.mdxCrossCompilerCache,
      admonitions: true,
      removeContentTitle: true,
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
            metadata: {
              sourceFilePath: path.join(
                siteDir,
                aliasedSitePathToRelativePath(doc.source)
              ),
            },
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

    postBuild: async ({ outDir }) => {
      const site = siteConfig.url;
      const ordered = orderDocsByNav(loadedDocs);

      const markdownDocs = await Promise.all(
        ordered.map(async (doc) => {
          const sourceFile =
            doc.docId === 'references/paper'
              ? path.join(siteDir, 'src', 'content', 'PAPER.mdx')
              : path.join(siteDir, aliasedSitePathToRelativePath(doc.source));
          const body = await fs.readFile(sourceFile, 'utf8');

          return { doc, markdown: renderDocMarkdown({ ...doc, body }, site) };
        })
      );

      const outRoot = path.resolve(outDir);
      await Promise.all(
        markdownDocs.map(async ({ doc, markdown }) => {
          const target = path.resolve(
            outRoot,
            `${doc.permalink.replace(/^\//, '')}.md`
          );
          if (!target.startsWith(`${outRoot}${path.sep}`))
            throw new Error(
              `[${pluginName}] Refusing to write "${target}" outside the build directory.`
            );

          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(target, markdown, 'utf8');
        })
      );

      const header = [
        '# Lagune',
        '',
        `> ${siteConfig.tagline}`,
        '',
        'Lagune is an open-source, defense-only Security-Driven Hardening (SDH) workflow. It helps your AI agent secure any codebase in any language, at every moment: the charter sets the security rules before you build, the universal /lagune command secures work as it is written, and the five-phase Blue Team flow detects what your system actually does and drives the fixes that matter for that context. It works with 72 AI coding agents and needs no API key.',
      ];

      const lines = [
        ...header,
        '',
        `Every link under Docs points to the plain-Markdown version of that page. Remove the .md suffix for the web page. The whole corpus in one file: ${site}/llms-full.txt`,
        '',
        '## Docs',
        '',
        ...ordered.map((doc) => {
          const url = `${site}${doc.permalink}.md`;
          return doc.description
            ? `- [${doc.title}](${url}): ${doc.description}`
            : `- [${doc.title}](${url})`;
        }),
        '',
      ];

      await fs.writeFile(
        path.join(outDir, 'llms.txt'),
        lines.join('\n'),
        'utf8'
      );

      const full = [
        header.join('\n'),
        ...markdownDocs.map(({ markdown }) => markdown.trimEnd()),
      ].join('\n\n---\n\n');

      await fs.writeFile(
        path.join(outDir, 'llms-full.txt'),
        `${full}\n`,
        'utf8'
      );
    },

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
