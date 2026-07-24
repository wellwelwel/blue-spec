# interpreter hook: Flag dynamic-code-execution sinks

> Sweep a codebase for dynamic-code-execution sinks across languages, or score a single snippet, from the command line.

Canonical: https://lagune.ai/docs/hooks/interpreter
Last updated: 2026-07-24

The `interpreter` hook flags **dynamic-code-execution sinks**: constructs that turn data into running code or hand it to a shell, from `eval` to native deserialization. It is language-aware, reading each file by its own rules, and it is the deterministic engine behind the [`interpreter` sub-skill](https://lagune.ai/docs/commands/skills), which you can run yourself in **scan** or **check** mode.

## Run it

**Scan the codebase**

```bash
node ./.lagune/hooks/interpreter.mjs           # scans the whole project
node ./.lagune/hooks/interpreter.mjs -d src    # scans a directory
node ./.lagune/hooks/interpreter.mjs -f app.py # scans a single file
```

**Check a snippet**

```bash
node ./.lagune/hooks/interpreter.mjs -l javascript -p 'eval(x)'    # => careful
node ./.lagune/hooks/interpreter.mjs -l python -p 'json.loads(x)'  # => safe
```

These sinks are dual-use: whether attacker-influenced input reaches one is undecidable by a static scan, so every match is a **caution to review**, never a confirmed finding. The scan prints a single **Dynamic-execution sinks to review** section, grouped by file. A clean run prints `no dynamic-execution sinks found`.

**Read the flagged code, never run it!**

Reason about each sink **statically**, tracing whether untrusted input reaches it. Never execute or `eval` the flagged code, nor any remote or runtime-fetched code it pulls in, to "test" what it does.

## How to read the verdict

| Verdict   | Meaning                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| `careful` | The snippet contains a dynamic-execution sink for its language. Review it by reading, never by running it. |
| `safe`    | No dynamic-execution sink was found for the given language.                                                |

### CLI options

| Option      | Alias | Value          | Description                                                                                       |
| ----------- | ----- | -------------- | ------------------------------------------------------------------------------------------------- |
| `--pattern` | `-p`  | a code snippet | Check one snippet. Repeat to check several, one verdict per line.                                 |
| `--lang`    | `-l`  | a language     | Required with `-p`: one of javascript, python, php, ruby, java, kotlin, go, rust, c, cpp, csharp. |
| `--dir`     | `-d`  | a directory    | Scope a scan to a directory. Repeats and combines with `-f`.                                      |
| `--file`    | `-f`  | a file         | Scope a scan to a single file. Repeats and combines with `-d`.                                    |

With no option it scans the whole project. `-p` needs `-l` and cannot be combined with `-d` or `-f`.

### Supported languages

The scan reads these languages, keyed by file extension, each checked against its own set of dynamic-execution sinks.

| #   | Language                    | Extensions                                                                                                   | Sinks it flags                                                                                                                                                                                                |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **JavaScript / TypeScript** | `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, `.cts`, `.astro`, `.vue`, `.svelte`, `.marko`, `.riot` | `eval()`, Function constructor, string-body `setTimeout`/`setInterval`, `vm` module, `child_process` exec, dynamic `require()`, dynamic `import()`                                                            |
| 2   | **Python**                  | `.py`, `.pyi`                                                                                                | `eval`/`exec`, `__import__()`, `os.system`/`os.popen`, `subprocess` `shell=True`, `pickle.load`/`loads`, `yaml.load` (unsafe)                                                                                 |
| 3   | **Ruby**                    | `.rb`                                                                                                        | eval family (`instance_eval`/`class_eval`/`module_eval`/`eval`), `system`/`exec`, backticks or `%x`, `Kernel#open` / `IO.popen`/`read`/`binread` / `Open3`, `Process.spawn`, `Marshal.load`                   |
| 4   | **Go**                      | `.go`                                                                                                        | `exec.Command`/`exec.CommandContext`, `plugin.Open`                                                                                                                                                           |
| 5   | **PHP**                     | `.php`                                                                                                       | `eval()`, `assert()` on string, `create_function()`, shell exec (`system`/`exec`/`shell_exec`/`passthru`/`popen`/`proc_open`), `call_user_func`/`call_user_func_array`, `include`/`require` with runtime path |
| 6   | **Rust**                    | `.rs`                                                                                                        | `Command::new`, `process::Command`                                                                                                                                                                            |
| 7   | **Java**                    | `.java`                                                                                                      | `Runtime.exec`, `ProcessBuilder`, `ScriptEngine`, `ObjectInputStream.readObject`                                                                                                                              |
| 8   | **Kotlin**                  | `.kt`, `.kts`                                                                                                | The JVM sinks: `Runtime.exec`, `ProcessBuilder`, `ScriptEngine`, `ObjectInputStream.readObject`                                                                                                               |
| 9   | **C#**                      | `.cs`                                                                                                        | `Process.Start` / `new Process`, `BinaryFormatter`, `Assembly.Load`                                                                                                                                           |
| 10  | **C**                       | `.c`, `.h`                                                                                                   | `system()`, `popen()`, the `exec*` family (`execl`, `execve`, `execvp`, …)                                                                                                                                    |
| 11  | **C++**                     | `.cc`, `.cpp`, `.cxx`, `.hpp`, `.hh`, `.hxx`                                                                 | `system()`, `popen()`, the `exec*` family (`execl`, `execve`, `execvp`, …)                                                                                                                                    |

**Best-effort, not exhaustive**

It reads source as text, so a sink assembled at runtime, hidden behind an alias, or written in a form it does not recognize can slip past. Treat the table as a strong starting point, not a complete inventory.

**Tip**

The hook guarantees the floor (these sinks exist and where): whether an untrusted value actually reaches one is the judgment the [`interpreter` sub-skill](https://lagune.ai/docs/commands/skills) covers.

## Frequently Asked Questions

### Does the interpreter hook confirm a vulnerability?

No. It flags dynamic-execution sinks as a caution to review, never a confirmed finding, because whether attacker-influenced input reaches the sink cannot be decided by a static scan.

### Which languages does the interpreter hook cover?

It reads the languages in the Supported languages table, keyed by file extension, each checked against its own set of sinks. Other languages produce no sinks.
