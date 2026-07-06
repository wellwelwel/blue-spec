import type { ComponentChildren, VNode } from 'preact';
import { Icon } from './primitives/icons';

export const BANNER_CHIP =
  'inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2.25 text-[0.8rem] font-bold text-white';

export const BannerButton = (props: { href: string; label: string }): VNode => (
  <a
    class='inline-flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-dark py-2.5 pr-2.5 pl-5.5 text-[0.85rem] font-bold text-white no-underline hover:bg-black'
    href={props.href}
  >
    {props.label}
    <span class='grid size-7.5 place-items-center rounded-full bg-white/18 text-base'>
      <Icon name='arrowRight' />
    </span>
  </a>
);

export const PageHeader = (props: {
  eyebrow: string;
  title: string;
  description: ComponentChildren;
  background: string;
  actions?: ComponentChildren;
}): VNode => (
  <section class='relative mb-5 flex-none overflow-hidden rounded-xl bg-banner px-9 py-7.5 text-white shadow-card'>
    <img
      class='route-rise pointer-events-none absolute inset-0 z-0 size-full object-cover [mask-image:linear-gradient(to_right,transparent,rgba(0,0,0,0.35)_38%,black)]'
      src={props.background}
      alt=''
      aria-hidden='true'
    />
    <span class='pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-banner via-banner/85 to-banner/40' />
    <div class='route-fade relative z-[2] flex flex-wrap items-end justify-between gap-5'>
      <div class='min-w-0 max-w-145'>
        <span class='text-[0.7rem] font-bold uppercase tracking-[0.14em] text-white/[0.82]'>
          {props.eyebrow}
        </span>
        <h1 class='mt-2.5 text-[1.7rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-balance'>
          {props.title}
        </h1>
        <p class='mt-2.5 text-[0.85rem] text-white/90 text-pretty'>
          {props.description}
        </p>
      </div>
      {props.actions && (
        <div class='flex flex-none flex-wrap items-center gap-2.5'>
          {props.actions}
        </div>
      )}
    </div>
  </section>
);
