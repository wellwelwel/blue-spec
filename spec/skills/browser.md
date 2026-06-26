# Browser / client-side vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/> and <https://owasp.org/www-community/attacks/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### DOM-based XSS

The DOM sinks execute markup or script from their input: `innerHTML`, `outerHTML`, `document.write`, `insertAdjacentHTML`, `Range.createContextualFragment`, and assigning a `javascript:` URL to `href`/`src`/`action`. Setting `el.setAttribute('on...', ...)` or an event-handler property from data does the same. Any of these fed by a value that originates outside the code is XSS.

Common sources that reach these sinks: `location` (`href`, `search`, `hash`), `document.referrer`, `name`, a `postMessage` payload, a value read back from storage, and any server response rendered without encoding.

Safer shape: write text through `textContent`, build nodes with `createElement`/`append`, and keep untrusted values out of HTML-parsing sinks. When HTML is unavoidable, sanitize with a vetted library (for example DOMPurify) before it reaches the sink, and validate that a URL's scheme is `http`/`https` before assigning it.

### Reflected and stored XSS, by output context

The same risk exists when the server, or the page on render, places an untrusted value into HTML without encoding it for the context it lands in. The context decides the encoding: an HTML body needs HTML-entity encoding, an attribute value needs entity encoding inside quotes, a value inside a `<script>` block or a JS string needs JavaScript encoding, a URL component needs percent-encoding, and a CSS value needs CSS encoding. A value placed into a dangerous context (an inline event handler, a `<script>` body, a tag or attribute name, a `style` block) is unsafe even when encoded, so untrusted data must never land there.

Safer shape: prefer the framework's context-aware auto-escaping, never disabled with a "raw"/"safe"/"trust" helper on untrusted data. A WAF or interceptor is not a substitute: it cannot see context and misses DOM-based XSS entirely.

### Untrusted parsed content treated as a source

Content that arrives by an indirect path is still an untrusted source when it reaches a sink. Text pulled out of a file (OCR or any file-content-to-text conversion), a parsed subtitle track (`.srt`/`.vtt`), a value an external crawler or service indexed and the page later reads back, and any cached or stored response all qualify. Rendering any of them as HTML re-enters the XSS path.

Safer shape: treat extracted, parsed, indexed, and stored content as untrusted on read. Parse structured formats (subtitles, documents) into data and render only their text through `textContent`, or sanitize with DOMPurify when markup is required.

### Content Security Policy (defense in depth)

CSP is a second layer behind encoding, not a replacement for it, and a weak policy gives false comfort. A policy is weakened by `'unsafe-inline'` or `'unsafe-eval'` in `script-src`, by a wildcard or broad host source, and by a missing `object-src`/`base-uri`. A strong policy allowlists scripts by nonce or hash (`script-src 'nonce-...' 'strict-dynamic'`), sets `object-src 'none'` and `base-uri 'none'`, and constrains framing with `frame-ancestors`.

Safer shape: serve a strict, nonce- or hash-based policy, drop `'unsafe-inline'`/`'unsafe-eval'`, and set `object-src 'none'`, `base-uri 'none'`, and `frame-ancestors` to the origins allowed to frame the page. Keep encoding as the primary control regardless.

### Framing and cross-window trust

A page framed by an attacker, or one that opens or is opened in another window, can be driven across the window boundary. Clickjacking and cross-frame scripting come from a hostile parent framing the app to overlay or read it. Reverse tabnabbing comes from a link or `window.open` that leaves `window.opener` reachable, letting the opened page rewrite the original tab's location toward a phishing page. Cross-site history manipulation and execution-after-redirect both come from leaning on a client-side redirect for an access decision: a proxy or a disabled-script client ignores the redirect while the protected code still runs, or the redirect leaks state through `history`. Clickjacking does not always need a frame: user-authored CSS the app accepts and renders is a vector on its own, an attacker-supplied `style` or stylesheet stretching a transparent overlay across the viewport so any click loads a hostile target.

Safer shape: deny framing the app does not need with `frame-ancestors` (or `X-Frame-Options`), and sandbox any iframe that loads untrusted content with the `sandbox` attribute. Put `rel="noopener noreferrer"` on every `target="_blank"` link and pass `noopener,noreferrer` to `window.open`. Never gate access with a client-side redirect: enforce the check server-side and stop execution at the point of the redirect. Where the app renders user-authored HTML, constrain its CSS as tightly as its markup, sanitize with a policy that drops `style`/`<style>` and positioning that can overlay the page (not only script), so allowed styling cannot be turned into a click trap.

### Cross-Site Tracing (TRACE) and cookie exposure

When the server answers the HTTP `TRACE`/`TRACK` method by echoing the request, a script can read back headers the page is not meant to see, including a cookie that was set `HttpOnly`, defeating that flag. The browser blocks `TRACE` over `fetch`/`XMLHttpRequest`, but the server-side method being enabled is the real exposure.

Safer shape: disable `TRACE` and `TRACK` on the server, and keep session and auth cookies `HttpOnly`, `Secure`, `SameSite` so a script cannot read them directly either.

### Cross-window messaging (`postMessage`)

A `message` listener that acts on `event.data` without checking `event.origin` trusts any page that can reach the window, so a malicious frame or opener can drive the handler. The mirror risk is a `postMessage` call that sends sensitive data with `'*'` as the target origin, leaking it to whatever document occupies the frame.

Safer shape: in the receiver, check `event.origin` against an allowlist before reading `event.data`, and validate the shape of the data. In the sender, pass the exact expected origin, never `'*'`, for anything sensitive.

### DOM clobbering

Naming an element with `id`/`name` can shadow a global or a property the code reads (for example `window.config`, `form.action`), so attacker-injected markup can replace a value the script trusts without running any script. It turns a markup-injection foothold into logic tampering.

Safer shape: do not read configuration or trusted references off the DOM or globals by name. Resolve them explicitly (`document.getElementById` with a known check, module-scoped constants) and verify a value is the type you expect before using it. When sanitizing user markup, block `id`/`name` (DOMPurify's `SANITIZE_NAMED_PROPS`, or the Sanitizer API).

### Client-side storage of sensitive data

`localStorage`, `sessionStorage`, and non-`HttpOnly` cookies are readable by any script on the origin, so a single XSS reads everything in them. Tokens, session identifiers, and personal data held there are exposed by design.

Safer shape: keep session and auth tokens in `HttpOnly`, `Secure`, `SameSite` cookies the page's JavaScript cannot read. Treat web storage as untrusted input on read: never feed a stored value straight into a DOM sink or a security decision.

### Open redirect and URL sinks

Building a navigation target (`location.assign`, `location.href`, `window.open`, a link's `href`) from input lets an attacker redirect the user to a hostile origin, and a `javascript:`/`data:` scheme there re-enters the XSS path.

Safer shape: validate the destination against an allowlist of paths or origins, force a known scheme, and prefer relative paths built by the app over a full URL taken from input.

### Content spoofing (no script required)

Injecting unencoded text or non-script markup lets an attacker reshape what the user sees, a fake login prompt, a forged message, a misleading link, without running script. It is a phishing surface that survives any anti-XSS control which only blocks script execution.

Safer shape: encode untrusted text for its output context exactly as for XSS, so injected markup renders as inert text. When user-authored formatting is required, sanitize the markup with DOMPurify rather than trusting it.

### Untrusted code on the page: man-in-the-browser, extensions, and third-party scripts

Any script the page runs that the app does not control, a malicious browser extension, a Trojan injecting into the browser, or a vendor tag loaded from a third-party host, runs with the page's full privileges: it can read and rewrite the DOM, read cookies and storage, sniff form fields, and falsify what the user sees. The app cannot defeat code already running in the browser, so two defenses apply: do not trust the client for integrity, and shrink how much foreign code the page admits.

Safer shapes, applied where they fit:

- **Never trust the client for transaction integrity.** Validate and authorize every state-changing action server-side, and confirm high-value operations out of band (a server-issued summary the user re-approves on a separate channel), so a manipulated DOM cannot silently change what the server commits.
- **Pin and contain third-party scripts.** Add Subresource Integrity (`integrity` + `crossorigin`) so the browser refuses a tampered file, load vendor code from a `sandbox`ed iframe that has no access to the host DOM or cookies, and constrain it with CSP. Prefer a data-layer (the page hands the vendor only the values it needs) over letting vendor code roam the DOM. Keep client libraries patched (tools like RetireJS flag known-vulnerable versions).
- **When the project is a browser extension, treat its own surface as the risk.** Request least-privilege permissions (not `<all_urls>` or broad `tabs`), never load or `eval` remote code (ship and update through the store), validate the sender on every `chrome.runtime` message (`sender.id`, `sender.url`) before acting, keep secrets in the extension storage API rather than `localStorage`, and never render sensitive data into a page's DOM or run it in the page's (pollutable) context, use an isolated extension UI (popup, options page, side panel) instead.

### Cross-site leaks (browser side-channels)

Even when the same-origin policy blocks reading a cross-origin response, the browser still leaks observable side effects that let a hostile page infer private yes/no facts about the victim (is the user logged in, is their ID N, are they an admin). The channels are the load success of an embedded resource (`onload` vs `onerror`), the count of frames in a window the attacker opened, focus/blur fired by an `id` fragment, and the timing difference between a cached and an uncached resource. No script runs on your origin, so anti-XSS controls do not touch it: this is a privacy and deanonymization surface.

Safer shape: set `SameSite` on cookies (defense in depth, it narrows but does not close every channel), deny framing you do not need with `frame-ancestors` (or `X-Frame-Options`), and isolate the browsing context with `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy`. Build a resource-isolation policy from Fetch Metadata (reject cross-site `Sec-Fetch-Site`, or an iframe `Sec-Fetch-Dest`, on sensitive endpoints). Guard a sensitive resource with an unguessable per-user token, and serve it `Cache-Control: no-store` to remove the cache-timing channel.

## How to act on the result

- **In detect (detection):** each pattern you confirm is a finding. Describe it in plain language: what it is (the browser behavior being abused), why it matters (the concrete impact, for example script execution in the user's session), and the evidence (the function or area where it lives). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the unsafe pattern is gone or properly guarded (a non-HTML sink, context-correct encoding, an origin check on the listener, a strict CSP, framing denied and `noopener` set, `TRACE` disabled, a token moved off web storage, an allowlisted redirect, third-party scripts pinned with SRI or sandboxed and integrity enforced server-side, an extension scoped to least privilege with validated message senders, or a side-channel closed with `SameSite`, framing/COOP/CORP, Fetch Metadata, and `Cache-Control: no-store`). If the dangerous pattern still reaches untrusted input, or foreign code still runs with full page privileges, or a side-channel still answers the attacker's question, the risk is not closed: record it as such and point back to harden.
