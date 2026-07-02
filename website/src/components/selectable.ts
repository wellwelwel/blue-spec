/*
 * The selectable-card look shared by every pick-one / pick-many button on
 * the landing page (agents, specializations, and their "more" openers).
 * Callers prepend their own layout classes (flex, gap, padding).
 */

export const selectableCard = (on: boolean): string =>
  `rounded-[14px] border text-left cursor-pointer transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
    on
      ? 'text-ink border-accent/50 bg-accent/10'
      : 'text-[rgba(233,237,247,0.78)] border-line bg-card hover:bg-card-hover hover:border-white/[0.16] hover:text-ink'
  }`;

export const selectableTint = (on: boolean): string =>
  on ? 'text-accent' : 'text-[#888c99]';
