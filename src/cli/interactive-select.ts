import type {
  FilteredOption,
  KeypressEvent,
  SelectConfig,
  SelectOption,
  SelectRowRenderer,
} from '../types/core.js';
import { stdin, stdout } from 'node:process';
import { emitKeypressEvents } from 'node:readline';
import { stripVTControlCharacters } from 'node:util';
import { color } from './colors.js';

export const ESC = '\x1b';
const CURSOR_HIDE = `${ESC}[?25l`;
const CURSOR_SHOW = `${ESC}[?25h`;

const DEFAULT_MAX_VISIBLE = 10;
const FALLBACK_COLUMNS = 80;

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

const isLocked = (entry: FilteredOption | undefined): boolean =>
  entry?.option.locked === true;

export const firstSelectable = (visible: FilteredOption[]): number => {
  const index = visible.findIndex((entry) => !isLocked(entry));

  return index === -1 ? 0 : index;
};

export const moveCursor = (
  visible: FilteredOption[],
  cursor: number,
  step: 1 | -1
): number => {
  for (
    let next = cursor + step;
    next >= 0 && next < visible.length;
    next += step
  )
    if (!isLocked(visible[next])) return next;

  return cursor;
};

const labelStyle = (option: SelectOption, isActive: boolean): string => {
  if (option.locked) return color.dim(option.label);

  return isActive ? color.blue(option.label) : option.label;
};

const pointerFor = (option: SelectOption, isActive: boolean): string =>
  isActive && !option.locked ? color.blue('›') : ' ';

const overflowLine = (
  hiddenBefore: number,
  hiddenAfter: number
): string | undefined => {
  if (hiddenBefore === 0 && hiddenAfter === 0) return undefined;

  const parts: string[] = [];

  if (hiddenBefore > 0) parts.push(`↑ ${hiddenBefore} more`);
  if (hiddenAfter > 0) parts.push(`↓ ${hiddenAfter} more`);

  return color.dim(`   ${parts.join('   ')}`);
};

const visibleRows = (
  visible: FilteredOption[],
  cursor: number,
  maxVisible: number,
  renderRow: SelectRowRenderer
): string[] => {
  const start = windowStart(cursor, visible.length, maxVisible);
  const end = Math.min(visible.length, start + maxVisible);
  const rows: string[] = [];

  for (let position = start; position < end; position += 1)
    rows.push(renderRow(visible[position], position === cursor));

  const overflow = overflowLine(start, visible.length - end);

  return overflow ? [...rows, overflow] : rows;
};

const createScreen = (
  buildLines: () => string[],
  onKeypress: (key: KeypressEvent) => void
): { render: () => void; writeFinal: (summary: string) => void } => {
  let lastHeight = 0;

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

  const cleanup = (): void => {
    stdin.off('keypress', handler);

    if (stdin.isTTY) stdin.setRawMode(false);

    stdin.pause();
    stdout.write(CURSOR_SHOW);
  };

  const writeFinal = (summary: string): void => {
    clear();
    stdout.write(`${summary}\n`);
    lastHeight = 0;
    cleanup();
  };

  const handler = (_str: string, key: KeypressEvent): void => onKeypress(key);

  stdout.write(CURSOR_HIDE);
  emitKeypressEvents(stdin);

  if (stdin.isTTY) stdin.setRawMode(true);

  stdin.resume();
  stdin.on('keypress', handler);

  return { render, writeFinal };
};

const header = (config: SelectConfig, query: string): string[] => [
  color.bold(config.title),
  color.dim(config.hint),
  `${color.dim('Search:')} ${query}${color.blue('█')}`,
  '',
];

const withFooter = (lines: string[], footer: string | undefined): string[] =>
  footer ? [...lines, '', color.dim(footer)] : lines;

const isCancel = (key: KeypressEvent): boolean =>
  key?.name === 'escape' || (key?.ctrl === true && key?.name === 'c');

const isTextInput = (key: KeypressEvent): boolean => {
  const sequence = key?.sequence;

  return (
    sequence !== undefined &&
    !key.ctrl &&
    sequence.length === 1 &&
    sequence >= ' '
  );
};

export const interactiveSelect = (
  config: SelectConfig
): Promise<number | undefined> => {
  const {
    options,
    maxVisible = DEFAULT_MAX_VISIBLE,
    emptyLabel = 'No matching agents.',
    confirmLabel = 'Agent:',
    footer,
  } = config;

  return new Promise((resolve) => {
    let query = '';

    const filtered = (): FilteredOption[] =>
      options
        .map((option, index) => ({ option, index }))
        .filter(({ option }) => matches(option, query));

    let cursor = firstSelectable(filtered());

    const renderRow: SelectRowRenderer = ({ option }, isActive) =>
      ` ${pointerFor(option, isActive)} ${labelStyle(option, isActive)}`;

    const buildLines = (): string[] => {
      const visible = filtered();

      if (visible.length === 0)
        return withFooter(
          [...header(config, query), color.dim(`  ${emptyLabel}`)],
          footer
        );

      return withFooter(
        [
          ...header(config, query),
          ...visibleRows(visible, cursor, maxVisible, renderRow),
        ],
        footer
      );
    };

    const finish = (result: number | undefined): void => {
      const summary =
        result === undefined
          ? color.dim('Cancelled')
          : `${color.green(confirmLabel)} ${options[result]?.label}`;

      screen.writeFinal(`${color.bold(config.title)}\n${summary}`);
      resolve(result);
    };

    const onKeypress = (key: KeypressEvent): void => {
      if (isCancel(key)) return finish(undefined);

      const visible = filtered();

      if (key?.name === 'up') {
        cursor = moveCursor(visible, cursor, -1);
        return screen.render();
      }

      if (key?.name === 'down') {
        cursor = moveCursor(visible, cursor, 1);
        return screen.render();
      }

      if (key?.name === 'return' || key?.name === 'enter') {
        const chosen = visible[cursor];

        if (chosen && !chosen.option.locked) finish(chosen.index);

        return;
      }

      if (key?.name === 'backspace') {
        query = query.slice(0, -1);
        cursor = firstSelectable(filtered());
        return screen.render();
      }

      if (isTextInput(key)) {
        query += key.sequence;
        cursor = firstSelectable(filtered());
        screen.render();
      }
    };

    const screen = createScreen(buildLines, onKeypress);

    screen.render();
  });
};

const initialSelection = (options: SelectOption[]): Set<number> =>
  new Set(
    options
      .map((option, index) => ({ option, index }))
      .filter(({ option }) => option.selected || option.locked)
      .map(({ index }) => index)
  );

export const interactiveMultiSelect = (
  config: SelectConfig
): Promise<number[] | undefined> => {
  const { options, maxVisible = DEFAULT_MAX_VISIBLE, footer } = config;

  return new Promise((resolve) => {
    let query = '';
    const selected = initialSelection(options);

    const filtered = (): FilteredOption[] =>
      options
        .map((option, index) => ({ option, index }))
        .filter(({ option }) => matches(option, query));

    let cursor = firstSelectable(filtered());

    const renderRow: SelectRowRenderer = ({ option, index }, isActive) => {
      const box = option.locked
        ? color.dim('[x]')
        : selected.has(index)
          ? color.green('[x]')
          : '[ ]';

      return ` ${pointerFor(option, isActive)} ${box} ${labelStyle(option, isActive)}`;
    };

    const buildLines = (): string[] => {
      const visible = filtered();

      if (visible.length === 0)
        return withFooter(
          [
            ...header(config, query),
            color.dim('  No matching specializations.'),
          ],
          footer
        );

      return withFooter(
        [
          ...header(config, query),
          ...visibleRows(visible, cursor, maxVisible, renderRow),
        ],
        footer
      );
    };

    const finish = (result: number[] | undefined): void => {
      const summary =
        result === undefined
          ? color.dim('Cancelled')
          : result.length === 0
            ? color.dim('Specializations: none')
            : `${color.green('Specializations:')} ${result
                .map((index) => options[index]?.label)
                .join(', ')}`;

      screen.writeFinal(`${color.bold(config.title)}\n${summary}`);
      resolve(result);
    };

    const onKeypress = (key: KeypressEvent): void => {
      if (isCancel(key)) return finish(undefined);

      const visible = filtered();

      if (key?.name === 'up') {
        cursor = moveCursor(visible, cursor, -1);
        return screen.render();
      }

      if (key?.name === 'down') {
        cursor = moveCursor(visible, cursor, 1);
        return screen.render();
      }

      if (key?.name === 'space') {
        const chosen = visible[cursor];

        if (chosen && !chosen.option.locked) {
          if (selected.has(chosen.index)) selected.delete(chosen.index);
          else selected.add(chosen.index);

          screen.render();
        }

        return;
      }

      if (key?.name === 'return' || key?.name === 'enter')
        return finish([...selected].sort((left, right) => left - right));

      if (key?.name === 'backspace') {
        query = query.slice(0, -1);
        cursor = firstSelectable(filtered());
        return screen.render();
      }

      if (isTextInput(key)) {
        query += key.sequence;
        cursor = firstSelectable(filtered());
        screen.render();
      }
    };

    const screen = createScreen(buildLines, onKeypress);

    screen.render();
  });
};
