# File path and filesystem vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://owasp.org/www-community/attacks/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

This terrain is **a filesystem path the application builds from a value it does not fully control, then opens, reads, writes, or loads**. Each variant defeats a check that compared the path as **text** while the OS resolved it as a **real location**. The defense: never let untrusted input choose the path, and when part of it must, resolve the path to its canonical location and confirm that location sits inside the boundary before touching it. (When the path instead names a **module or page the application executes or includes**, that is the `interpreter` surface, dynamic include and file resolution. When it names a **remote host, URL, or UNC share the server connects out to**, that is the `network` surface, SSRF. This terrain is the local file the application opens by path.)

### Path traversal (directory traversal)

A file operation builds its path from user input: a download endpoint `?file=report.pdf`, a template chosen by a cookie, an avatar saved under a user-supplied name, a log path from a config field. When the input can carry path syntax, the attacker steers the operation out of the intended directory with `../` sequences (climbing toward the root: `../../../../etc/passwd`, the app's own `.env`, a private key, source code) or with an **absolute path** that ignores the base entirely (`/etc/shadow`, `C:\Windows\...`). A read leaks files the feature never meant to expose, a write drops an attacker-chosen file at an attacker-chosen path (the door to the binary-planting case below), and a delete removes one.

The same `../` has many textual forms the filter never enumerated:

- **Percent-encoding and double-encoding** (`%2e%2e%2f`, `..%2f`, `%2e%2e%5c`, and the doubled `%252e%252e%255c`). A web container decodes one layer, so a filter that runs after one decode still loses to a value encoded twice.
- **Overlong UTF-8** (`..%c0%af` for `../`, `..%c1%9c` for `..\`), where an invalid multi-byte sequence decodes to a separator some runtimes still honor.
- **Both separators on Windows** (`/` and `\`), plus trailing `.`, ` `, `/`, or `\` that Windows tolerates on a filename, so `secret.txt.` or `secret.txt ` opens the same file while reading differently to a comparison.
- **Mixed and nested sequences** (`....//`, `..././`) that a single-pass "strip `../`" replace leaves a real `../` behind after it runs.

The null byte and the alternate data stream, below, are two more bypass forms, called out separately because they truncate or rename rather than climb.

Safer shapes, applied where they fit (prefer the first that the feature allows):

- **Take the path out of input entirely.** Map a validated key, ID, or index to a code-defined path (`{ report: './files/report.pdf', terms: './files/terms.pdf' }[key]`), and reject anything not in the map. An index into a code-side list is safer than echoing a name back.
- **Let the user supply only a leaf, never a path.** Surround the input with your own path code, accept a single filename with no separators, and reject any value containing `/`, `\`, `.`, a null byte, or a drive letter.
- **When a derived path is unavoidable, canonicalize then contain.** Decode every encoding layer first and reject anything that still decodes further, then resolve the full path to its real absolute form (`realpath`, `Path.normalize` then resolve against the base, `java.net.URI.normalize()`) and confirm the result still sits inside the intended base directory before opening it. Validate the canonical form, never the raw bytes.
- **Allowlist known-good, do not sanitize.** Accept only values matching a tight pattern, rather than trying to strip the dangerous ones. A single strip-and-continue pass is bypassable by nesting, rejection is not.
- **Keep a containment backstop.** Run file features under least privilege and a chroot, jail, or container so even a successful escape reaches little, keep secrets and source outside any servable web root, and never trust the path filter as the only barrier.

### Null-byte truncation (embedding null code)

A path that passes a suffix check can still open a different file, because the validator and the OS disagree on where the string ends. A null byte (`%00`, `\0`, `0x00`, or an alternate encoding of it) embedded in the input terminates the filename for a lower-level API written in C, while the higher-level language sees the full string. So `?file=../../../../etc/passwd%00.pdf` passes an "it must end in `.pdf`" check in the application, yet the OS opens `/etc/passwd`. The same truncation defeats an "always append `.php`" assumption. The tell is a validator that trusts the **end** of the name (its extension) without rejecting embedded terminators first.

Safer shape: reject any input containing a null byte (or any control character) before it reaches a file API, then canonicalize and contain as above rather than reasoning about the extension at all. A modern runtime usually raises on an embedded null instead of truncating, but treat that as a backstop and reject it explicitly, so the suffix check cannot be fooled.

### NTFS alternate data streams (Windows `::$DATA`)

On NTFS, every file carries a default data stream named `$DATA`, and a file may hold extra named streams (`file.txt:hidden`). Two consequences matter when a name is built from input. First, **a check on the extension can be bypassed**: `script.asp::$DATA` (or `script.asp:`) names the same file's main stream, yet an extension parser sees `asp::$DATA`, not `asp`, so a handler keyed on the extension is skipped and the raw source is served instead of executed, the classic IIS source-disclosure flaw. Second, **a stream can hide content**: data written to `upload:payload` does not appear in directory listings or Explorer and can later be read or executed, so an upload validator that only inspects the visible file misses what was placed in an alternate stream. Any code that creates, names, or routes files by the end of the name should expect these suffixes.

Safer shape: reject any path containing `:` beyond a leading drive letter (`C:\`) before a file operation, so a stream suffix cannot ride along. Canonicalize and contain as above (the same resolve-then-confirm-inside-base step strips the stream alias), and key any execute-versus-serve decision on the file's real, validated identity, never on a substring of the requested name.

### Binary planting and loading from an untrusted location

The cases above steer **where** the application reads. This is an attacker controlling **what** sits at a location the application loads. A program that loads a library, plugin, helper binary, or config by a relative name, or from a directory writable by a lower-privileged actor, runs whatever is placed there. The classic forms: an installer leaves its application directory world-writable, so a local user drops a malicious `WININET.DLL` beside the executable and the next launch loads it instead of the system one. A Windows program calls `LoadLibrary("DWMAPI.DLL")` by bare name and resolves it from the **current working directory**, which an attacker sets to a network share by getting the victim to open a file there. Or any `require`/`import`/`dlopen`/`Assembly.Load` of a path the deployment does not lock down. No injection or user input is needed: loading code from a location someone else can write is itself the vulnerability (CWE-114, CWE-426 untrusted search path). This is the write/load twin of traversal, and a traversal **write** is what sets it up.

Safer shapes, applied where they fit:

- **Load by absolute, code-defined path** from a directory the application owns, never by bare name resolved through a search order, and never from the current working directory.
- **Lock down permissions** on every directory the application loads from or writes to: only the owning, privileged account may write, lower-privileged users may not. Treat a world-writable program or plugin directory as the finding.
- **Verify before running** code that must come from elsewhere: a signature against a pinned key or a checksum against a known-good hash over an authenticated channel (this overlaps the `interpreter` sub-skill's "loading code from an unverified origin", the integrity check is the same).
- **Constrain where uploads and generated files land.** A feature that writes a user-named or user-supplied file must place it outside any directory the application later loads from or serves as code, with a code-chosen name in a contained directory.

## How to act on the result

- **In detect (detection):** each confirmed file operation whose path an attacker can influence to leave its intended directory, end early, carry a hidden stream, or load code from a writable location is a finding. Record what it is (the read, write, delete, include, or load and the user-controlled value that shapes its path), why it matters (a file outside the boundary is read or overwritten, a suffix or upload check is bypassed, or attacker-placed code runs under the process's permissions), and the evidence (the function or endpoint where the value reaches the file API). Trace the data: a finding is real only when the input actually reaches the path, except the binary-planting case, which is a finding on the **location's permissions and the bare-name load**, not on a user value. Where the code validates a path by text (a `startsWith` base check, an extension suffix check, a single `../` strip), confirm a bypass before claiming one: cite a form that passes the code's own check yet resolves outside the base (an encoding layer it missed, a null byte, a stream alias, a nested sequence its single pass leaves behind). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when untrusted input can no longer choose the location. That means the path comes from a code-defined map or a contained leaf with separators, drive letters, null bytes, and `:` stream suffixes rejected, or, where a path is derived, it is canonicalized (after full decoding) and confirmed inside the intended base before any operation, with file features run under least privilege. For the load case, it holds only when code is loaded by absolute code-defined path from a directory only a privileged account can write, or verified by signature or checksum before it runs. If a crafted value can still reach a file outside the boundary, slip past a suffix or extension check, or cause code to load from a writable location, the risk is not closed: record it and point back to harden.
