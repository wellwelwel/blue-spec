import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chdir, cwd } from 'node:process';
import { describe, it, strict } from 'poku';
import { parseArgs, run } from '../../../src/hooks/regex/cli.js';

describe('parseArgs chooses a mode from the flags', () => {
  it('defaults to a whole-project scan with no flags', () => {
    strict.deepStrictEqual(parseArgs([]), {
      mode: 'scan',
      targets: [],
      repetitionLimit: undefined,
    });
  });

  it('scopes the scan with -d or -f', () => {
    strict.deepStrictEqual(parseArgs(['-d', 'src/auth']), {
      mode: 'scan',
      targets: ['src/auth'],
      repetitionLimit: undefined,
    });
    strict.deepStrictEqual(parseArgs(['-f', 'src/auth.ts']), {
      mode: 'scan',
      targets: ['src/auth.ts'],
      repetitionLimit: undefined,
    });
  });

  it('collects several -d and -f targets, dirs before files', () => {
    strict.deepStrictEqual(
      parseArgs(['-d', 'src', '-d', 'lib', '-f', 'a.ts']),
      {
        mode: 'scan',
        targets: ['src', 'lib', 'a.ts'],
        repetitionLimit: undefined,
      }
    );
  });

  it('applies -l to a scan as well as a check', () => {
    strict.deepStrictEqual(parseArgs(['-d', 'src', '-l', '10']), {
      mode: 'scan',
      targets: ['src'],
      repetitionLimit: 10,
    });
    strict.deepStrictEqual(parseArgs(['-l', '10']), {
      mode: 'scan',
      targets: [],
      repetitionLimit: 10,
    });
  });

  it('collects one or many -p patterns in order', () => {
    strict.deepStrictEqual(parseArgs(['-p', '(a+)+']), {
      mode: 'check',
      patterns: ['(a+)+'],
      repetitionLimit: undefined,
    });
    strict.deepStrictEqual(parseArgs(['-p', 'a', '-p', 'b', '-p', 'c']), {
      mode: 'check',
      patterns: ['a', 'b', 'c'],
      repetitionLimit: undefined,
    });
  });

  it('reads -l into the repetition limit for the checks', () => {
    strict.deepStrictEqual(parseArgs(['-p', 'a?a?a?', '-l', '2']), {
      mode: 'check',
      patterns: ['a?a?a?'],
      repetitionLimit: 2,
    });
  });

  it('accepts the long-form aliases', () => {
    strict.deepStrictEqual(parseArgs(['--pattern', '(a+)+', '--limit', '3']), {
      mode: 'check',
      patterns: ['(a+)+'],
      repetitionLimit: 3,
    });
    strict.deepStrictEqual(parseArgs(['--dir', 'src']), {
      mode: 'scan',
      targets: ['src'],
      repetitionLimit: undefined,
    });
    strict.deepStrictEqual(parseArgs(['--file', 'src/a.ts']), {
      mode: 'scan',
      targets: ['src/a.ts'],
      repetitionLimit: undefined,
    });
  });

  it('rejects mixing a pattern check with a scan scope', () => {
    strict.throws(() => parseArgs(['-p', '(a+)+', '-d', 'src']), {
      message: '-p checks a pattern and cannot be combined with -d or -f',
    });
    strict.throws(() => parseArgs(['-p', '(a+)+', '-f', 'a.ts']), {
      message: '-p checks a pattern and cannot be combined with -d or -f',
    });
  });

  it('rejects a flag with no value', () => {
    for (const args of [['-p'], ['-d'], ['-f'], ['-l'], ['--file']])
      strict.throws(() => parseArgs(args), {
        code: 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE',
      });
  });

  it('does not swallow a following flag as a value', () => {
    for (const args of [
      ['-l', '-p', '(a+)+'],
      ['-p', '-f', 'x'],
      ['-p', '-d'],
    ])
      strict.throws(() => parseArgs(args), {
        code: 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE',
      });
  });

  it('rejects a repetition limit that is not a plain decimal integer', () => {
    for (const bad of ['', '0x10', '+7', '1.5', 'abc', ' 5 ']) {
      strict.throws(() => parseArgs(['-p', 'a', '-l', bad]), {
        message: `repetition limit must be a non-negative integer, got "${bad}"`,
      });
    }
  });

  it('rejects a dash-prefixed limit at the parser, before parseLimit', () => {
    strict.throws(() => parseArgs(['-p', 'a', '-l', '-1']), {
      code: 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE',
    });
  });

  it('rejects an unknown flag and a bare positional', () => {
    strict.throws(() => parseArgs(['--bogus']), {
      code: 'ERR_PARSE_ARGS_UNKNOWN_OPTION',
    });
    strict.throws(() => parseArgs(['(a+)+']), {
      code: 'ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL',
    });
  });
});

describe('run dispatches the check mode', () => {
  it('prints one verdict per pattern, in order, newline-terminated', async () => {
    strict.deepStrictEqual(
      await run(['-p', '(a+)+$', '-p', '^[a-z]+$', '-p', '(']),
      { output: 'unsafe\nsafe\ninvalid regex\n', hasFinding: true }
    );
  });

  it('applies the shared limit to every pattern', async () => {
    strict.deepStrictEqual(await run(['-p', 'a?a?a?', '-l', '2']), {
      output: 'unsafe\n',
      hasFinding: true,
    });
  });

  it('reports a finding only for unsafe, not safe or invalid', async () => {
    strict.deepStrictEqual(await run(['-p', '^[a-z]+$', '-p', '(']), {
      output: 'safe\ninvalid regex\n',
      hasFinding: false,
    });
  });
});

await describe('run dispatches the scan mode', async () => {
  const inWorkspace = async (
    run_: () => Promise<void>,
    seed: string
  ): Promise<void> => {
    const workspace = await mkdtemp(join(tmpdir(), 'lagune-regex-cli-'));
    const previous = cwd();

    try {
      await writeFile(join(workspace, 'app.js'), seed, 'utf8');
      chdir(workspace);
      await run_();
    } finally {
      chdir(previous);
      await rm(workspace, { recursive: true, force: true });
    }
  };

  await it('scans the whole project from cwd when given no scope', async () => {
    await inWorkspace(async () => {
      strict.deepStrictEqual(await run([]), {
        output: 'Vulnerable regular expressions found:\n\napp.js\n  (a+)+$\n',
        hasFinding: true,
      });
    }, 'const re = /(a+)+$/;\n');
  });

  await it('scans only the directory named by -d', async () => {
    await inWorkspace(async () => {
      strict.deepStrictEqual(await run(['-d', '.']), {
        output: 'no unsafe patterns found\n',
        hasFinding: false,
      });
    }, 'const ok = /^[a-z]+$/;\n');
  });

  await it('tightens the scan verdict with -l', async () => {
    await inWorkspace(async () => {
      strict.deepStrictEqual(await run([]), {
        output: 'no unsafe patterns found\n',
        hasFinding: false,
      });
      strict.deepStrictEqual(await run(['-l', '2']), {
        output: 'Vulnerable regular expressions found:\n\napp.js\n  a?a?a?\n',
        hasFinding: true,
      });
    }, 'const re = /a?a?a?/;\n');
  });
});
