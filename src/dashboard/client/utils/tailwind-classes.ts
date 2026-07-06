import type { VerdictKind } from '@/types/dashboard/client';

export const classes = (
  ...tokens: (string | false | null | undefined)[]
): string => tokens.filter(Boolean).join(' ');

export const BADGE =
  'inline-flex min-h-6.5 items-center gap-1.5 whitespace-nowrap rounded-sm px-2.75 text-[0.7rem] leading-none';

export const BADGE_MUTED = `${BADGE} font-bold bg-surface-2 text-muted`;

export const BADGE_IC = 'inline-flex text-[0.85rem]';

export const EMPTY = 'py-16 text-center text-[0.85rem] text-faint';

export const MICRO_LABEL =
  'text-[0.7rem] font-bold uppercase tracking-[0.06em] text-faint';

export const GROUP_HEAD = `mb-3 flex items-center gap-2.5 ${MICRO_LABEL}`;

export const LINK =
  'inline-flex items-center gap-1.5 text-[0.8rem] font-bold text-accent no-underline hover:underline';

export const SOFT_TONE = {
  red: 'bg-red-soft text-red',
  amber: 'bg-amber-soft text-amber',
  blue: 'bg-blue-soft text-blue',
  teal: 'bg-teal-soft text-teal',
  accent: 'bg-accent-soft text-accent',
} satisfies Record<string, string>;

export const VPILL_TONE: Record<VerdictKind, string> = {
  pending: SOFT_TONE.amber,
  passed: SOFT_TONE.teal,
  reproved: SOFT_TONE.red,
};

export const CARD = 'rounded-lg bg-surface shadow-card';

export const TILE_SM =
  'grid size-8.5 flex-none place-items-center rounded-sm text-[1.05rem]';

export const TILE_MD =
  'grid size-11 flex-none place-items-center rounded-md text-[1.25rem]';

export const CARD_TITLE = 'text-[0.9rem] font-bold tracking-[-0.01em]';

export const CARD_BLURB = 'truncate text-[0.76rem] font-semibold text-muted';

export const GLYPH_SWAP =
  'col-start-1 row-start-1 inline-flex transition-[opacity,scale,filter] duration-300 ease-house';
