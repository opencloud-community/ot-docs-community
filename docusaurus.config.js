// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {themes} = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'OpenTalk Community Docs',
  tagline: 'Community-maintained deployment and operation documentation for OpenTalk',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://opencloud-community.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/ot-docs-community/',

  // GitHub pages deployment config - using GitHub Actions deployment
  organizationName: 'opencloud-community',
  projectName: 'ot-docs-community',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/opencloud-community/ot-docs-community/tree/main/',
        },
        blog: false, // Blog feature disabled
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/logo.svg',
      navbar: {
        title: 'OpenTalk Community Docs',
        logo: {
          alt: 'OpenTalk Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://github.com/opencloud-community/ot-docs-community',
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
              {
                label: 'Deployment',
                to: '/docs/category/deployment',
              },
              {
                label: 'Operation',
                to: '/docs/category/operation',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub OpenTalk Repositories',
                href: 'https://github.com/orgs/opencloud-community/repositories?q=ot-',
              }
            ],
          },
          {
            title: 'Official Docs',
            items: [
              {
                label: 'User Documentation',
                href: 'https://opentalk.eu/docs/user/',
              },
              {
                label: 'Admin Documentation',
                href: 'https://opentalk.eu/docs/admin/',
              },
              {
                label: 'Developer Documentation',
                href: 'https://opentalk.eu/docs/developer/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} OpenTalk Community. Built with Docusaurus.`,
      },
      prism: {
        theme: themes.github,
        darkTheme: themes.dracula,
      },
    }),
};

module.exports = config;