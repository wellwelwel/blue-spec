import { describe, it, strict } from 'poku';
import { parseCliArgs } from '../../../src/cli/parse-args.js';

describe('init parsing', () => {
  it('reads the agent from the first positional', () => {
    const parsed = parseCliArgs(['init', 'claude']);
    strict.strictEqual(parsed.command, 'init');
    strict.strictEqual(parsed.agent, 'claude');
    strict.strictEqual(parsed.skillsRequested, false);
    strict.deepStrictEqual(parsed.skills, []);
  });

  it('collects categories after the agent when --skills is present', () => {
    const parsed = parseCliArgs([
      'init',
      'claude',
      '--skills',
      'owasp',
      'javascript',
    ]);
    strict.strictEqual(parsed.command, 'init');
    strict.strictEqual(parsed.agent, 'claude');
    strict.strictEqual(parsed.skillsRequested, true);
    strict.deepStrictEqual(parsed.skills, ['owasp', 'javascript']);
  });

  it('marks skills requested with no values when --skills has no categories', () => {
    const parsed = parseCliArgs(['init', 'claude', '--skills']);
    strict.strictEqual(parsed.command, 'init');
    strict.strictEqual(parsed.agent, 'claude');
    strict.strictEqual(parsed.skillsRequested, true);
    strict.deepStrictEqual(parsed.skills, []);
  });
});

describe('update parsing', () => {
  it('parses as a command with no agent and no skills', () => {
    const parsed = parseCliArgs(['update']);
    strict.strictEqual(parsed.command, 'update');
    strict.strictEqual(parsed.agent, undefined);
    strict.strictEqual(parsed.skillsRequested, false);
    strict.deepStrictEqual(parsed.skills, []);
  });

  it('ignores positionals after update', () => {
    const parsed = parseCliArgs(['update', 'claude']);
    strict.strictEqual(parsed.command, 'update');
    strict.strictEqual(parsed.agent, undefined);
    strict.deepStrictEqual(parsed.skills, []);
  });
});

describe('pull parsing', () => {
  it('parses as a command with no agent and no skills', () => {
    const parsed = parseCliArgs(['pull']);
    strict.strictEqual(parsed.command, 'pull');
    strict.strictEqual(parsed.agent, undefined);
    strict.deepStrictEqual(parsed.skills, []);
  });

  it('ignores positionals after pull', () => {
    const parsed = parseCliArgs(['pull', 'claude']);
    strict.strictEqual(parsed.command, 'pull');
    strict.strictEqual(parsed.agent, undefined);
  });
});

describe('add/remove/list parsing', () => {
  it('has no agent and reads categories from the first positional for add', () => {
    const parsed = parseCliArgs(['add', '--skills', 'owasp']);
    strict.strictEqual(parsed.command, 'add');
    strict.strictEqual(parsed.agent, undefined);
    strict.strictEqual(parsed.skillsRequested, true);
    strict.deepStrictEqual(parsed.skills, ['owasp']);
  });

  it('collects multiple categories for remove', () => {
    const parsed = parseCliArgs(['remove', '--skills', 'owasp', 'javascript']);
    strict.strictEqual(parsed.command, 'remove');
    strict.strictEqual(parsed.agent, undefined);
    strict.strictEqual(parsed.skillsRequested, true);
    strict.deepStrictEqual(parsed.skills, ['owasp', 'javascript']);
  });

  it('marks skills requested with no values for list', () => {
    const parsed = parseCliArgs(['list', '--skills']);
    strict.strictEqual(parsed.command, 'list');
    strict.strictEqual(parsed.agent, undefined);
    strict.strictEqual(parsed.skillsRequested, true);
    strict.strictEqual(parsed.findingsRequested, false);
    strict.deepStrictEqual(parsed.skills, []);
  });

  it('marks findings requested for list --findings', () => {
    const parsed = parseCliArgs(['list', '--findings']);
    strict.strictEqual(parsed.command, 'list');
    strict.strictEqual(parsed.findingsRequested, true);
    strict.strictEqual(parsed.skillsRequested, false);
  });

  it('marks both requested for list --findings --skills', () => {
    const parsed = parseCliArgs(['list', '--findings', '--skills']);
    strict.strictEqual(parsed.command, 'list');
    strict.strictEqual(parsed.findingsRequested, true);
    strict.strictEqual(parsed.skillsRequested, true);
  });

  it('leaves skills empty when --skills is absent', () => {
    const parsed = parseCliArgs(['add']);
    strict.strictEqual(parsed.command, 'add');
    strict.strictEqual(parsed.agent, undefined);
    strict.strictEqual(parsed.skillsRequested, false);
    strict.deepStrictEqual(parsed.skills, []);
  });

  it('does not collect positionals into skills without the --skills flag', () => {
    const parsed = parseCliArgs(['add', 'owasp']);
    strict.strictEqual(parsed.command, 'add');
    strict.strictEqual(parsed.skillsRequested, false);
    strict.deepStrictEqual(parsed.skills, []);
  });
});

describe('flags', () => {
  it('reports an unknown command as undefined and not bare', () => {
    const parsed = parseCliArgs(['bogus']);
    strict.strictEqual(parsed.command, undefined);
    strict.strictEqual(parsed.bare, false);
  });

  it('reads --help', () => {
    strict.strictEqual(parseCliArgs(['--help']).help, true);
  });

  it('reads -v as version', () => {
    strict.strictEqual(parseCliArgs(['-v']).version, true);
  });

  it('reads --version', () => {
    strict.strictEqual(parseCliArgs(['--version']).version, true);
  });

  it('leaves port undefined when --port is absent', () => {
    strict.strictEqual(parseCliArgs(['dashboard']).port, undefined);
  });

  it('reads --port as a number', () => {
    strict.strictEqual(
      parseCliArgs(['dashboard', '--port', '3001']).port,
      3001
    );
  });

  it('reads the -p short alias for port', () => {
    strict.strictEqual(parseCliArgs(['dashboard', '-p', '3001']).port, 3001);
  });

  it('stays bare when only --port is given, so the dashboard opens', () => {
    const parsed = parseCliArgs(['--port', '5000']);
    strict.strictEqual(parsed.command, undefined);
    strict.strictEqual(parsed.bare, true);
    strict.strictEqual(parsed.port, 5000);
  });

  it('stays bare with the -p short alias alone', () => {
    const parsed = parseCliArgs(['-p', '5000']);
    strict.strictEqual(parsed.bare, true);
    strict.strictEqual(parsed.port, 5000);
  });

  it('is not bare when a flag routes elsewhere', () => {
    strict.strictEqual(parseCliArgs(['--help']).bare, false);
    strict.strictEqual(parseCliArgs(['--version']).bare, false);
    strict.strictEqual(parseCliArgs(['--skills']).bare, false);
  });

  it('rejects a non-numeric --port', () => {
    strict.throws(() => parseCliArgs(['dashboard', '--port', 'abc']));
  });

  it('rejects an out-of-range --port', () => {
    strict.throws(() => parseCliArgs(['dashboard', '--port', '70000']));
  });

  it('rejects --port 0 (reserved for the random default)', () => {
    strict.throws(() => parseCliArgs(['dashboard', '--port', '0']));
  });

  it('rejects a privileged --port below 1024', () => {
    strict.throws(() => parseCliArgs(['dashboard', '--port', '80']));
  });

  it('accepts --port 1024 as the minimum', () => {
    strict.strictEqual(
      parseCliArgs(['dashboard', '--port', '1024']).port,
      1024
    );
  });

  it('returns empty defaults for no arguments', () => {
    const parsed = parseCliArgs([]);
    strict.strictEqual(parsed.command, undefined);
    strict.strictEqual(parsed.agent, undefined);
    strict.deepStrictEqual(parsed.skills, []);
    strict.strictEqual(parsed.skillsRequested, false);
    strict.strictEqual(parsed.findingsRequested, false);
    strict.strictEqual(parsed.help, false);
    strict.strictEqual(parsed.version, false);
    strict.strictEqual(parsed.bare, true);
    strict.strictEqual(parsed.port, undefined);
  });
});
