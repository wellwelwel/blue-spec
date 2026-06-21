import type {
  FilteredOption,
  KeypressEvent,
  SelectConfig,
  SelectOption,
} from '../types/core.js';
import { stdin, stdout } from 'node:process';
import { emitKeypressEvents } from 'node:readline';
import { stripVTControlCharacters, styleText } from 'node:util';

export const ESC = '\x1b';
const CURSOR_HIDE = `${ESC}[?25l`;
const CURSOR_SHOW = `${ESC}[?25h`;

const DEFAULT_MAX_VISIBLE = 10;
const FALLBACK_COLUMNS = 80;

const color = {
  cyan: (text: string): string => styleText('cyan', text, { stream: stdout }),
  dim: (text: string): string => styleText('dim', text, { stream: stdout }),
  bold: (text: string): string => styleText('bold', text, { stream: stdout }),
  green: (text: string): string => styleText('green', text, { stream: stdout }),
};

const columns = (): number =>
  stdout.columns && stdout.columns > 0 ? stdout.columns : FALLBACK_COLUMNS;

const visualRows = (line: string): number => {
  const width = stripVTControlCharacters(line).length;

  return Math.max(1, Math.ceil(width / columns()));
};

const totalRows = (lines: string[]): number =>
  lines.reduce((sum, line) => sum + visualRows(line), 0);

export const matches = (option: SelectOption, query: string): boolean => {
  if (!query) return true;

  const haystack = `${option.label} ${option.keywords ?? ''}`.toLowerCase();

  return haystack.includes(query.toLowerCase());
};

export const windowStart = (
  cursor: number,
  count: number,
  maxVisible: number
): number => {
  if (count <= maxVisible) return 0;

  const half = Math.floor(maxVisible / 2);

  return Math.max(0, Math.min(cursor - half, count - maxVisible));
};

export const interactiveSelect = (
  config: SelectConfig
): Promise<number | undefined> => {
  const { title, hint, options, maxVisible = DEFAULT_MAX_VISIBLE } = config;

  return new Promise((resolve) => {
    let query = '';
    let cursor = 0;
    let lastHeight = 0;

    const filtered = (): FilteredOption[] =>
      options
        .map((option, index) => ({ option, index }))
        .filter(({ option }) => matches(option, query));

    const buildLines = (): string[] => {
      const visible = filtered();
      const lines: string[] = [
        color.bold(title),
        color.dim(hint),
        `${color.dim('Search:')} ${query}${color.cyan('█')}`,
        '',
      ];

      if (visible.length === 0) {
        lines.push(color.dim('  No matching agents.'));

        return lines;
      }

      const start = windowStart(cursor, visible.length, maxVisible);
      const end = Math.min(visible.length, start + maxVisible);

      for (let position = start; position < end; position += 1) {
        const isActive = position === cursor;
        const { label } = visible[position].option;
        const pointer = isActive ? color.cyan('›') : ' ';
        const rendered = isActive ? color.cyan(label) : label;

        lines.push(` ${pointer} ${rendered}`);
      }

      const hiddenBefore = start;
      const hiddenAfter = visible.length - end;

      if (hiddenBefore > 0 || hiddenAfter > 0) {
        const parts: string[] = [];

        if (hiddenBefore > 0) parts.push(`↑ ${hiddenBefore} more`);
        if (hiddenAfter > 0) parts.push(`↓ ${hiddenAfter} more`);

        lines.push(color.dim(`   ${parts.join('   ')}`));
      }

      return lines;
    };

    const clear = (): void => {
      if (lastHeight === 0) return;

      stdout.write(`${ESC}[${lastHeight}A`);

      for (let row = 0; row < lastHeight; row += 1)
        stdout.write(`${ESC}[2K${ESC}[1B`);

      stdout.write(`${ESC}[${lastHeight}A`);
    };

    const render = (): void => {
      clear();

      const lines = buildLines();

      stdout.write(`${lines.join('\n')}\n`);
      lastHeight = totalRows(lines);
    };

    const renderFinal = (label: string | undefined): void => {
      clear();

      const summary =
        label === undefined
          ? color.dim('Cancelled')
          : `${color.green('Agent:')} ${label}`;

      stdout.write(`${color.bold(title)}\n${summary}\n`);
      lastHeight = 0;
    };

    const cleanup = (): void => {
      stdin.off('keypress', onKeypress);

      if (stdin.isTTY) stdin.setRawMode(false);

      stdin.pause();
      stdout.write(CURSOR_SHOW);
    };

    const finish = (result: number | undefined): void => {
      const label = result === undefined ? undefined : options[result]?.label;

      renderFinal(label);
      cleanup();
      resolve(result);
    };

    const onKeypress = (_str: string, key: KeypressEvent): void => {
      const name = key?.name;
      const visible = filtered();

      if (key?.ctrl && name === 'c') {
        finish(undefined);
        return;
      }

      if (name === 'escape') {
        finish(undefined);
        return;
      }

      if (name === 'up') {
        cursor = Math.max(0, cursor - 1);
        render();
        return;
      }

      if (name === 'down') {
        cursor = Math.min(visible.length - 1, cursor + 1);
        render();
        return;
      }

      if (name === 'return' || name === 'enter') {
        const chosen = visible[cursor];

        if (chosen) finish(chosen.index);

        return;
      }

      if (name === 'backspace') {
        query = query.slice(0, -1);
        cursor = 0;
        render();
        return;
      }

      const sequence = key?.sequence;

      if (sequence && !key.ctrl && sequence.length === 1 && sequence >= ' ') {
        query += sequence;
        cursor = 0;
        render();
      }
    };

    stdout.write(CURSOR_HIDE);

    emitKeypressEvents(stdin);

    if (stdin.isTTY) stdin.setRawMode(true);

    stdin.resume();
    stdin.on('keypress', onKeypress);

    render();
  });
};
