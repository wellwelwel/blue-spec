export const LINKS = {
  repo: 'https://github.com/wellwelwel/lagune',
  docs: 'https://lagune.weslley.io/docs',
  sponsor: 'https://github.com/sponsors/wellwelwel',
};

export const findingHref = (id: string): string => `/findings/${id}`;

export const commandDocHref = (key: string): string =>
  `${LINKS.docs}/commands/${key}`;
