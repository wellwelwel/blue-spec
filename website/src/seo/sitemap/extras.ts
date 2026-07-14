import type { ChangeFreq } from './priority';

export type ExtraSitemapItem = {
  url: string;
  changefreq: ChangeFreq;
  priority: number;
};

const AI_INDEX_FILES = ['llms.txt', 'llms-full.txt'] as const;

/**
 * The AI-index files live at stable root URLs, so they are listed here as first-class sitemap entries.
 *
 * - The per-page Markdown twins are not listed here: each is advertised in its page `<head>` as a `<link rel="alternate" type="text/markdown">` instead.
 */
export const extraSitemapItems = (siteUrl: string): ExtraSitemapItem[] => {
  const base = siteUrl.replace(/\/$/, '');

  return AI_INDEX_FILES.map((file) => ({
    url: `${base}/${file}`,
    changefreq: 'weekly',
    priority: 0.5,
  }));
};
