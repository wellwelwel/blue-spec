import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Blue Spec',
  tagline: 'Security-Driven Hardening for AI-built software',
  favicon: 'favicon.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
    // faster: true,
  },

  url: 'https://bluespec.weslley.io',
  baseUrl: '/',
  trailingSlash: false,
  organizationName: 'wellwelwel',
  projectName: 'blue-spec',
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
        href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Inter:wght@400;500;600;700&family=Ubuntu+Mono:wght@400;700&display=swap',
      },
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Blue Spec',
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'Security',
        operatingSystem: 'Node.js',
        url: 'https://bluespec.weslley.io',
        description:
          'Blue Spec helps your AI agent make a project more secure. You point it at your code, and the agent figures out what your system actually does, then guides you through the security work that matters for it.',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: {
          '@type': 'Person',
          name: 'Weslley Araújo',
          url: 'https://github.com/wellwelwel',
        },
        license: 'https://github.com/wellwelwel/blue-spec/blob/main/LICENSE',
        sameAs: [
          'https://github.com/wellwelwel/blue-spec',
          'https://www.npmjs.com/package/blue-spec',
        ],
      }),
    },
  ],

  plugins: [
    function tailwindPlugin() {
      return {
        name: 'tailwind-plugin',
        configurePostCss(postcssOptions) {
          postcssOptions.plugins.push(require('@tailwindcss/postcss'));
          return postcssOptions;
        },
      };
    },
  ],

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexDocs: true,
        indexPages: false,
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 8,
        searchBarShortcut: true,
        searchBarShortcutHint: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/wellwelwel/blue-spec/edit/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
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
          'Blue Spec helps your AI agent make a project more secure. You point it at your code, and the agent figures out what your system actually does, then guides you through the security work that matters for it.',
      },
      {
        name: 'keywords',
        content:
          'security, application security, AI security, security hardening, secure coding, vulnerability detection, defensive security, blue team, AI agents, Claude Code, vibe coding, npx, OWASP, ReDoS, prototype pollution, DOM XSS',
      },
      { name: 'author', content: 'Weslley Araújo' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: 'SDH: Blue Spec — Security-Driven Hardening',
      },
      {
        name: 'twitter:description',
        content:
          'Blue Spec helps your AI agent make a project more secure. Point it at your code, and it guides you through the security work that matters for it.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Blue Spec' },
      { property: 'og:locale', content: 'en_US' },
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Blue Spec',
      logo: {
        alt: 'Blue Spec',
        src: 'favicon.png',
        href: '/',
      },
      hideOnScroll: true,
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/',
          label: 'Home',
          position: 'left',
        },
        {
          href: 'https://github.com/wellwelwel/blue-spec',
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
              href: 'https://github.com/wellwelwel/blue-spec',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/blue-spec',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Security Policy',
              href: 'https://github.com/wellwelwel/blue-spec/blob/main/SECURITY.md',
            },
            {
              label: 'License',
              href: 'https://github.com/wellwelwel/blue-spec/blob/main/LICENSE',
            },
            {
              label: 'Sponsor',
              href: 'https://github.com/sponsors/wellwelwel',
            },
          ],
        },
      ],
      copyright: `Copyright © 2026-present <a href="https://github.com/wellwelwel" target="_blank" rel="noopener">Weslley Araújo</a> and <a href="https://github.com/wellwelwel/blue-spec/graphs/contributors" target="_blank" rel="noopener">contributors</a>. Blue Spec is under the <a href="https://github.com/wellwelwel/blue-spec/blob/main/LICENSE" target="_blank" rel="noopener">MIT License</a>.<br />Blue Spec is an independent open-source project and is not affiliated with, endorsed by, or associated with Bluespec, Inc. or the Bluespec Hardware Description Language (HDL) and its compiler (bsc).<br />The name "Blue Spec" comes from Blue Team (defensive security) and Spec-Driven Development. It refers to an AI-assisted security hardening tool for software projects, a different domain from Bluespec, Inc., which provides RISC-V processor IP and hardware design tools.<br>"Bluespec" is a trademark of Bluespec, Inc. All other product names, trademarks, and registered trademarks mentioned are the property of their respective owners and are used for identification purposes only.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: [
        'javascript',
        'bash',
        'json',
        'python',
        'typescript',
      ],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
