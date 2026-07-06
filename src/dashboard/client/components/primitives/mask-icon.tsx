import type { VNode } from 'preact';

export const MaskIcon = (props: { src: string; class?: string }): VNode => (
  <span
    class={props.class}
    style={{
      maskImage: `url(${props.src})`,
      WebkitMaskImage: `url(${props.src})`,
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
    }}
  />
);
