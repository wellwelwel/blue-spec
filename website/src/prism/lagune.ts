import type { PrismTheme } from 'prism-react-renderer';

/*
 * Lagune code theme: a blue-family scheme over the dashboard's dark
 * canvas token, so code blocks read as native Lagune terminals in both
 * docs themes. Three blue tones carry the structure (keywords, strings,
 * constants), pink marks the call sites, red is reserved for deletions.
 */

const canvas = '#0b0e17';
const ink = '#e6ebf5';
const muted = '#8b93a8';
const faint = '#69718a';
const blue = '#5fa1ff';
const sky = '#86d3ff';
const periwinkle = '#a8b4ff';
const pink = '#ef83b6';
const red = '#ff7076';

export const laguneCode: PrismTheme = {
  plain: {
    color: ink,
    backgroundColor: canvas,
  },
  styles: [
    {
      types: ['command'],
      style: { color: sky, fontWeight: 'bold' },
    },
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: faint, fontStyle: 'italic' },
    },
    {
      types: ['punctuation', 'operator', 'combinator'],
      style: { color: muted },
    },
    {
      types: [
        'keyword',
        'atrule',
        'selector',
        'important',
        'tag',
        'builtin',
        'property',
      ],
      style: { color: blue },
    },
    {
      types: ['string', 'char', 'url', 'attr-value', 'inserted'],
      style: { color: sky },
    },
    {
      types: ['number', 'boolean', 'constant', 'symbol', 'regex'],
      style: { color: periwinkle },
    },
    {
      types: ['parameter'],
      style: { color: periwinkle, fontStyle: 'italic' },
    },
    {
      types: ['function', 'class-name', 'function-variable', 'attr-name'],
      style: { color: pink },
    },
    {
      types: ['deleted'],
      style: { color: red },
    },
    {
      types: ['namespace'],
      style: { opacity: 0.8 },
    },
  ],
};
