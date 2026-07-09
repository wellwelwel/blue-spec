# Network-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/> and <https://owasp.org/www-community/attacks/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### SSRF (Server-Side Request Forgery)

A server feature takes a URL or host from the user and opens it: a webhook that pings a registered URL, a link-preview, an importer that pulls "from URL". Any **resource identifier built from user input that the server then opens** is the same vulnerability, not only a full URL but a host or port used to open a socket, a download path, an endpoint a feature dials, and a UNC share (`\\host\share`). The UNC form is worth naming because it does not look like a web request: a path like `\\attacker-host\file` makes the server authenticate **outbound** to the attacker, leaking its credentials (the classic Windows SMB-hash theft). The defense throughout is one rule: the server chooses the destination from a validated, code-defined set, never assembling it from a request value.

The same defect covers a server-side redirect or forward whose target comes from the request: the server does not open it but hands it to the user's browser or its own dispatcher. The last block covers that case.

Out of scope here: an identifier that names a **local file or module** the server reads or loads is the `interpreter` and path-traversal surface, and the client-side navigation sink (`location.href` built from input) is the `browser` sub-skill. This terrain is the connection going out.

#### Unvalidated fetch of a user-supplied destination

It is exploitable when the destination is user-controlled, validated loosely or not at all, and the server can reach what the user should not: internal services, `localhost`/loopback, the cloud metadata endpoint, a password-less database. The server becomes the attacker's proxy, and the leak does not need the body to come back (see "Blind and semi-blind SSRF"). The defense splits on one question: does the feature reach a **known set of hosts** (the common case, where an allowlist is the whole defense) or **any host the user names** (where the burden moves to the resolved address, see "Destination validation done wrong")? Prefer redesigning toward the known-hosts case.

These safer shapes are the baseline the later blocks build on:

- **Allowlist the destination**, never blocklist. Deny by default.
- **Take a host or IP field, not a full URL,** and build the request yourself, so no user string can make two parsers disagree.
- **Validate with a tested address parser** that resolves hex, octal, dotless, and IPv6-mapped forms (Lagune's checker is one), not raw-text comparison.
- **Restrict the client's schemes** to `http` and `https`.
- **Do not follow redirects blindly**, or re-validate every hop, since a validated host can redirect inward.
- **Keep a second barrier:** authenticate internal services and restrict egress.

#### Over-capable fetch clients and dangerous protocols

A fetch client left in its permissive default speaks whatever scheme it is handed, so a user-supplied URL can drive it to `file://`, `ftp://`, or `gopher://`, none of which a "fetch a web page" feature needs. With `file://` the SSRF becomes local file read (`/etc/passwd`, the app's own `.env`, private keys). With `gopher://` it speaks an internal service's wire protocol directly, a known path to remote code execution against a password-less store.

Safer shape: restrict the client to `http` and `https`. Combined with the host allowlist, a client that speaks only those schemes to known hosts has lost almost every move that makes SSRF dangerous.

#### Destination validation done wrong (host blocklists are security theater)

A blocklist of host strings defends at the wrong layer: it inspects the **text** of the URL while the network connects to a **number** it resolves later, and the same internal address has many textual forms. Recognize a weak filter by what it can be fed:

- **Numeric encodings** (decimal, hex, octal, mixed). Whether one slips past depends on _where_ the filter looks: the raw string `0x7f000001` matches nothing, but the parsed `hostname` may already be `127.0.0.1`. Run the checker on the exact form.
- **Ranges the list never enumerated**: RFC1918 (`10.x`, `172.16-31.x`, `192.168.x`), the carrier range (`100.64.0.0/10`), the unspecified address.
- **IPv6 loopback and private space**, compressed, expanded, and IPv4-mapped.
- **Userinfo "@" and backslash confusion**, where filter and client disagree on which side of the `@` is the host.
- **Unicode look-alikes** that normalize to a forbidden name.
- **DNS rebinding** (resolves public when checked, internal when fetched) and **redirect chains** (only the checked hop was safe).

A blocklist cannot win, there is always one more form. Allow only what is known-good. When arbitrary URLs must be accepted, fall back to resolved-address validation: resolve the host yourself, check **every** address returned (all A and AAAA records), reject any private, loopback, or link-local, and connect to the address you validated, not the name (reconnecting by name reopens the rebinding gap).

##### How to check a destination

Lagune ships a deterministic checker for the textual-form bypasses above. Pass each destination with `-u`, quoting it so quotes or backticks cannot break the command. Repeat `-u` to score in one call every host an allowlist or denylist names, and every literal the validation compares against, one verdict per line, in order:

```bash
node ./.lagune/hooks/network.mjs -u '<URL-OR-HOST>' -u '<URL-OR-HOST>'
```

It resolves the host the way the network does (hex, octal, dotless, shorthand, IPv6, IPv4-mapped, trailing dots) with no DNS lookup, and prints one of four words:

- **`safe`**: connects to a public host, and a sloppy validator would read the same host.
- **`private-target`**: resolves to a private, loopback, link-local, unspecified, or cloud-metadata address.
- **`parser-divergent`**: a sloppy validator would read a different real host than the fetcher connects to (userinfo or backslash confusion).
- **`invalid url`**: does not parse, so there is nothing to fetch. Treat it as a block.

The hook exits non-zero when any destination reads `private-target` or `parser-divergent`, and exits zero when every line is `safe` or `invalid url`.

Cite a form as a bypass only after running it: reproduce the filter's own check against the form, then confirm internal with the checker. Two things stay out of its reach because it does no DNS lookup: **DNS rebinding** and **redirect chains**, closed by the controls above, and any DNS name other than the reserved loopback names (`localhost` and the `.localhost` family), which it reads `safe` because asserting an internal name resolves inward would need resolution. The allowlist guards those.

#### Cloud instance metadata exposure

A fetch that reaches the link-local metadata endpoint is one of the highest-impact SSRF targets: it answers any local request with the instance's temporary role credentials and bootstrap data (often plaintext secrets), and the attacker then acts as the instance against whatever the role can touch. Every major cloud exposes it at the same link-local address, and some also behind an internal name, so a denylist on the IP alone misses the name. The checker flags the address in every encoded form, but cannot resolve the name.

Beyond the baseline shapes, where they fit:

- **Require the metadata service's hardened mode** (token-required, hop limit of one). It is a layer, not a cure: the real fix is making the endpoint unreachable.
- **Give the instance role least privilege**, so a leaked credential reaches little.

#### Implicit trust in the internal network

Internal services often run with no authentication on the reasoning that "only the internal network reaches them": admin panels, operator tools, password-less data stores. An SSRF turns that inside out, because the server making the request is already inside, so the attacker borrows its position. A fetch at an unauthenticated dashboard returns its contents (config, credentials, signing keys), and a connection to a password-less store reaches it directly.

Safer shape: the network is not a security boundary, so authenticate every internal service regardless of where it sits. Require a password on every data store, put real authentication in front of internal tools, and restrict egress so a leaked request cannot leave for an attacker-controlled host. This second barrier is what holds when an SSRF does slip through.

#### Blind and semi-blind SSRF

A fetch feature is not safe just because it never shows you the response. It still leaks through side channels: **timing** (a reachable host answers fast, an unreachable one hangs, mapping the network one request at a time), **partial responses** (a different status or error for an open versus closed port enumerates the same map), and **out-of-band callbacks** (a connection arriving at an attacker-observed server proves the fetch fired and the filter was bypassed). Treat fire-and-forget and validation-only fetches (a webhook verifier, a link checker) as exactly as sensitive as one that returns content: the destination controls from "Unvalidated fetch" apply unchanged, none depend on the body coming back.

Safer shape for the side channels themselves: make reachable and unreachable destinations look identical from outside, a uniform timeout and response, to close the timing channel.

### Server-side open redirect, forward, and form action hijacking

The server builds a navigation target from a request value and emits it without opening it itself. The common shape is an **open redirect**: a `Location` response header (`response.sendRedirect(request.getParameter("url"))`, `header("Location: " . $_GET['url'])`, `Response.Redirect(url)`, `redirect_to params[:url]`) set from a `next`/`return_to`/`url` parameter and sent unvalidated. Because the link begins on your trusted domain, the user trusts it and is handed to an attacker's look-alike login, the classic phishing primitive. Its sharper use is as a **chain link**: a `redirect_uri` the OAuth server accepts because it starts with your domain, then bounces the authorization code to the attacker (exact `redirect_uri` matching is the `federation` sub-skill), or a redirect on a trusted host that slips a fetch past an SSRF allowlist (re-validate every hop, per the SSRF blocks above). A **server-side forward** (`getRequestDispatcher(fwd).forward(...)`) is the same defect aimed inward: a crafted `fwd` reaches an administrative target after the access check already passed, which is why OWASP files it under Broken Access Control. The landing target still needs the authorization the `access-control` sub-skill prescribes. **Form action hijacking** is the markup-generation variant: a form whose `action` attribute is rendered from a request parameter, so the submitted form (its fields, its CSRF token, its credentials) goes to the attacker's URL.

What makes each exploitable is that the validation, when present at all, is done by string operations: a `startsWith`/`contains`/regex check on the target. Those lose to the same textual forms that defeat an SSRF host filter, **userinfo abuse** (`https://example.com@evil.com`), a **protocol-relative** target (`//evil.com`, which inherits the page scheme), **URL-encoding**, the **backslash** trick (`https://evil.com\@example.com`), and **subdomain confusion** (`example.com.evil.com` passes a "contains" check). Recognize a weak redirect validator by exactly these.

Safer shapes, where they fit:

- **Prefer not taking the destination from input at all.** Map a short name, ID, or token from the request to a full target URL server-side, or for an internal redirect prepend your own origin to a request-supplied **path** (`redirect("https://example.com" + path)`) so the result is always on your domain. For a form, hard-code the `action`.
- **When an external target must come from input, allowlist it by parsed host,** the same way SSRF validates a fetch destination: parse with the language's real URL parser (`new URL()`, `urlparse`, `java.net.URI`), never string-match, and treat `parser-divergent` or `private-target` on the resolved target as a reject.
- **Re-validate every hop where the server itself follows the redirect** (the SSRF-chain case): connect with redirects disabled, or re-run the allowlist on each `Location`.
- **Authorize the landing target of a forward,** never assume the entry check covers where the forward arrives.
- **For an unavoidable external redirect, show an interstitial** that names the full destination and makes the user confirm leaving the site.

## How to act on the result

- **In detect (detection):** each destination built from a request value is a finding, whether the server fetches it (a user-supplied URL, socket, port, or UNC path) or hands it onward (a redirect, forward, or form `action`). Record what it is (the behavior being abused, per the blocks above), why it matters (it reaches a privileged surface, or sends the user or their form to an attacker), and the evidence. Where the code validates a destination against host literals, confirm a bypass before claiming one by the procedure under "How to check a destination": cite only a form that passes the code's own filter and reads `private-target` or `parser-divergent`.
- **In verify (proof):** the control holds only when the destination is no longer assembled from input under any of the conditions the Safer shapes above set: the allowlist (or validated resolved address), the restricted client schemes, hop re-validation, the second-barrier authorization, the server-side name map or own-origin path. The checker is deterministic, so when you run it on a destination the code actually builds and it reads `private-target` or `parser-divergent`, that is the risk open, full stop. The only verify case where such a verdict is benign is when you deliberately feed it a literal the validation must reject, to confirm the control rejects it: there the verdict describes your test input, and closure is proven by reading the code and seeing the validation actually reject that form. The checker does not prove the runtime parts (DNS rebinding, redirects followed at runtime, egress), which still need their own reasoning. If a destination the code builds can reach an internal target, or hand the user or their form to an attacker-chosen origin by any path, the risk is not closed: record it and point back to harden.
