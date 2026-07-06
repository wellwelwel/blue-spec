import type { Theme } from '@/types/dashboard/client';
import { signal } from '@preact/signals';

const STORAGE_KEY = 'bluespec-theme';

const readStored = (): Theme | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {}
  return null;
};

const initialTheme = (): Theme => {
  const forced = location.search.match(/theme=(dark|light)/)?.[1];
  if (forced === 'dark' || forced === 'light') return forced;
  return readStored() ?? 'light';
};

export const theme = signal<Theme>(initialTheme());

export const reflectTheme = (): void => {
  document.documentElement.dataset.theme = theme.value;
};

export const toggleTheme = (): void => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  reflectTheme();
  try {
    localStorage.setItem(STORAGE_KEY, theme.value);
  } catch {}
};
