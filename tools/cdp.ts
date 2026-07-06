/**
 * Playwright screenshot + DOM-measure helper for visual verification.
 *
 *   npx tsx tools/cdp.ts \
 *     --out ./temp/shots \
 *     --shot 'dashboard|http://localhost:5173/?theme=dark' \
 *     --measure '(() => ({ title: document.querySelector("h1")?.textContent }))()'
 *
 * Each `--shot` is `label|url`. `--measure` runs on every shot and its value is
 * printed next to the shot. `--attach <port>` reuses a Chromium already exposing
 * a CDP endpoint instead of launching one.
 */
import type { Browser, Page } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

type Shot = { label: string; url: string };

type Options = {
  attachPort: number | null;
  out: string;
  width: number;
  height: number;
  scale: number;
  settleMs: number;
  measure: string | null;
  shots: Shot[];
};

type MeasureResult = { label: string; file: string; value: unknown };

const NAVIGATION_TIMEOUT_MS = 30_000;
const MAX_CAPTURE_HEIGHT = 16_384;

const slug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseShot = (raw: string): Shot => {
  const separator = raw.indexOf('|');

  if (separator < 0) throw new Error(`--shot must be "label|url", got: ${raw}`);

  return {
    label: raw.slice(0, separator).trim(),
    url: raw.slice(separator + 1).trim(),
  };
};

const parseArguments = (argv: string[]): Options => {
  const options: Options = {
    attachPort: null,
    out: './temp/cdp-shots',
    width: 1440,
    height: 1200,
    scale: 2,
    settleMs: 1400,
    measure: null,
    shots: [],
  };

  const applyFlag: Record<string, (value: string) => void> = {
    '--attach': (value) => {
      options.attachPort = Number(value);
    },
    '--out': (value) => {
      options.out = value;
    },
    '--width': (value) => {
      options.width = Number(value);
    },
    '--height': (value) => {
      options.height = Number(value);
    },
    '--scale': (value) => {
      options.scale = Number(value);
    },
    '--settle': (value) => {
      options.settleMs = Number(value);
    },
    '--measure': (value) => {
      options.measure = value;
    },
    '--shot': (value) => {
      options.shots.push(parseShot(value));
    },
  };

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    const apply = applyFlag[flag];

    if (!apply) throw new Error(`Unknown flag: ${flag}`);
    if (value === undefined) throw new Error(`Missing value for ${flag}`);

    apply(value);
  }

  if (options.shots.length === 0)
    throw new Error('At least one --shot "label|url" is required');

  return options;
};

const launchBrowser = async (): Promise<Browser> => {
  try {
    return await chromium.launch({ chromiumSandbox: true });
  } catch {
    return chromium.launch({ channel: 'chrome', chromiumSandbox: true });
  }
};

const openBrowser = (attachPort: number | null): Promise<Browser> =>
  attachPort === null
    ? launchBrowser()
    : chromium.connectOverCDP(`http://127.0.0.1:${attachPort}`);

const openPage = async (browser: Browser, options: Options): Promise<Page> => {
  const context = await browser.newContext({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: options.scale,
  });

  return context.newPage();
};

const contentHeight = (page: Page): Promise<number> =>
  page.evaluate<number>(
    'Math.ceil(Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0))'
  );

/* `fullPage: true` relies on Chromium's captureBeyondViewport, which never
   paints layers the page composited on its own (an element with an animated
   transform/opacity, a sticky rail, and so on), so they vanish from the shot.
   Growing the viewport to the whole document and taking a plain viewport shot
   keeps every layer on screen and captures it as the user sees it. */
const fitViewportToContent = async (
  page: Page,
  width: number
): Promise<void> => {
  const initial = Math.min(await contentHeight(page), MAX_CAPTURE_HEIGHT);
  await page.setViewportSize({ width, height: initial });

  const settled = Math.min(await contentHeight(page), MAX_CAPTURE_HEIGHT);
  if (settled !== initial)
    await page.setViewportSize({ width, height: settled });
};

const measureShot = async (
  page: Page,
  expression: string,
  label: string
): Promise<unknown> => {
  try {
    return await page.evaluate<unknown>(expression);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new Error(`--measure failed on "${label}": ${reason}`);
  }
};

const captureShot = async (
  page: Page,
  shot: Shot,
  options: Options
): Promise<MeasureResult | null> => {
  const file = `${slug(shot.label)}.png`;

  await page.setViewportSize({ width: options.width, height: options.height });
  await page.goto(shot.url, {
    waitUntil: 'load',
    timeout: NAVIGATION_TIMEOUT_MS,
  });
  await page.waitForTimeout(options.settleMs);

  const measured =
    options.measure === null
      ? null
      : {
          label: shot.label,
          file,
          value: await measureShot(page, options.measure, shot.label),
        };

  await fitViewportToContent(page, options.width);
  await page.screenshot({
    path: join(options.out, file),
    fullPage: false,
    animations: 'disabled',
    scale: 'device',
  });

  return measured;
};

const captureShots = async (
  page: Page,
  options: Options
): Promise<MeasureResult[]> => {
  const results: MeasureResult[] = [];

  for (const shot of options.shots) {
    const measured = await captureShot(page, shot, options);

    if (measured) results.push(measured);
  }

  return results;
};

const run = async (): Promise<void> => {
  const options = parseArguments(process.argv.slice(2));

  await mkdir(options.out, { recursive: true });

  const browser = await openBrowser(options.attachPort);

  try {
    const page = await openPage(browser, options);
    const shots = await captureShots(page, options);

    process.stdout.write(
      `${JSON.stringify({ out: options.out, shots }, null, 2)}\n`
    );
  } finally {
    await browser.close();
  }
};

run().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
});
