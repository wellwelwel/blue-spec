import type { Token } from '@/types/dashboard/client';
import type { VNode } from 'preact';
import { tokenize } from './inline-tokens';

const renderToken = (token: Token): VNode | string => {
  if (token.kind === 'text') return token.value;
  if (token.kind === 'code')
    return (
      <span class='inline-code rounded-[5px] px-1.25 py-0.125 font-mono text-[0.86em] font-semibold'>
        {token.value}
      </span>
    );
  if (token.kind === 'link')
    return (
      <a
        class='font-semibold text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent'
        href={token.href}
        target='_blank'
        rel='noreferrer'
      >
        <Inline text={token.value} />
      </a>
    );
  if (token.kind === 'strong')
    return (
      <strong class='font-bold text-ink'>
        <Inline text={token.value} />
      </strong>
    );
  return (
    <em>
      <Inline text={token.value} />
    </em>
  );
};

export const Inline = (props: { text: string }): VNode => (
  <>{tokenize(props.text).map(renderToken)}</>
);
