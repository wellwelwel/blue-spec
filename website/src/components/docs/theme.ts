const STORAGE_KEY = 'bluespec-docs-theme';

export const toggleDocsTheme = (): void => {
  const root = document.documentElement;
  const next = root.dataset.bsDocsTheme === 'dark' ? 'light' : 'dark';
  root.dataset.bsDocsTheme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
};

export const docsThemeBootScript = `(function(){var t='light';var m=location.search.match(/[?&]theme=(dark|light)/);if(m){t=m[1];}else{try{if(localStorage.getItem('${STORAGE_KEY}')==='dark')t='dark';}catch(e){}}document.documentElement.dataset.bsDocsTheme=t;})();`;
