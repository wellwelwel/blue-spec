# .NET-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/>, with Microsoft's BinaryFormatter security guidance.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### Insecure native deserialization (`BinaryFormatter` and friends)

The .NET counterpart to Java's `readObject` gadget chain. `BinaryFormatter`, `SoapFormatter`, `NetDataContractSerializer`, `LosFormatter`, and `ObjectStateFormatter` reconstruct an arbitrary object graph from a byte stream, running type constructors and callbacks as they go, so a crafted payload chains existing types into remote code execution before any application validation runs. Microsoft marks `BinaryFormatter` dangerous and obsolete and removed it from modern .NET, yet it lingers in caches, session stores, ViewState, message bodies, and "load this saved object" features. The danger is the byte source, not a literal call: anything that feeds attacker-influenced bytes into one of these deserializers is the risk, including a trusted-looking WCF channel, a cookie, or `ObjectStateFormatter` behind a tampered ViewState.

Text and contract serializers are not the same risk: `System.Text.Json`, `DataContractSerializer`, and `XmlSerializer` build declared types from data and do not invoke arbitrary types' code on load (`XmlSerializer` still needs the XXE care the `xml` surface covers, and `DataContractSerializer` must not be confused with `NetDataContractSerializer`, which carries the type name in the payload and is unsafe).

Safer shapes, applied where they fit:

- **Stop using `BinaryFormatter`/`SoapFormatter`/`NetDataContractSerializer` for untrusted data entirely.** Replace them with `System.Text.Json` or `DataContractSerializer`/`XmlSerializer` over a known, declared type. The cleanest fix is deleting the unsafe deserializer, not guarding it.
- **Bind to a fixed expected type**, never a type named in the payload, and never deserialize a domain or security object (a role, a principal) straight from input, the cookie-to-admin escalation the cheat sheet warns of. Where a serialized object must cross the network, sign or encrypt it and verify before deserializing, so a tampered payload is rejected before reconstruction. Run any unavoidable untrusted deserialization in a low-permission context, so a hostile object that tries to start a process or touch a resource is denied and flagged.

### XSS through .NET's escape hatches

`browser` owns XSS in general. .NET's specific trap is the helper that opts **out** of the framework's automatic encoding. Razor and Web Forms encode output by default, so the finding is the deliberate bypass on untrusted data: `@Html.Raw(value)`, the `[AllowHtml]` attribute on a model property, `HttpUtility.HtmlDecode` before output, a `MvcHtmlString`/`IHtmlString` built from input, or disabling ASP.NET request validation (`validateRequest="false"`, `[ValidateInput(false)]`, or not re-enabling it in modern .NET). Each hands raw markup to the page.

Safer shape: keep the framework's context-aware auto-encoding and never feed untrusted data through `@Html.Raw` or an `IHtmlString`. Leave request validation on as a backstop, not the primary control, and where untrusted markup must be rendered, sanitize it with a vetted library. Serve a strict Content Security Policy as defense in depth. Trace the finding through `browser`, this block only names the .NET opt-outs that reach the sink.

### Injection through the .NET data and process APIs

`interpreter` owns injection generally. .NET has idiomatic safe and unsafe calls. **SQL:** a query built by string concatenation and run through `SqlCommand`, `Database.ExecuteSqlCommand`/`ExecuteSqlRaw`, or `FromSqlRaw` injects exactly like any concatenated SQL, and an ORM does not save you: Entity Framework with an interpolated raw fragment, or `ExecuteSqlRaw` with a built string, is as vulnerable as plain ADO.NET. **OS command:** `System.Diagnostics.Process.Start` with a built argument string runs attacker-chosen commands, and `ProcessStartInfo.ArgumentList` (despite escaping per argument) carries Microsoft's own disclaimer that it is **not safe for untrusted input**, an attacker can still break across arguments. **LDAP/XPath/XML** reach the same generic sinks.

Safer shape: parameterize. Use `SqlParameter` placeholders (or EF Core's `FromSqlInterpolated`/`ExecuteSqlInterpolated`, which bind interpolation holes as parameters), never a concatenated string, even inside an ORM or stored procedure. For process execution, prefer a .NET API over shelling out, and treat `ArgumentList` as not a security boundary: validate every argument against a canonical allowlist (the cheat sheet's `IPAddress.TryParse` pattern) rather than stripping special characters in place, or pass untrusted data out-of-band (Base64-encode and decode in the receiver) rather than as a raw command-line argument. Trace each finding through `interpreter`, this block names the .NET calls.

### Open redirect via unvalidated `returnUrl`

The login `returnUrl`/`redirect` pattern is the .NET face of the redirect risk `network` and `browser` cover: `return Redirect(returnUrl)` fed a request-supplied URL sends the user to an attacker's origin for phishing.

Safer shape: confirm the destination is local before redirecting with `Url.IsLocalUrl(returnUrl)` (or `LocalRedirect`, which throws on a non-local target), falling back to a fixed safe action otherwise. Do not string-match the host. Map a server-side name or token to the target where you can. Trace through `network`/`browser` for the underlying reasoning.

### Cross-site request forgery (anti-forgery token)

`http-request` owns CSRF. .NET's idiom is the anti-forgery token, and the finding is its absence or removal on a state-changing request. In MVC/Razor that is a missing `[ValidateAntiForgeryToken]`/`[AutoValidateAntiforgeryToken]` (or an `[IgnoreAntiforgeryToken]` left on a sensitive action), a form built without `@Html.AntiForgeryToken()`/tag-helper, or an AJAX `POST` that never attaches the token. In Web Forms it is ViewState used for state without `ViewStateUserKey` set (which is what binds ViewState to the session as a CSRF defense).

Safer shape: validate the anti-forgery token on every non-idempotent request, prefer a global `AutoValidateAntiforgeryToken` filter over per-action attributes that are easy to forget, attach the token to AJAX calls, and in Web Forms set `Page.ViewStateUserKey = Session.SessionID` in `OnInit`. Trace through `http-request` for the underlying reasoning.

### Weak or misused cryptography on the .NET APIs

`crypto` owns algorithm choice. .NET makes specific mistakes easy. A general-purpose hash (`SHA512`, `SHA256`) used **for passwords** is a fast-hash finding, .NET's password primitive is PBKDF2 (`Rfc2898DeriveBytes`, or `Microsoft.AspNetCore.Cryptography.KeyDerivation.Pbkdf2`), and ASP.NET Core Identity already salts and PBKDF2-hashes by default (the legacy ASP.NET Membership provider's single-iteration SHA-1 is the weak one to flag on sight). Hand-rolled use of the raw `System.Security.Cryptography` primitives is error-prone: a non-authenticated cipher mode, an ECB mode, a reused nonce/IV, or a key drawn from `System.Random` instead of `RandomNumberGenerator`. And a key or secret in source is the deterministic secret-scan finding.

Safer shape: for passwords use PBKDF2 (or a stronger memory-hard KDF) with a per-password salt, and prefer ASP.NET Core Identity's defaults over rolling your own. For symmetric encryption use an authenticated mode (`AesGcm`) with a unique `RandomNumberGenerator`-generated nonce per operation and a securely stored key, never a hand-rolled primitive. The algorithm-level reasoning is the `crypto` surface, this block names the .NET APIs.

### Platform misconfiguration and validation gaps

The .NET-specific config defaults and one validation foot-gun. **Secrets in source-controlled config:** a connection string, key, or password in `web.config`/`appsettings.json` committed to the repo (use User Secrets in dev and a managed secret store via Managed/Workload Identity in production, or Configuration Builders for legacy Framework). **Debug left on:** `<compilation debug="true">` or `<trace enabled="true">` in production leaks stack traces. **Information-disclosure headers:** `X-Powered-By`, the version header (`enableVersionHeader`), and the `Server` header advertising the stack. **Cookie and session flags:** an auth cookie without `HttpOnly`/`Secure`/`requireSSL`, or Forms Authentication with a long timeout and `SlidingExpiration` on, which keeps a stolen session alive. **The `Enum` validation gap:** casting user input to an `enum` does **not** validate it, .NET only checks the underlying integer cast, so an out-of-range value passes silently. Use `Enum.IsDefined` (or `TryParse` plus a defined check) before trusting an enum from input.

Safer shape: keep secrets out of committed config, turn `debug`/`trace` off and strip identifying headers in production, set `HttpOnly`/`Secure`/`requireSSL` on cookies with an absolute (non-sliding) timeout for sensitive apps, and validate every enum and parsed value from input with `Enum.IsDefined`/`TryParse` against the allowed set. The session, transport, and access-control reasoning lives in those surfaces, this block names the .NET config that realizes them.

## How to act on the result

- **In detect (detection):** each .NET pattern in the blocks above that you confirm is a finding. Describe it in plain language: what it is (the .NET API or config being abused, for example attacker-influenced bytes reaching `BinaryFormatter`), why it matters (the concrete impact, from remote code execution via a deserialization gadget through to disclosure), and the evidence (the call or config and its untrusted input). Trace the source to the sink, and track the cross-language facets through their own surfaces (`interpreter`, `browser`, `http-request`, `crypto`, `access-control`, `transport`). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the .NET-specific unsafe path is gone or properly guarded: native object deserialization replaced by a data/contract serializer bound to a fixed type (or the payload signed and verified first), output encoding left to the framework with no `@Html.Raw` on untrusted data, queries and process calls parameterized or allowlisted rather than string-built, redirects confirmed local, anti-forgery validation enforced on every non-idempotent request, passwords on PBKDF2/Identity defaults and symmetric crypto on an authenticated mode with a unique nonce, and the platform configured down: no secret in committed config, debug/trace off, identifying headers stripped, secure cookie/session flags, and every enum and parsed value validated. If any of these .NET paths can still reach untrusted input, or a generic surface it hands off to is still open, the risk is not closed: record it as such and point back to harden.
