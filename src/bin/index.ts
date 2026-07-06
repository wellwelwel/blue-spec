import process from 'node:process';
import { parseCliArgs } from '../cli/parse-args.js';
import { run } from '../cli/run.js';

const packageRoot = new URL('../../', import.meta.url);

try {
  const args = parseCliArgs(process.argv.slice(2));

  await run(args, process.cwd(), packageRoot);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
