import { join } from 'node:path';
import { describe, it, strict } from 'poku';
import { scan } from '../../../src/hooks/regex/scan.js';
import { newWorkspace, writeFiles } from './__utils__.js';

await describe('scan maps unsafe regex across a path, language-gated', async () => {
  const withWorkspace = async (
    files: Record<string, string>,
    assert: (result: Awaited<ReturnType<typeof scan>>) => void
  ) => {
    const workspace = await newWorkspace();

    await writeFiles(workspace, files);

    assert(await scan(workspace, [workspace]));
  };

  await it('finds the unsafe pattern in any language and ignores prose', async () => {
    await withWorkspace(
      {
        'auth.js': 'const re = /(a+)+$/;\nconst label = "just a message here";',
        'parse.py': 'pattern = "(.*)x"',
        'route.go': 'var ok = regexp.MustCompile("[a-z0-9_]+")',
        'readme.md': 'This describes the feature in plain words.',
      },
      ({ unsafe }) => {
        const seen = unsafe.map((f) => `${f.file}:${f.source}`).toSorted();

        strict.deepStrictEqual(seen, ['auth.js:(a+)+$', 'parse.py:(.*)x']);
      }
    );
  });

  await it('is deterministic across repeated runs', async () => {
    await withWorkspace(
      { 'a.js': 'const x = /(a+)+$/; const y = /(.+)$/;' },
      ({ unsafe }) => {
        strict.deepStrictEqual(unsafe.map((f) => f.source).toSorted(), [
          '(.+)$',
          '(a+)+$',
        ]);
      }
    );
  });

  await it('unions several targets and lists each file once', async () => {
    const workspace = await newWorkspace();

    await writeFiles(workspace, {
      'src/a.js': 'const re = /(a+)+$/;',
      'lib/b.js': 'const re = /(.+)$/;',
    });

    const { unsafe } = await scan(workspace, [
      join(workspace, 'src'),
      join(workspace, 'lib'),
      join(workspace, 'src', 'a.js'),
    ]);

    strict.deepStrictEqual(
      unsafe.map((f) => `${f.file}:${f.source}`).toSorted(),
      [join('lib', 'b.js') + ':(.+)$', join('src', 'a.js') + ':(a+)+$']
    );
  });

  await it('honors a tighter repetition limit passed to scan', async () => {
    const workspace = await newWorkspace();

    await writeFiles(workspace, { 'a.js': 'const re = /a?a?a?/;' });

    const loose = await scan(workspace, [workspace]);
    const tight = await scan(workspace, [workspace], 2);

    strict.deepStrictEqual(loose.unsafe, []);
    strict.deepStrictEqual(
      tight.unsafe.map((f) => f.source),
      ['a?a?a?']
    );
  });

  await it('lists files that build a regex dynamically, ignoring static literals', async () => {
    await withWorkspace(
      {
        'router.js': 'const re = new RegExp(userInput);',
        'validate.py': 're.compile(base + suffix)',
        'static.go': 'var ok = regexp.MustCompile("[a-z]+")',
        'plain.js': 'const re = new RegExp("(a+)+$");',
      },
      ({ dynamic }) => {
        strict.deepStrictEqual(dynamic, ['router.js', 'validate.py']);
      }
    );
  });

  await it('returns empty lists for an unreadable path', async () => {
    const result = await scan('/nope', ['/nope/missing']);

    strict.deepStrictEqual(result, { unsafe: [], dynamic: [], staticWrap: [] });
  });

  await it('silences false positives that fooled the agnostic scan', async () => {
    await withWorkspace(
      {
        'reporter.ts': 'const line = `${a ? b : c} ${d.relative}`;',
        'url.ts': 'const u = `${base}?t=${now()}`;',
        'page.tsx': 'const copy = "Installing Foo with Bar + Baz";',
        'lint.sh': 'prettier --write .github/workflows/*.yml .',
      },
      ({ unsafe, dynamic, staticWrap }) => {
        strict.deepStrictEqual(unsafe, []);
        strict.deepStrictEqual(dynamic, []);
        strict.deepStrictEqual(staticWrap, []);
      }
    );
  });

  await it('does not leak one language form into another', async () => {
    await withWorkspace(
      {
        'real.rb': 'rx = /user-#{id}/',
        'fake.js': 'const note = "/user-#{id}/ is ruby";',
        'real.pl': 'my $re = qr/$pat/;',
        'fake.ts': 'const note = "qr/$pat/ is perl";',
      },
      ({ dynamic }) => {
        strict.deepStrictEqual(dynamic, ['real.pl', 'real.rb']);
      }
    );
  });

  await it('skips files of an unknown language entirely', async () => {
    await withWorkspace(
      { 'glob.sh': 'grep -E "(a+)+$" file && ls *.yml' },
      ({ unsafe, dynamic, staticWrap }) => {
        strict.deepStrictEqual(unsafe, []);
        strict.deepStrictEqual(dynamic, []);
        strict.deepStrictEqual(staticWrap, []);
      }
    );
  });

  await it('treats single-file component extensions as JavaScript', async () => {
    await withWorkspace(
      {
        'a.vue': '<script>const re = /(a+)+$/;</script>',
        'b.svelte': '<script>const re = /(a+)+$/;</script>',
        'c.marko': '<script>const re = /(a+)+$/;</script>',
        'd.riot': '<script>const re = /(a+)+$/;</script>',
      },
      ({ unsafe }) => {
        strict.deepStrictEqual(unsafe.map((f) => f.file).toSorted(), [
          'a.vue',
          'b.svelte',
          'c.marko',
          'd.riot',
        ]);
      }
    );
  });

  await it('lists files that wrap a static regex in a constructor, JS and Ruby only', async () => {
    await withWorkspace(
      {
        'wrap.js': 'const re = new RegExp("(a+)+$");',
        'wrap.rb': 'rx = Regexp.new("\\\\d+")',
        'python.py': 're.compile("\\\\d+")',
        'go.go': 'regexp.MustCompile("[a-z]+")',
        'dynamic.js': 'const re = new RegExp(userInput);',
      },
      ({ staticWrap }) => {
        strict.deepStrictEqual(staticWrap, ['wrap.js', 'wrap.rb']);
      }
    );
  });

  await it('classifies the new languages end to end', async () => {
    await withWorkspace(
      {
        'core.clj': '(re-find #"[0-9]+" s)',
        'app.ex': 'Regex.compile(pattern)',
        'stats.R': 'grepl(pattern, x)',
        'parser.c': 'regcomp(&re, argv[1], 0);',
        'plain.go': 'regexp.MustCompile("[a-z]+")',
      },
      ({ dynamic, staticWrap }) => {
        strict.deepStrictEqual(dynamic, ['app.ex', 'parser.c', 'stats.R']);
        strict.deepStrictEqual(staticWrap, ['core.clj']);
      }
    );
  });

  await it('skips common non-source extensions, test files, and env files', async () => {
    await withWorkspace(
      {
        'app.js': 'const re = /(a+)+$/;',
        'app.test.js': 'const re = /(a+)+$/;',
        'app.spec.ts': 'const re = /(a+)+$/;',
        'data.json': '{"re": "(a+)+$"}',
        'notes.md': 'a pattern (a+)+$ in prose',
        '.env': 'SECRET="(a+)+$"',
        '.env.production': 'SECRET="(a+)+$"',
      },
      ({ unsafe }) => {
        strict.deepStrictEqual(
          unsafe.map((f) => f.file),
          ['app.js']
        );
      }
    );
  });

  await it('skips unambiguous dependency and cache dirs across ecosystems', async () => {
    const workspace = await newWorkspace();
    const pattern = 'const re = /(a+)+$/;';
    const files: Record<string, string> = { 'app.js': pattern };

    for (const dir of [
      'node_modules',
      '.next',
      '__pycache__',
      '.venv',
      'Pods',
      'pkg.egg-info',
    ])
      files[join(dir, 'noise.js')] = pattern;

    await writeFiles(workspace, files);

    const { unsafe } = await scan(workspace, [workspace]);

    strict.deepStrictEqual(
      unsafe.map((f) => f.file),
      ['app.js']
    );
  });

  await it('scans ambiguous dirs that may hold real source', async () => {
    const workspace = await newWorkspace();
    const pattern = 'const re = /(a+)+$/;';
    const files: Record<string, string> = Object.create(null);

    for (const dir of ['dist', 'build', 'bin', 'vendor'])
      files[join(dir, 'tool.js')] = pattern;

    await writeFiles(workspace, files);

    const { unsafe } = await scan(workspace, [workspace]);

    strict.deepStrictEqual(unsafe.map((f) => f.file).toSorted(), [
      join('bin', 'tool.js'),
      join('build', 'tool.js'),
      join('dist', 'tool.js'),
      join('vendor', 'tool.js'),
    ]);
  });

  await it('ignores the root .lagune dir and any lagune.* dir', async () => {
    const workspace = await newWorkspace();
    const pattern = 'const re = /(a+)+$/;';
    const files: Record<string, string> = { 'kept.js': pattern };

    for (const dir of ['.lagune', 'lagune.detect', 'src/lagune.cache'])
      files[join(dir, 'noise.js')] = pattern;

    await writeFiles(workspace, files);

    const { unsafe } = await scan(workspace, [workspace]);

    strict.deepStrictEqual(
      unsafe.map((f) => f.file),
      ['kept.js']
    );
  });

  await it('scans a .lagune dir that is not at the project root', async () => {
    const workspace = await newWorkspace();

    await writeFiles(workspace, {
      'pkg/.lagune/r.js': 'const re = /(a+)+$/;',
    });

    const { unsafe } = await scan(workspace, [workspace]);

    strict.deepStrictEqual(
      unsafe.map((f) => f.file),
      [join('pkg', '.lagune', 'r.js')]
    );
  });
});
