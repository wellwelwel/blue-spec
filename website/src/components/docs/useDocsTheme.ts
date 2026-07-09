import { useEffect, useState } from 'react';

export type DocsTheme = 'light' | 'dark';

const read = (): DocsTheme =>
  typeof document !== 'undefined' &&
  document.documentElement.dataset.bsDocsTheme === 'dark'
    ? 'dark'
    : 'light';

/*
 * The docs skin keys off html[data-bs-docs-theme], toggled at runtime rather
 * than through React. Components that render explicit colors (a portaled
 * popover, a Mermaid canvas) read the mode here and re-render when it flips.
 */
export const useDocsTheme = (): DocsTheme => {
  const [theme, setTheme] = useState<DocsTheme>('light');

  useEffect(() => {
    setTheme(read());

    const observer = new MutationObserver(() => setTheme(read()));

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bs-docs-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
};
