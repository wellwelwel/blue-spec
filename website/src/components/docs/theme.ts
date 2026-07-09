const STORAGE_KEY = 'lagune-docs-theme';

export const toggleDocsTheme = (): void => {
  const root = document.documentElement;
  const next = root.dataset.laguneDocsTheme === 'dark' ? 'light' : 'dark';
  root.dataset.laguneDocsTheme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
};

export const docsThemeBootScript = `(function(){var t='light';var m=location.search.match(/[?&]theme=(dark|light)/);if(m){t=m[1];}else{try{if(localStorage.getItem('${STORAGE_KEY}')==='dark')t='dark';}catch(e){}}document.documentElement.dataset.laguneDocsTheme=t;})();`;
