import type { PluginModule } from '@docusaurus/types';
import fs from 'node:fs/promises';
import path from 'node:path';

const pluginName = 'lagune-font-preload';

/**
 * The two faces that paint above the fold on the landing page: Inter 400 for
 * body copy and Archivo 900 for the "/ Defense by design" display heading (the
 * LCP text). Only these are preloaded; every extra preload competes with the
 * hero image for the same throttled bytes.
 */
const ABOVE_THE_FOLD = ['inter-latin-400-normal', 'archivo-latin-900-normal'];

const fontsDir = 'assets/fonts';

const findWoff2 = async (
  outDir: string
): Promise<{ file: string; href: string }[]> => {
  const directory = path.join(outDir, fontsDir);
  const entries = await fs.readdir(directory);

  return ABOVE_THE_FOLD.flatMap((face) => {
    const file = entries.find(
      (entry) => entry.startsWith(face) && entry.endsWith('.woff2')
    );

    if (!file)
      throw new Error(
        `[${pluginName}] No built woff2 found for "${face}" in ${directory}.`
      );

    return { file, href: `/${fontsDir}/${file}` };
  });
};

const preloadTags = (fonts: { href: string }[]): string =>
  fonts
    .map(
      ({ href }) =>
        `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin="anonymous">`
    )
    .join('');

export const fontPreloadPlugin: PluginModule = () => ({
  name: pluginName,
  postBuild: async ({ outDir, baseUrl }) => {
    const homepage = path.join(outDir, 'index.html');
    const html = await fs.readFile(homepage, 'utf8');
    const fonts = await findWoff2(outDir);
    const tags = preloadTags(
      fonts.map(({ href }) => ({
        href: `${baseUrl.replace(/\/$/, '')}${href}`,
      }))
    );

    await fs.writeFile(homepage, html.replace('</head>', `${tags}</head>`));
  },
});
