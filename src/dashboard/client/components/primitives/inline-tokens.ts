import type { Token } from '../../../../types/dashboard/client';

const CODE = '`';
const STRONG = '**';
const EM = '*';

const matchCode = (
  text: string,
  start: number
): Extract<Token, { kind: 'code' }> | null => {
  if (text[start] !== CODE) return null;
  const close = text.indexOf(CODE, start + 1);
  if (close <= start + 1) return null;
  return { kind: 'code', value: text.slice(start + 1, close) };
};

const matchLink = (
  text: string,
  start: number
): Extract<Token, { kind: 'link' }> | null => {
  if (text[start] !== '[') return null;
  const label = text.indexOf(']', start + 1);
  if (label <= start + 1 || text[label + 1] !== '(') return null;
  const close = text.indexOf(')', label + 2);
  if (close <= label + 2) return null;
  return {
    kind: 'link',
    value: text.slice(start + 1, label),
    href: text.slice(label + 2, close),
  };
};

const matchWrapped = (
  text: string,
  start: number,
  marker: string,
  kind: 'strong' | 'em'
): Extract<Token, { kind: 'strong' | 'em' }> | null => {
  if (!text.startsWith(marker, start)) return null;
  const from = start + marker.length;
  const close = text.indexOf(marker, from);
  if (close <= from) return null;
  return { kind, value: text.slice(from, close) };
};

const matchAt = (
  text: string,
  start: number
): Exclude<Token, { kind: 'text' }> | null =>
  matchCode(text, start) ??
  matchLink(text, start) ??
  matchWrapped(text, start, STRONG, 'strong') ??
  matchWrapped(text, start, EM, 'em');

const consumed = (token: Exclude<Token, { kind: 'text' }>): number => {
  if (token.kind === 'code') return token.value.length + CODE.length * 2;
  if (token.kind === 'link') return token.value.length + token.href.length + 4;
  if (token.kind === 'strong') return token.value.length + STRONG.length * 2;
  return token.value.length + EM.length * 2;
};

export const tokenize = (text: string): Token[] => {
  const tokens: Token[] = [];
  let plainFrom = 0;
  let position = 0;

  while (position < text.length) {
    const match = matchAt(text, position);

    if (!match) {
      position += 1;
      continue;
    }

    if (plainFrom < position)
      tokens.push({ kind: 'text', value: text.slice(plainFrom, position) });

    tokens.push(match);
    position += consumed(match);
    plainFrom = position;
  }

  if (plainFrom < text.length)
    tokens.push({ kind: 'text', value: text.slice(plainFrom) });

  return tokens;
};
