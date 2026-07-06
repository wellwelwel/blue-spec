import type { VNode } from 'preact';
import { useLocation } from 'preact-iso';
import { live, query } from '../../data/state';
import { toggleTheme } from '../../hooks/use/theme';
import { LINKS } from '../../utils/links';
import { classes } from '../../utils/tailwind-classes';
import { Icon } from '../primitives/icons';

const ICON_BTN =
  'relative grid size-11.5 cursor-pointer place-items-center rounded-full border-0 bg-surface text-[1.2rem] text-ink-2 no-underline shadow-card transition-[color,box-shadow] hover:text-accent hover:shadow-pop';

const PILL_BASE =
  'inline-flex h-11.5 items-center gap-2 rounded-full bg-surface px-4.5 text-[0.85rem] font-bold shadow-card';

const PILL = `${PILL_BASE} text-ink-2 no-underline transition-[color,box-shadow] hover:text-accent hover:shadow-pop`;

const PORT = location.port || location.hostname;

const ICON_SWAP =
  'col-start-1 row-start-1 inline-flex transition-[opacity,scale,filter] duration-200 ease-house';

export const Topbar = (): VNode => {
  const location = useLocation();

  const onSearchKey = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (!location.path.startsWith('/findings')) location.route('/findings');
  };

  return (
    <header class='flex flex-none items-center gap-4.5 px-7 pt-5.5 pb-4'>
      <label class='flex h-11.5 flex-1 items-center gap-2.5 rounded-full border border-line-2 bg-surface px-4.5 transition-[border-color,box-shadow] focus-within:border-accent/45'>
        <span class='inline-flex text-[1.2rem] text-faint'>
          <Icon name='search' />
        </span>
        <input
          class='flex-1 border-0 bg-transparent font-[inherit] text-[0.85rem] text-ink outline-none placeholder:text-faint'
          type='search'
          placeholder='Search findings, files, severity…'
          autocomplete='off'
          spellcheck={false}
          value={query.value}
          onInput={(event) => (query.value = event.currentTarget.value)}
          onKeyDown={onSearchKey}
        />
      </label>
      <div class='flex items-center gap-3'>
        <button
          class={ICON_BTN}
          type='button'
          aria-label='Toggle theme'
          onClick={toggleTheme}
        >
          <span class='col-start-1 row-start-1 inline-flex scale-100 opacity-100 [filter:blur(0)] transition-[opacity,scale,filter] duration-200 ease-house dark:scale-[0.25] dark:opacity-0 dark:[filter:blur(4px)]'>
            <Icon name='moon' />
          </span>
          <span class='col-start-1 row-start-1 inline-flex scale-[0.25] opacity-0 [filter:blur(4px)] transition-[opacity,scale,filter] duration-200 ease-house dark:scale-100 dark:opacity-100 dark:[filter:blur(0)]'>
            <Icon name='sun' />
          </span>
        </button>
        <a
          class={ICON_BTN}
          href={LINKS.repo}
          target='_blank'
          rel='noreferrer'
          aria-label='GitHub repository'
        >
          <Icon name='github' />
        </a>
        <a
          class={ICON_BTN}
          href={LINKS.sponsor}
          target='_blank'
          rel='noreferrer'
          aria-label='Sponsor Blue Spec'
        >
          <span class='inline-flex text-pink'>
            <Icon name='heart' />
          </span>
        </a>
        <span class='h-7.5 w-px bg-line-2' />
        <a
          class={PILL}
          href={LINKS.docs}
          target='_blank'
          rel='noreferrer'
          aria-label='Official documentation'
        >
          <span class='inline-flex text-[1.1rem]'>
            <Icon name='book' />
          </span>
          Documentation
        </a>
        <span
          class={classes(
            PILL_BASE,
            'tabular-nums font-bold',
            live.value ? 'text-teal' : 'text-red'
          )}
        >
          <span class='grid text-[1.15rem]'>
            <span
              class={classes(
                ICON_SWAP,
                live.value
                  ? 'scale-100 opacity-100 blur-0'
                  : 'scale-[0.25] opacity-0 blur-xs'
              )}
            >
              <Icon name='wifiOn' />
            </span>
            <span
              class={classes(
                ICON_SWAP,
                live.value
                  ? 'scale-[0.25] opacity-0 blur-xs'
                  : 'scale-100 opacity-100 blur-0'
              )}
            >
              <Icon name='wifiOff' />
            </span>
          </span>
          {PORT}
        </span>
      </div>
    </header>
  );
};
