# Transport-layer vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/> and <https://owasp.org/www-community/attacks/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

This terrain is the **channel**, the connection a request travels over, not the request itself. An attacker on the path (shared Wi-Fi, a compromised router, a hostile ISP, anyone who can split the TCP connection) reads and rewrites anything sent in the clear, and downgrades or impersonates anything whose encryption or identity is not enforced. This is the Manipulator-in-the-Middle. The connection must hold one property end to end: **confidential** (strong, current TLS), the server's **identity proven** (a valid certificate the client actually checks), and HTTPS **not bypassable** (no cleartext fallback, no downgrade, no mixed content). The blocks below are the ways that property breaks, found in the code and config the project ships: redirect and TLS settings in app or proxy config, cookie flags and `http://` URLs in source, certificate and pinning code. What the request claims once it arrives is `http-request`, and how secrets are stored at rest is `crypto`.

### Cleartext and downgradable transport

The application serves anything sensitive over plain HTTP, or over HTTPS that silently falls back to HTTP. A login page, an API, a single asset, or one redirect hop on `http://` exposes the whole session, because the cookie and token ride that request in cleartext for any on-path attacker to copy. Three patterns are the usual leak:

- **Any endpoint reachable over HTTP without an immediate, permanent redirect to HTTPS.** A page served both ways, an API that accepts `http://`, an asset on a bare URL.
- **Mixed content:** an HTTPS page that pulls a script, stylesheet, image, or `fetch` over `http://`. The active resource is the attacker's injection point, and modern browsers block it, breaking the page as well as the security.
- **A session or auth cookie without the `Secure` attribute,** so the browser will attach it to an HTTP request and leak it. This matters even when the site never listens on port 80, because an active attacker can stand up a spoofed HTTP server to harvest the cookie.

Safer shape: serve every page and endpoint over HTTPS, redirect HTTP to HTTPS with a permanent `301` (or, for an API, refuse cleartext outright rather than redirect), never load a sub-resource over `http://`, and mark every cookie `Secure`. Pair this with HSTS (next block) to force even the first request onto HTTPS, since each control is incomplete without the other.

### Weak TLS configuration

The channel is encrypted, but with protocols or ciphers an on-path attacker can break or downgrade. Audit the negotiated configuration:

- **Deprecated protocols.** SSLv2, SSLv3, TLS 1.0, and TLS 1.1 are formally deprecated (RFC 8996) and must be disabled. Default to TLS 1.3, allow TLS 1.2 only for compatibility. Leaving an old version enabled lets the attacker negotiate down to it, so also enable the downgrade-protection signal (`TLS_FALLBACK_SCSV`).
- **Weak ciphers and no forward secrecy.** Null, anonymous (`TLS_*_anon_*`), and EXPORT (`TLS_*_EXPORT_*`) suites must always be off, and prefer AEAD suites (AES-GCM, ChaCha20-Poly1305), avoiding CBC-mode on TLS 1.2. Static RSA and static Diffie-Hellman key exchange give no forward secrecy, so a future key compromise decrypts past traffic: prefer ephemeral (ECDHE) key agreement.
- **TLS compression on,** which enables the CRIME side channel that recovers session cookies. Disable it.
- **Unpatched TLS library.** Heartbleed and its kin live in the library, not the protocol, so an out-of-date OpenSSL (or equivalent) is exploitable regardless of cipher choice. Keep it current.
- **Certificate and key hygiene.** The certificate must match the server's FQDN in the `subjectAlternativeName` (modern browsers ignore the legacy CN), use a SHA-256 signature (not MD5/SHA-1), and a key of at least 2048-bit RSA (or an equivalent EC key) kept readable only by the service. Treat a wildcard certificate as least-privilege debt: never share one across systems at different trust levels. Consider a CAA DNS record to bound which CAs may issue for the domain.

Safer shape: adopt a vetted modern profile rather than hand-rolling the suite list (the Mozilla SSL Configuration Generator), then verify the negotiated result with an external scanner (SSL Labs, `testssl.sh`) rather than inspecting config alone. Re-validate after any server or library change, since a default can quietly re-enable a weak option.

### Missing HSTS (HTTPS not enforced by the browser)

Even a correct HTTPS deployment is bypassable on the requests the server never sees: the first visit, a typed `http://` domain, an old HTTP link, a forged certificate the user is tempted to click through. The redirect-to-HTTPS from the first block still leaves one cleartext round-trip for an attacker to hijack (`sslstrip`). HTTP Strict Transport Security closes that gap with a response header that tells the browser to use HTTPS for this domain unconditionally and to refuse the click-through on a bad certificate. The header's options carry the real decisions:

- **`max-age`** sets how long the browser remembers (a long value such as `max-age=63072000`, two years, for a settled site, a short one during rollout so a mistake expires quickly).
- **`includeSubDomains`** extends the rule to every subdomain. Omitting it leaves subdomains open to cookie-injection and cleartext attacks HSTS would otherwise prevent, so include it once you are confident every present and future subdomain is HTTPS.
- **`preload`** ships the domain in the browsers' built-in list so even the very first request is HTTPS, but it has near-permanent consequences: removal is slow, so a domain or subdomain that ever needs HTTP again is stuck. Add `preload` only with that commitment understood.

Safer shape: send `Strict-Transport-Security: max-age=63072000; includeSubDomains` over HTTPS (the header is ignored on HTTP), and add `preload` only with an indefinite commitment to HTTPS for the domain and all subdomains.

### Certificate or key pinning

Pinning hardcodes the exact certificate or public key a client will accept for a host, so even a _valid_ certificate from a rogue or compromised CA, or one injected into the device trust store, is rejected. It protects the narrow case where the CA trust model is itself the threat, but OWASP's guidance for a normal website is **probably never** pin. A pin that cannot be updated as fast as the certificate rotates **bricks the client**, and the in-browser standard (HPKP) was deprecated for exactly this reason. So the finding here is usually _misapplied_ pinning, not its absence.

Recognize where it does not belong: a server-side web app pinning its own outbound calls so brittlely that a routine cert rotation takes it down, a browser app reaching for the dead HPKP header, or any pin with no secure, non-disruptive update path. Pinning earns its place only in a native mobile app, a thick client, or fixed server-to-server links, where you control both ends and can ship pin updates out of band.

Safer shapes, applied only where pinning is genuinely warranted:

- **Pin the leaf certificate's `subjectPublicKeyInfo` with a backup pin** (an intermediate CA or an alternate key), so a rotation or failover does not strand the app.
- **Preload the pin out of band at build time,** never blindly trust-on-first-use over a channel an attacker may already control.
- **Use the platform's declarative mechanism,** not hand-rolled certificate checks: Android Network Security Config, iOS App Transport Security / TrustKit, rather than a custom `verify_callback` that is easy to get dangerously wrong.
- **Keep a secure, non-disruptive update path,** and do not let the user click past a pin failure (treat it as a hard stop, logged).

When none of that holds, the safer shape is to **not pin** and rely on correct TLS plus the controls above.

## How to act on the result

- **In detect (detection):** each channel weakness from the blocks above is a finding (for example a sensitive endpoint reachable over HTTP). Record what it is (the channel weakness), why it matters (an on-path attacker reads or rewrites the traffic, strips HTTPS, or impersonates the server), and the evidence (the URL, the cookie, the server config, the scanner result). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the channel keeps that property end to end (confidential, identity proven, not bypassable), as each block's safer shape spells out. Prove the TLS part with an external scanner, not by inspecting config alone. A pinning finding is closed when pinning is removed where it was misapplied, or, where warranted, pins the leaf SPKI with a backup and a secure update path. If an on-path attacker can still read, rewrite, downgrade, or strip the connection, the risk is not closed: record it and point back to harden.
