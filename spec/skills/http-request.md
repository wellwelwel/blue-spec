# Inbound HTTP request vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/> and <https://owasp.org/www-community/attacks/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

The single mistake here is **trusting what the request claims about itself**. A session cookie, an `Origin`, a `Referer`, an `X-Forwarded-For`: every one is set by the caller, who may be a forged form on an attacker's page or a raw client like `curl` sending any header it likes. The browser's same-origin policy and CORS preflight constrain **honest** clients only, they are not a check the server performs. So the server must derive provenance from something the caller cannot forge: a token it issued, an `Origin` it compares server-side, the real socket peer address. The first three risks below are the same error on three different fields, so getting one right while trusting another still leaves the feature open. The last is its mirror on the way out: what the **response** volunteers about the server itself.

### CSRF (Cross-Site Request Forgery)

A state-changing endpoint authorizes a request **using only the ambient session cookie**, which the browser attaches to any request to your origin, including one fired by a form, image, or `fetch` on an attacker's page. Nothing in such a request proves the user **intended** it, so the server cannot tell a forged "transfer funds" or "add admin" from a real one. `GET` endpoints that change state are the worst case (a bare `<img src>` triggers them), but `POST`, `PUT`, `PATCH`, and `DELETE` are all reachable from a cross-site form or script. **Login CSRF** is the inverse: the attacker forces the victim to log into the _attacker's_ account, so the victim's later activity (saved cards, history) lands where the attacker can read it.

Several popular ideas do **not** stop CSRF, so seeing them is not closure: a secret in another cookie (every cookie auto-sends, so it forges too), accepting only `POST` (a cross-site form sends `POST`), multi-step flows (each step is forgeable), HTTPS alone, and a `Referer` check alone (stripped or spoofed too often to rely on). CORS is not a CSRF defense either: it governs whether the attacker can _read the response_, never whether the forged request _fires_. No CSRF token survives XSS, which reads the token and forges with it, so XSS prevention is a prerequisite, not a substitute.

Safer shapes, applied where they fit. Use a token defense as the primary control and layer the rest:

- **Synchronizer token (stateful apps):** the server embeds its session-bound token in the form or hands it to the SPA, and rejects any state-changing request whose token is absent or mismatched. Per-session is the usual balance, per-request is stronger but breaks back/reload.
- **Signed double-submit cookie (stateless / JWT apps):** the token is an HMAC over a per-login session value keyed by a server secret, sent in a readable cookie and resubmitted in a header or field, validated by recomputing the HMAC. Prefer this over the **naive** double-submit (random value matched against itself), which a subdomain or cookie-injection foothold can defeat by planting a matching cookie.
- **Never put the token in the URL or a `GET`**, where it leaks via history, logs, and `Referer`. Custom request headers are safer than hidden fields, since a cross-origin caller cannot set them without a preflight the attacker cannot satisfy.
- **`SameSite` cookie attribute as depth, not the whole defense.** `SameSite=Lax` (the modern default) blocks the cookie on cross-site `POST`/`PUT`/`PATCH`/`DELETE` but still sends it on top-level `GET`, so it fails the moment any `GET` changes state. `Strict` is stronger but breaks inbound cross-site links. Both are scoped to the registrable domain, so a sibling subdomain you do not control is "same-site". Combine with `__Host-` cookie prefixes and a token, never lean on `SameSite` alone.
- **Verify the request's origin server-side**: compare the `Origin` (falling back to `Referer`) against the real target origin, rejecting a cross-origin state change, the same server-side equality check the CORS block requires.
- **Re-authenticate or require a one-time token for the highest-value actions** (password change, payout, privilege grant), layered on the above. Do not rely on a CAPTCHA for this.

### CORS misconfiguration and preflight bypass

CORS relaxes the same-origin policy so a browser will _let one origin read another's response_. Two server-side mistakes turn it from a guardrail into a hole.

The first is **reflecting or over-allowing the `Origin`**. The `Origin` request header is attacker-controlled, so a server that **echoes** the incoming `Origin` back into `Access-Control-Allow-Origin`, especially with `Access-Control-Allow-Credentials: true`, has told the browser "every site may read this user's authenticated data". A wildcard `Access-Control-Allow-Origin: *` on a credentialed endpoint, or an allowlist matched by a loose substring/regex (so `your-site.com.attacker.com` or `attacker-your-site.com` passes), is the same failure. Never authorize a request _because of_ its `Origin` value.

Safer shape: allowlist exact, trusted origins and compare by full equality, never reflect the request's `Origin` and never use `*` with credentials. Send `Access-Control-Allow-Credentials: true` only for those specific origins, drop a stale or wildcard subdomain rule, and remember that owning a subdomain in the allowlist (takeover, user content) is enough to inherit the trust.

The second mistake is **trusting that the preflight ran**. The CORS preflight (`OPTIONS` with `Access-Control-Request-Method`/`-Headers`) is enforced **by the browser**, not by your server. A raw client (`curl`, a script, an intercepting proxy) skips it entirely and sends the "complex" request directly. So treating a request as safe because it _would_ require a preflight, or because one was seen earlier, lets a non-browser caller act unchecked.

Safer shape: enforce the real authorization on the actual request, never on the preflight. Every state-changing endpoint validates the session, the CSRF token, and (where used) that the final request's method and headers match what is permitted, regardless of whether an `OPTIONS` preflight preceded it. Keep `GET`/`HEAD`/`OPTIONS` free of side effects, so a "simple" request can never change state.

### Spoofed client-IP and forwarding headers

The application reads a forwarding header (`X-Forwarded-For`, `X-Real-IP`, `True-Client-IP`, `CF-Connecting-IP`, `Client-IP`, `Forwarded`, and the family of variants), treats its value as the **client's real IP**, and uses that IP for a security decision: an allowlist granting admin access to "internal" or loopback addresses, a rate limit or lockout keyed on IP, a geo or fraud gate, or an audit log. Every one of these headers is text the caller sets, so a request with `X-Forwarded-For: 127.0.0.1` (or any address) walks through an IP allowlist, resets a per-IP throttle by rotating the value, or poisons the audit trail (logged unescaped into an admin view, it is also a stored-XSS path). The true peer is the socket address, which the caller cannot fake over a completed TCP/TLS connection.

Safer shape: trust a forwarding header only when your **own** reverse proxy or load balancer is the one that set it, and only the segment it added. Configure the framework's trusted-proxy setting to the known proxy hops, take the client IP as the entry the trusted boundary appended, and read the raw socket peer when there is no trusted proxy in front. Beyond that, do not make client IP the _only_ gate: pair rate limits and access checks with the authenticated identity and other signals, validate and escape any header value before logging or rendering it, and never grant privilege on an IP a request can assert for itself.

### Response headers that disclose the server (fingerprinting)

The mistake here runs the other way: the **response** announces what the server is. Frameworks and web servers ship default headers naming the software and its version, `Server: Apache/2.4.41`, `X-Powered-By: PHP/7.2.4`, `X-AspNet-Version`, `X-AspNetMvc-Version`, and similar banners. None is a control, each is a free hint that hands an attacker the exact stack and version to look up known CVEs against, narrowing a generic scan into a targeted one. It is low-severity and no substitute for patching, but it is gratuitous exposure on any server that is not a public, self-documenting API. The broader response-header hardening (CSP, `X-Frame-Options`/`frame-ancestors`, `nosniff`, COOP/COEP/CORP, `Referrer-Policy`, `Permissions-Policy`) is browser-facing defense and lives in the `browser` sub-skill, HSTS lives in `transport`, and the CORS `Access-Control-Allow-Origin` response header is the CORS block above. This block is only the version-disclosure residue those do not cover.

Safer shape: strip or blank the identifying headers (`Server`, `X-Powered-By`, `X-AspNet-Version`, `X-AspNetMvc-Version`) at the app or proxy layer, removing the version banner rather than merely shortening it, and keep the software patched regardless, since hiding the version only delays a targeted attacker.

## How to act on the result

- **In detect (detection):** each place the server trusts what a request claims about itself (a CSRF-unprotected state change, a reflected or over-permissive CORS origin, an authorization resting on the preflight, a security decision keyed on a forwarding header) or volunteers its own version through a response header, as the risk blocks describe, is a finding. Record what it is (the value being trusted, or the banner being volunteered), why it matters, and the evidence (the route, the header, the CORS config). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the request's provenance is established from something the caller cannot forge, as each risk block's safer shape spells out: a CSRF token validated on every state-changing method, an exact CORS allowlist enforced on the real request, a client IP taken from the socket peer or a trusted proxy hop, and the identifying response headers stripped. If any state change, cross-origin read, or IP-gated control can still be driven by a value the request supplies, or the server still volunteers its version, the risk is not closed: record it and point back to harden.
