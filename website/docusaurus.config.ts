import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import tailwindPostcss from '@tailwindcss/postcss';
import { docsContentPlugin } from './plugins/docs-content';
import { laguneCode } from './src/prism/lagune';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Lagune',
  tagline: 'Security-Driven Hardening for AI-built software',
  favicon: 'favicon.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
    faster: true,
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
      attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Fira+Code:wght@400;600&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Ubuntu+Mono:wght@400;700&display=swap',
      },
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Lagune',
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'Security',
        operatingSystem: 'Node.js',
        url: 'https://lagune.ai',
        description:
          "Lagune is your security copilot as you build, your Blue Team when you audit, whether you're a developer or not.",
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: {
          '@type': 'Person',
          name: 'Weslley Araújo',
          url: 'https://github.com/wellwelwel',
        },
        license: 'https://github.com/wellwelwel/lagune/blob/main/LICENSE',
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
        name: 'twitter:title',
        content: 'Lagune — Security-Driven Hardening',
      },
      {
        name: 'twitter:description',
        content:
          "Lagune is your security copilot as you build, your Blue Team when you audit, whether you're a developer or not.",
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Lagune' },
      { property: 'og:locale', content: 'en_US' },
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
