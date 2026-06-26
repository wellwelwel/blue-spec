# Interpreter vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/> and <https://owasp.org/www-community/attacks/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### Dynamic code evaluation (eval injection)

A construct hands a string to the language's own evaluator at runtime: `eval`, `Function(...)`, `setTimeout`/`setInterval` with a string body, `vm`/`exec`-style runners, a template engine compiling a string, the equivalent in any language. When any part of that string comes from outside the code, the attacker runs whatever the language can run, under the process's permissions. The tell is string concatenation reaching the evaluator: an `arg` like `1; <command>` appended into `eval("x = " + arg)` runs the trailing statement.

Safer shape: remove the evaluator. The legitimate need behind a runtime `eval` is almost always a fixed set of operations or a data structure, so replace it with a lookup table mapping a validated key to a real function, a parser for the data format (`JSON.parse`, not `eval`), or plain branching. When dynamic behavior is genuinely required, run it in a sandbox that cannot reach the host (no filesystem, process, or network) and still validate the input against an allowlist first.

### Dynamic include, import, and file resolution

A path or module name built from user input is fed to an include/require/import or a file-resolution call: `include($_GET['page'] . '.php')`, an importer that loads "the module the user named", a template path assembled from a request value. The attacker redirects it to a file they control or one they should never reach, a remote URL, an uploaded file, a sibling path via `../`, a secret on disk. A trailing-suffix trick (a null byte, an extra extension, an encoded separator) can defeat a naive "we always append `.php`" assumption. This is code injection when the loaded file is then executed, and path traversal when it is merely read, often both at once.

Safer shape: never resolve a path or module from raw user input. Map a validated key to a fixed, code-defined path (`{ contact: './pages/contact', about: './pages/about' }[key]`), reject anything not in the map, and load only from a directory that holds nothing executable the feature should not expose. If a path must be derived, canonicalize it and confirm the result still sits inside the intended base directory before opening it.

### Function and method dispatch from a name

The code calls whatever the user names: `$action()`, `call_user_func($_GET['fn'])`, a dispatcher that does `obj[req.method]()`, reflection that resolves a class or method from a request string. Passing user-supplied arguments alongside the name (`call_user_func($fn, $arg)`) turns it into direct remote code execution, because `system`, a file writer, or a deserializer is just another callable name. Even without arguments, exposing every function in scope hands the attacker the dangerous ones.

Safer shape: dispatch through an explicit allowlist of permitted actions, mapping a validated key to a known handler, never calling a name straight from the request. The set of callable operations must be defined in the code, not chosen by the caller.

### Server-Side Includes (SSI) injection

A server that parses Server-Side Include directives (`.shtml`-style pages, or any templating that honors `<!--#...-->`) interprets those directives before serving the page. When a user value reaches a parsed-as-SSI context unescaped, an injected `<!--#exec cmd="..."-->` runs a shell command, and `<!--#include ...-->`, `<!--#echo var="..."-->`, or `<!--#config-->` read files, leak server variables, or reshape output, all under the web server's permissions. The tell is user input landing in a page the server interprets for SSI, often reachable only because SSI parsing is enabled where it is not needed.

Safer shape: disable SSI processing where the feature does not require it, the cleanest fix. Where it must stay on, keep untrusted input out of any SSI-parsed page, and if a value must appear, encode the SSI metacharacters (`< ! # = / . " - >`) so the directive markers cannot form. As with every surface here, the user value is data, never a directive.

### The log as an interpreter

A log line looks like inert output, but it is read again later: rendered in a dashboard, parsed by a shipper, grepped by an incident responder. That makes the log an interpreter, and untrusted text written into it raw becomes injection. A value carrying a newline forges a **second log entry** at the split, so a line that should read `parse failed for <value>` becomes two, the forged one wearing a real log level and a false actor. The same write is open to delimiter injection in a structured format, and to stored XSS or code execution where the log is later served or evaluated.

Closely related is **repudiation**: a log is only evidence if its actor cannot be forged. When the logged identity comes from a request header, a cookie, or a parameter the caller controls, an attacker writes `user=admin` into the record of their own action and the audit trail lies.

Safer shape: write through a structured logging API that encodes each untrusted value as one bound field, so a newline or delimiter cannot break out of it. Where plain-text logs are unavoidable, neutralize carriage returns and newlines on write. And take the actor for any entry from the authenticated server-side session, never from input the actor controls, so attribution holds.

### The HTTP response header as an interpreter

An HTTP response is a structured stream where a blank line (`CR LF CR LF`) ends the headers and begins the body, and each header sits on its own `CR LF`-terminated line. When user input is written into a response header without stripping those control characters, a value carrying `%0d%0a` injects new header lines, and a doubled one ends the headers early and starts a **second response the attacker fully controls**. The usual sink is a value reflected into `Location` (a redirect target), `Set-Cookie`, or any header built from a request parameter. This is **response splitting**: **cross-user defacement** delivers the forged response to another user sharing the connection (a proxy), and **cache poisoning** persists it in a shared cache so every later visitor is served the attacker's page until the entry expires.

Safer shape: never place raw user input in a response header. Prefer a framework API that sets headers as structured values (it rejects or encodes embedded control characters), and where a value must be reflected, strip or reject `CR` and `LF` before writing. As with the log, the value is one bound field, never a chance to start a new line. Most modern servers now refuse bare `CR`/`LF` in header values, but treat that as a backstop, not the fix.

### Untrusted data reaching an interpreter (the general rule)

Beyond running code, the same shape drives every injection family: a string assembled with user input is handed to an interpreter that parses instructions out of it, a SQL or NoSQL engine, an LDAP or XPath query, an RSQL or FIQL filter behind a REST `?filter=` parameter, an OS shell, an expression or template language, a network protocol stream. The interpreter need not be a standard one: a **custom or proprietary language or representation** the product itself defines (a homegrown command syntax, a control-character protocol, a template dialect) is interpreted just the same, so its reserved characters and keywords are an injection surface when user input reaches them unfiltered (the OWASP "Custom Special Character Injection" case). A crafted value (a quote that closes a string then an always-true clause, a shell `; <command>`, an LDAP `*`, or a reserved delimiter of your own format) rewrites the meaning.

Safer shapes, applied where they fit (in OWASP's priority order):

- **Use a safe, parameterized API.** The preferred option avoids the interpreter or separates data from instruction: a prepared statement with bound parameters for SQL, an ORM used without raw fragments, `ProcessBuilder`/`execve`-style argument arrays (command and each argument passed separately, never one assembled string) for OS commands, a query builder for LDAP/XPath. The data is never parsed as instruction. A stored procedure is not safe by being a stored procedure: if it concatenates user input into dynamic SQL inside, it injects like any other string-built query, so it must bind its parameters too. XPath rarely offers true binding, so the shape there is a precompiled query with a variable resolver, never a path assembled from request strings.
- **Validate the input, allowlist not blocklist.** Constrain the value to an explicitly allowed set or a tight pattern (`^[a-z0-9]{3,10}$`), reject anything else, and bound the length. Validation is a strong layer but **not a complete defense** on its own, since many fields legitimately need special characters, so it backs up a parameterized API rather than replacing it. Validate the **canonical** form, never the raw bytes: decode every layer first (percent-encoding, then a second round if the value was double-encoded, Unicode and overlong UTF-8, hex and HTML entities) and normalize, then check. A filter that runs before decoding is bypassed by `%2531` (an encoded `%`, which decodes to `%31`, then `1`) or a look-alike Unicode codepoint, the input passes the filter encoded and reaches the interpreter decoded. Canonicalize once, reject anything that still decodes further, then validate.
- **Contextually escape, only as a last resort.** When no parameterized interface exists (legacy code, an unusual interpreter), escape with the exact encoder for that interpreter and context. This is the frailest defense, easy to get subtly wrong, and never the first choice. The context can be finer than the interpreter: LDAP has two, a search filter and a distinguished name, with different character sets and different rules, so the right encoder depends on which one the value reaches.
- **Some places take no parameters.** Identifiers a query cannot bind (table or column names, a sort direction) must come from code-side values keyed by validated input, never spliced from the request.

For an OS shell, the command string is not the only untrusted input: the **environment** steers it too. A hardcoded `make` or `cat` still runs the attacker's binary when `$PATH` points at one, and a command path read from `$APPHOME` or a similar variable is attacker-controlled wherever the environment is. Safer shape: invoke commands by absolute path, reset or pin the environment (`PATH` above all) the child runs with, and never build a command path from an environment value, which an argument array alone does not cover (it picks the right arguments but not the right executable). Prefer a library call to shelling out at all (send mail through a mail API, not a `mail` subprocess), which removes the shell and its environment from the picture.

The same rule absorbs the metacharacter tricks. A **comment marker** (`#` or `--` in SQL, `#` in a shell, `<!--` in HTML) injected mid-string truncates the rest of the interpreter's parse, dropping a trailing `LIMIT`, a `-type f`, or visible output. A **delimiter or special element** (a `|` in a custom record format, a reserved macro symbol) splits one field into two, so an attacker appends `|admin|` to a profile and escalates. The defense does not change: a parameterized API or a strict format parser (never hand-joined strings), backed by allowlist validation.

NoSQL widens the surface in one way worth naming: the untrusted value can arrive as an **object, not a string**. A request that should carry `{ user: "alice" }` instead carries `{ user: { "$ne": null } }` or `{ "$where": "<js>" }`, injecting an operator or a server-side script through the shape of the input, where escaping a string would never have helped. Safer shape: build the query through the driver's typed API, reject any user-supplied key that begins with the engine's operator marker (`$` in MongoDB), validate the value's type against what the field expects, and disable server-side JavaScript evaluation (`$where`, `db.eval`) outright.

A note on what is **not** a fix: a Web Application Firewall is not the defense. WAF signatures are bypassed by the same interpreter's own flexibility, comment insertion, encoding, function synonyms, whitespace and case tricks, so a value that the WAF passes still reaches the parser unchanged. Treat a finding as open whenever the only thing standing between untrusted input and the parser is a filter.

### Package code as an interpreter

A package manager runs code you did not write. Installing a dependency executes its lifecycle scripts (`preinstall`, `postinstall`, `prepare`) with the developer's or CI's permissions, and importing it at runtime runs its entry point the same way. So the resolution step is itself an interpreter: you meant to call the package's published API, but the act of pulling it in already ran whatever it shipped. The danger is which package resolves. **Typosquatting** lands a malicious name one keystroke from a real one. **Dependency confusion** publishes a public package matching an internal name at a higher version, so the resolver prefers the attacker's. A **compromised maintainer account** ships malice in a new version of a package you already trust. **Slopsquatting** registers a name an AI assistant tends to hallucinate, waiting for a suggestion to be installed unread.

Safer shapes, applied where they fit:

- **Install from a committed lockfile** (`npm ci`, `--frozen-lockfile`), which pins exact versions and integrity hashes, so a swapped or higher-versioned package cannot slip in.
- **Disable lifecycle scripts by default** (`--ignore-scripts`, or `ignore-scripts=true` in `.npmrc`), and allowlist scripts only for the few packages that genuinely need to compile.
- **Vet before adding or upgrading.** Confirm the package exists and check its age, downloads, and repository before installing one, especially one an AI suggested. Let new versions settle before adopting them.
- **Verify integrity in CI** with pinned lockfiles and checksums, and generate an SBOM so every resolved dependency is accounted for.

### Loading code from an unverified origin (no integrity check)

The package case above is the resolver choosing the wrong code, this is the application loading code from a place it never verified. A class loaded from a network or filesystem location (`new URLClassLoader(url)` then `Class.forName(name, true, loader)` in Java, `Assembly.Load` from a path in .NET, a plugin, `.so`/`.dll`, or script read from a world-writable or attacker-reachable directory, a runtime "update" or "module" fetched over the network), then instantiated and run, executes whatever sits there under the process's permissions. If the origin is a writable directory, a downloaded file, or a channel an on-path attacker can rewrite (the classic applet over plain HTTP, intercepted and swapped), the loaded bytes are attacker-controlled, with no injection or user input needed: the act of loading is the interpreter (CWE-494, code loaded without an integrity check). The Java-specific facets of mutable mobile code that need no untrusted bytes at all (a non-final public field, a constructor-bypassing object hijack) live in the `java` sub-skill.

Safer shape: load executable code only from a fixed, code-defined, trusted location the application controls, never one assembled from input or writable by a lower-privileged actor. Where code must come from elsewhere, verify it before running it: a signature against a pinned public key, or a checksum against a known-good hash, fetched over an authenticated channel (TLS, not plain HTTP). Treat a missing integrity check on loaded code as the finding even when the path looks fixed today.

## How to act on the result

- **In detect (detection):** each confirmed path from an untrusted source to an interpreter is a finding. Describe it in plain language: what it is (the construct that interprets user input, one of the surfaces above), why it matters (the concrete impact, ranging from reading a file to full remote code execution under the process's permissions), and the evidence (the function or endpoint where the value reaches the interpreter). Trace the data: a finding is real only when an attacker-influenced value actually reaches the sink, so a fully code-defined string is not one. The integrity case is the one exception to "trace the value": code loaded and run from an origin the application never verified (a writable path, a downloaded file, a plain-HTTP fetch) is a finding on the **origin**, not on a user value, recorded the same way. It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when untrusted input no longer reaches the interpreter as instruction. For dynamic evaluation, include, and dispatch, that means the evaluator is gone or the user value is reduced to a validated key into a code-defined set. For the general interpreter case, that means a parameterized or safe API carries the data, with validation as a backing layer, escaping only where nothing else fits. For loaded code, it means the origin is fixed and trusted, or the bytes are verified by signature or checksum over an authenticated channel before they run. If a crafted value can still change what the interpreter does, or code from an unverified origin can still run, the risk is not closed: record it as such and point back to harden.
