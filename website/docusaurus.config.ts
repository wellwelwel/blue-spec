import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import tailwindPostcss from '@tailwindcss/postcss';
import { docsContentPlugin } from './plugins/docs-content';
import { laguneCode } from './src/prism/lagune';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Lagune',
  tagline: 'Security-Driven Hardening for any codebase',
  favicon: 'favicon.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
    faster: true,
    experimental_vcs: true,
  },

  url: 'https://lagune.ai',
  baseUrl: '/',
  trailingSlash: false,
  organizationName: 'wellwelwel',
  projectName: 'lagune',
  deploymentBranch: 'website',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': 'https://lagune.ai/#organization',
        name: 'Lagune',
        alternateName: ['Lagune AI', 'Lagune Security', 'lagune', 'lagune.ai'],
        url: 'https://lagune.ai/',
        logo: 'https://lagune.ai/img/logo.png',
        description:
          "Lagune is your security copilot as you build, your Blue Team when you audit, whether you're a developer or not.",
        disambiguatingDescription:
          'Lagune (also written Lagune AI) is a Security-Driven Hardening workflow that hardens any codebase, in any language, whether written by humans or an AI. It is not related to Laguna AI.',
        sameAs: [
          'https://github.com/wellwelwel/lagune',
          'https://www.npmjs.com/package/lagune',
        ],
      }),
    },
  ],

  plugins: [
    docsContentPlugin,
    function tailwindPlugin() {
      return {
        name: 'tailwind-plugin',
        configurePostCss(postcssOptions) {
          postcssOptions.plugins.push(tailwindPostcss);
          return postcssOptions;
        },
      };
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
        theme: {
          customCss: ['./src/css/custom.css', './src/css/docs.css'],
        },
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/og.png',
    metadata: [
      {
        name: 'description',
        content:
          "Lagune is your security copilot as you build, your Blue Team when you audit, whether you're a developer or not.",
      },
      {
        name: 'keywords',
        content:
          'security, application security, AI security, security hardening, secure coding, vulnerability detection, defensive security, blue team, AI agents, Claude Code, vibe coding, npx, OWASP, Lagune AI, Lagune IA, SDH, Spec-Driven, SDH Lagune, Security-Driven Hardening',
      },
      { name: 'author', content: 'Weslley Araújo' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:image:alt',
        content: 'Lagune: AI-driven security hardening for any codebase',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Lagune' },
      { property: 'og:locale', content: 'en_US' },
      {
        property: 'og:image:alt',
        content: 'Lagune: AI-driven security hardening for any codebase',
      },
      { property: 'og:image:width', content: '1280' },
      { property: 'og:image:height', content: '640' },
      {
        property: 'og:image:secure_url',
        content: 'https://lagune.ai/img/og.png',
      },
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Lagune',
      logo: {
        alt: 'Lagune',
        src: 'favicon.png',
        href: '/',
      },
      hideOnScroll: true,
      items: [
        {
          to: '/docs',
          label: 'Docs',
          position: 'left',
        },
        {
          to: '/',
          label: 'Home',
          position: 'left',
        },
        {
          href: 'https://github.com/wellwelwel/lagune',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Get Started', to: '/docs/get-started/install' },
            { label: 'Commands', to: '/docs/commands/charter' },
            { label: 'Skills', to: '/docs/commands/skills' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'Home', to: '/' },
            {
              label: 'GitHub',
              href: 'https://github.com/wellwelwel/lagune',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/lagune',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Security Policy',
              href: 'https://github.com/wellwelwel/lagune/blob/main/SECURITY.md',
            },
            {
              label: 'License',
              href: 'https://github.com/wellwelwel/lagune/blob/main/LICENSE',
            },
            {
              label: 'Sponsor',
              href: 'https://github.com/sponsors/wellwelwel',
            },
          ],
        },
      ],
    },
    prism: {
      theme: laguneCode,
      darkTheme: laguneCode,
      additionalLanguages: [
        'javascript',
        'bash',
        'json',
        'python',
        'typescript',
        'markdown',
      ],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
