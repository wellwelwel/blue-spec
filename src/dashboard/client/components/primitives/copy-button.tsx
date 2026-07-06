import type { VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { classes, GLYPH_SWAP } from '../../utils/tailwind-classes';
import { Icon } from './icons';

export const CopyButton = (props: {
  text: string;
  label: string;
  inline?: boolean;
}): VNode => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    navigator.clipboard.writeText(props.text).then(
      () => setCopied(true),
      () => setCopied(false)
    );
  };

  return (
    <button
      type='button'
      aria-label={copied ? 'Copied' : props.label}
      onClick={copy}
      class={classes(
        'flex-none cursor-pointer place-items-center border-0 bg-transparent transition-colors',
        props.inline
          ? "relative inline-grid size-4 translate-y-px align-middle text-[0.9rem] text-current opacity-70 after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] hover:opacity-100"
          : 'grid size-10 rounded-md text-[0.95rem] text-faint hover:text-accent'
      )}
    >
      <span class='grid'>
        <span
          class={`${GLYPH_SWAP} ${copied ? 'scale-[0.25] opacity-0 blur-[4px]' : 'scale-100 opacity-100 blur-0'}`}
        >
          <Icon name='copy' />
        </span>
        <span
          class={`${GLYPH_SWAP} text-teal ${copied ? 'scale-100 opacity-100 blur-0' : 'scale-[0.25] opacity-0 blur-[4px]'}`}
        >
          <Icon name='check' />
        </span>
      </span>
    </button>
  );
};
