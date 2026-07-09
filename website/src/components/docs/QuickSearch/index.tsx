import type { DocEntry } from '@site/plugins/docs-content';
import type { KeyboardEvent, ReactNode } from 'react';
import { useHistory } from '@docusaurus/router';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { useDocsData } from '../data';
import { Icon } from '../icons';

const MAX_RESULTS = 8;

const matches = (doc: DocEntry, terms: string[]): boolean => {
  const haystack =
    `${doc.title} ${doc.sidebarLabel} ${doc.docId} ${doc.description ?? ''}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
};

export const QuickSearch = (): ReactNode => {
  const { docs } = useDocsData();
  const history = useHistory();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return docs.filter((doc) => matches(doc, terms)).slice(0, MAX_RESULTS);
  }, [docs, query]);

  const open = focused && query.trim().length > 0;

  const go = (permalink: string) => {
    setQuery('');
    setActive(0);
    history.push(permalink);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, results.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      go(results[active].permalink);
      return;
    }

    if (event.key === 'Escape') event.currentTarget.blur();
  };

  return (
    <div className='relative min-w-0 flex-1'>
      <label className='flex h-12.5 items-center gap-2.5 rounded-full border border-line-2 bg-surface px-4.5 transition-[border-color,box-shadow] focus-within:border-accent/45'>
        <span className='inline-flex text-[1.2rem] text-faint'>
          <Icon name='search' />
        </span>
        <input
          className='w-full min-w-0 flex-1 border-0 bg-transparent font-[inherit] text-[0.85rem] text-ink outline-none placeholder:text-faint'
          type='search'
          placeholder='Search the docs…'
          autoComplete='off'
          spellCheck={false}
          role='combobox'
          aria-expanded={open}
          aria-label='Search the docs'
          aria-controls='lagune-docs-search-results'
          value={query}
          onInput={(event) => {
            setQuery(event.currentTarget.value);
            setActive(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
        />
      </label>
      {open && (
        <div
          id='lagune-docs-search-results'
          role='listbox'
          className='lagune-docs-route-fade absolute top-full right-0 left-0 z-40 mt-2 flex flex-col gap-0.5 rounded-panel border border-line bg-surface p-1.5 shadow-pop'
        >
          {results.length === 0 && (
            <span className='px-3 py-2.5 text-[0.85rem] font-semibold text-muted'>
              No pages match “{query.trim()}”.
            </span>
          )}
          {results.map((doc, index) => (
            <button
              key={doc.docId}
              type='button'
              role='option'
              aria-selected={index === active}
              className={clsx(
                'flex cursor-pointer flex-col items-start gap-0.5 rounded-field border-0 px-3 py-2 text-left transition-colors',
                index === active
                  ? 'bg-accent-soft text-accent'
                  : 'bg-transparent text-ink-2 hover:bg-canvas'
              )}
              onMouseDown={(event) => {
                event.preventDefault();
                go(doc.permalink);
              }}
              onMouseEnter={() => setActive(index)}
            >
              <span className='text-[0.85rem] font-bold'>{doc.title}</span>
              <span className='text-[0.72rem] font-semibold text-faint'>
                {doc.permalink}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
