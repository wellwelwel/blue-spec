# PHP-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: the official PHP manual, the PHPGGC gadget-chain catalog, and OWASP, <https://cheatsheetseries.owasp.org/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### Type juggling and loose comparison (`==`), and "magic hashes"

PHP's `==` juggles types before comparing, so values of different types can be made equal. Numeric strings are compared numerically, and a string of the form `0e[digits]` is a valid numeric string in exponential notation, parsed as `0 × 10^n = 0`. Two different "magic hash" strings that both start `0e` followed only by digits therefore both reduce to float `0` and compare equal. The canonical collision is `md5('240610708') == md5('QNKCDZO')`:

```php
md5('240610708'); // "0e462097431906509019562988736854"
md5('QNKCDZO');   // "0e830400451993494058024219903391"
md5('240610708') == md5('QNKCDZO'); // both coerce to float 0 → true
```

The impact is authentication bypass: a password, HMAC, or token check written with `==` accepts a colliding value. Related juggling reaches the same place, `"any non-empty string" == true`, `"0" == 0`, and JSON-supplied types where `{"hmac": 0}` decodes to an integer that loosely equals a string check.

The magic-hash `==` collision is live on every PHP version, because both `0e...` hashes are _numeric_ strings and stay compared numerically. The broader `0 == "non-numeric string"` coercion additionally affects PHP 7.x, where it is `true`. PHP 8 casts the number to string instead, so that broader case is `false` there.

Safer shapes, applied where they fit:

- **Use strict comparison `===`/`!==`** wherever a security decision rides on the result. It compares type _and_ value, with no coercion.
- **Use `hash_equals()`** for any hash, MAC, or token comparison. It is constant-time and does an exact, type-aware comparison. Pass the expected value first, the user-supplied value second.
- **Use `password_hash()` / `password_verify()`** for passwords. `password_verify()` does its own constant-time, type-safe check and returns a strict boolean, so juggling never enters the comparison.
- `in_array($needle, $haystack)` and `array_search($needle, $haystack)` compare loosely unless their third `$strict` argument is `true`. Pass `strict: true` when the values are security-relevant.
- `declare(strict_types=1)` does **not** fix this. It only switches scalar type declarations at function boundaries from coercive to strict, and is file-local, with no effect on `==` or magic-hash behavior. Do not treat its presence as closing a loose-comparison finding. (It is still worth adding, alongside explicit validation of JSON-decoded types.)

### `unserialize()` object injection and POP chains

PHP's `unserialize()` rebuilds arbitrary objects from a serialized string, and reconstruction invokes **magic methods**: `__wakeup()` (or `__unserialize()` on PHP 7.4+) fires the moment the object is unserialized, while `__destruct()` and `__toString()` fire later as lifecycle events the attacker can steer. Attackers chain these methods across classes already loaded in the process (Property-Oriented Programming, "POP chains") to reach a dangerous sink. PHPGGC catalogs ready-made chains for Laravel, Symfony, Monolog, Guzzle, and WordPress, so the gadgets usually live in vendor code, not the application's own.

`unserialize($_COOKIE['data'])`, or any untrusted serialized input, leads to file write/delete, SQL injection, or remote code execution depending on the classes in scope. The recurring shape is stored or request data reaching `unserialize()` without an `allowed_classes` restriction.

#### The `phar://` trigger (object injection with no literal `unserialize` call)

A serialized object reaches the sink through a second door. Any file operation on a `phar://` path (`file_exists`, `fopen`, `getimagesize`, `is_file`, and the rest) unserializes the Phar archive's metadata, so a file function given an attacker-influenced path becomes an object-injection sink with no `unserialize()` call in the code. PHP 8.0 narrowed the trigger, but legacy code and older runtimes remain exposed. Trace the path argument of file operations, not just calls named `unserialize`.

Safer shapes, applied where they fit:

- **Never `unserialize()` untrusted input.** Use `json_decode()` / `json_encode()` for data interchange. `json_decode()` returns only `stdClass`, arrays, and scalars (associative arrays with `true` as the second argument), so it instantiates no application classes and invokes no magic methods.
- If `unserialize()` is unavoidable, pass **`['allowed_classes' => false]`** (every class becomes `__PHP_Incomplete_Class`) or a strict array of permitted class names. This is a mitigation, not a guarantee: untrusted input can still trigger autoloading, so it does not by itself make the call safe.
- An **HMAC** verified before unserializing is integrity-only defense-in-depth, not a fix: the underlying call is still a full object-injection primitive if the signing key leaks or a trusted producer is compromised. Keep dependencies patched, since the POP gadgets live in vendor libraries.
- Block or restrict the `phar://` stream wrapper where file operations take external paths, and validate the scheme of any user-influenced path.

### `extract()` and variable-variables (`$$var`) variable pollution

PHP's `extract()` imports an array's keys as local variables into the current symbol table, defaulting to `EXTR_OVERWRITE`. Called on attacker-controlled keys, it overwrites existing local variables. `extract($_GET)` (or `$_POST` / `$_REQUEST`) lets an attacker set any local variable whose name they supply as a key, the classic auth bypass by injecting `?auth=1`:

```php
$auth = 0;
extract($_GET);          // ?auth=1 overwrites $auth
if ($auth == 1) { /* private area */ }
```

Only valid PHP identifiers are imported, so this is a logic-level overwrite, not memory corruption.

Safer shapes, applied where they fit:

- **Don't call `extract()` on user input.** Read the keys you expect explicitly: `$user = $_GET['user'] ?? null;`.
- `parse_str()` and `mb_parse_str()` called **without** a result array populate variables into the local scope exactly like `extract()`. Always pass the result array (mandatory since PHP 8.0). Treat variable-variables (`$$var`) over user-controlled names the same way.
- If `extract()` is genuinely required, use **`EXTR_SKIP`** (never overwrite an existing variable) or `EXTR_PREFIX_ALL`, and never extract before initializing security-relevant variables or calling `session_start()`.
- Avoid the `EXTR_REFS` flag on attacker-shaped data. Default `extract()` does not set it.

### Insecure `php.ini` and runtime configuration

The runtime's configuration is its own attack surface. A production server that ships errors to the page (`display_errors = On`), advertises itself (`expose_php = On`), or leaves `allow_url_fopen`/`allow_url_include = On` hands an attacker information disclosure and a path from a local-file-include bug to a full remote-file-include (executing an attacker-hosted script). With every dangerous function enabled and no `open_basedir`, one code bug reaches the whole filesystem and shell. Session cookies without the secure flags are stealable. An out-of-support PHP version receives no security fixes.

Safer shapes, applied where they fit:

- **Silence errors to the user, log them server-side.** `display_errors = Off` and `display_startup_errors = Off` in production, with `log_errors = On` to a path outside the web root. `expose_php = Off` to drop the `X-Powered-By` banner, and `zend.exception_ignore_args = On` so arguments do not leak into traces.
- **Cut off remote includes.** `allow_url_fopen = Off` and `allow_url_include = Off` stop an LFI from escalating to RFI. Confine file access with `open_basedir`, and shrink the blast radius with `disable_functions` for the dangerous primitives the app does not use (`exec`, `shell_exec`, `system`, `passthru`, `proc_open`, `popen`, and similar).
- **Harden session cookies at the runtime level.** `session.cookie_secure = 1`, `session.cookie_httponly = 1`, `session.cookie_samesite = Strict`, `session.use_strict_mode = 1`, and `session.use_only_cookies = 1`, with a renamed `session.name` and adequate `session.sid_length`/`sid_bits_per_character`. (Session-token risks themselves are the `session` surface, this is the runtime that backs them.)
- **Run a supported PHP version and keep dependencies patched.** Track [supported versions](https://www.php.net/supported-versions.php), and audit packages with `composer audit` (or the Symfony security checker / OWASP Dependency-Check), since the POP gadgets above and many other flaws live in vendor code.

### Framework defaults: do not disable the protection that is on by default

PHP frameworks are secure by default, so the recurring framework-specific finding is code that turns a default protection off. The template engine auto-escapes output (Laravel Blade `{{ }}`, Twig `{{ }}`, via `htmlspecialchars`), and the unescaped forms, Blade `{!! !!}` and the Twig `|raw` filter, disable that escaping. Reaching either with untrusted data is XSS (the browser-side detail is the `browser` surface, the PHP-specific point is that the safe default was switched off). The mirror cases: Laravel debug mode left on in production (`APP_DEBUG=true`, `APP_ENV` not `prod`) leaks stack traces and config, an unset Laravel app key weakens cookie/signed-URL/reset-token crypto, and excluding non-stateless routes from the CSRF middleware reopens CSRF.

Safer shape: keep the framework's defaults on. Render through the auto-escaping `{{ }}` and never feed untrusted data to `{!! !!}`/`|raw`, set `APP_DEBUG=false`/`APP_ENV=prod` and generate the app key in production, keep CSRF protection on every state-changing route, and store secrets in environment variables or the framework's secrets vault rather than committed config.

### ORM mass assignment

An ORM that fills a model straight from request data (`$request->all()` into `forceFill`/`forceCreate`, an unguarded model, or `$guarded = []`) lets a user set any column, including ones they should never control, the canonical case being an `is_admin` flag smuggled into a profile-update request. It is a privilege-escalation door opened by binding more input than intended (the authorization decision is the `authorization` surface, this is the PHP/Eloquent idiom that triggers it).

Safer shape: bind only the fields you mean to. Use `$request->only([...])` or `$request->validated()` instead of `$request->all()`, keep the model's `$fillable` allowlist (never empty `$guarded` or unguard), and avoid `forceFill`/`forceCreate` unless the array is already validated.

## How to act on the result

- **In detect (detection):** each pattern you confirm is a finding. Describe it in plain language: what it is (the PHP behavior being abused, see the risk blocks above), why it matters (the concrete impact on this code), and the evidence (the call and the source of its bytes or keys, the directive or template, the function or area where it lives). Trace the source to the sink: the finding is the dangerous pattern actually reaching attacker-influenced input. It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the unsafe pattern is gone or properly guarded: a security comparison moved to `===`/`hash_equals()`/`password_verify()` with array searches passing `strict: true`, untrusted data parsed with `json_decode()` instead of `unserialize()` (or constrained with `allowed_classes` and the `phar://` path closed), request data read by explicit keys instead of `extract()`/single-arg `parse_str`, a production-hardened `php.ini` (`display_errors`/`expose_php`/`allow_url_*` off, `open_basedir` and `disable_functions` set, secure session cookie flags, a supported version), framework defaults left on (auto-escaping not bypassed, debug off, CSRF on), and the ORM bound to a validated allowlist. An HMAC wrapper around `unserialize()`, the mere presence of `declare(strict_types=1)`, or a top-level-only guard does not close the risk. If the dangerous pattern still reaches untrusted input, record it as not closed and point back to harden.
