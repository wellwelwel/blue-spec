# SSRF (Server-Side Request Forgery) vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, "Server Side Request Forgery Prevention Cheat Sheet" (<https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html>).

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### Unvalidated fetch of a user-supplied destination

A server feature takes a URL or host from the user and fetches it: a webhook that pings a registered URL, a link-preview, an importer that pulls "from URL". It is exploitable when the destination is user-controlled, not validated (or only loosely), and the server can reach what the user should not, internal services, `localhost`/loopback, the cloud metadata endpoint, a password-less database. The server becomes the attacker's proxy, and the leak does not even need the body to come back (see "Blind and semi-blind SSRF"). The defense splits on one question: does the feature reach a **known set of hosts** (the common case, where an allowlist is the whole defense), or **any host the user names** (where no host allowlist exists, so the burden moves to the resolved address, see "Destination validation done wrong")? Prefer redesigning toward the known-hosts case.

Safer shapes, applied where they fit. These recur throughout, and later sections point back here:

- **Allowlist the destination**, never blocklist. Deny by default.
- **Take a host or IP field, not a full URL,** and build the request yourself, so no user string can make two parsers disagree.
- **Validate with a tested address parser**, one that resolves hex, octal, dotless, and IPv6-mapped forms (Blue Spec's checker is one), not raw-text comparison.
- **Restrict the client's schemes** to `http` and `https` (see "Over-capable fetch clients").
- **Do not follow redirects blindly**, or re-validate every hop (a validated host can redirect inward).
- **Keep a second barrier:** authenticate internal services and restrict egress (see "Implicit trust in the internal network").

### Over-capable fetch clients and dangerous protocols

A fetch client left in its permissive default speaks whatever scheme it is handed, so a user-supplied URL can drive it to `file://`, `ftp://`, or `gopher://`, none of which a "fetch a web page" feature needs. With `file://` the SSRF becomes local file read (`/etc/passwd`, the app's own `.env`, private keys). With `gopher://` it speaks an internal service's wire protocol directly, a known path to remote code execution against a password-less store. A tool that can do more than the use case requires will eventually be made to.

Safer shape: restrict the client to `http` and `https`. Combined with the host allowlist, a client that speaks only those schemes to known hosts has lost almost every move that makes SSRF dangerous.

### Destination validation done wrong (host blocklists are security theater)

A blocklist of host strings defends at the wrong layer: it inspects the **text** of the URL while the network connects to a **number** it resolves later, and the same internal address has many textual forms. Recognize a weak filter by what it can be fed:

- **Numeric encodings** (decimal, hex, octal, mixed). Whether one slips past depends on _where_ the filter looks: the raw string `0x7f000001` matches nothing, but the parsed `hostname` may already be `127.0.0.1`. Run the checker on the exact form.
- **Ranges the list never enumerated**: RFC1918 (`10.x`, `172.16-31.x`, `192.168.x`), the carrier range (`100.64.0.0/10`), the unspecified address.
- **IPv6 loopback and private space**, compressed, expanded, and IPv4-mapped.
- **Userinfo "@" and backslash confusion**, where filter and client disagree on which side of the `@` is the host.
- **Unicode look-alikes** that normalize to a forbidden name.
- **DNS rebinding** (resolves public when checked, internal when fetched) and **redirect chains** (only the checked hop was safe).

A blocklist cannot win, there is always one more form. Allow only what is known-good. When arbitrary URLs must be accepted, validate the resolved address: resolve the host yourself, check **every** address returned (all A and AAAA records), reject any private, loopback, or link-local, and connect to the address you validated, not the name (reconnecting by name reopens the rebinding gap).

#### How to check a destination

Blue Spec ships a deterministic checker for the textual-form bypasses above, one destination at a time. Pass the URL or host as a single quoted argument so quotes or backticks in it cannot break the command:

```bash
node ./.bluespec/hooks/url-safety.mjs '<URL-OR-HOST>'
```

Feed it each host an allowlist or denylist names, and each literal the validation compares against, one call per destination. It resolves the host the way the network does (hex, octal, dotless, shorthand, IPv6, IPv4-mapped, trailing dots) with no DNS lookup, and prints one of four words:

- **`safe`**: connects to a public host, and a sloppy validator would read the same host.
- **`private-target`**: resolves to a private, loopback, link-local, unspecified, or cloud-metadata address.
- **`parser-divergent`**: a sloppy validator would read a different real host than the fetcher connects to (userinfo or backslash confusion).
- **`invalid url`**: does not parse, so there is nothing to fetch. Treat it as a block.

Cite a form as a bypass only after running it: whether a textbook form (`http://0x7f000001/`, octal, dotless) bypasses _this_ filter depends on where the filter looks and the runtime's parser, so reproduce the filter's own check against the form first, then confirm internal with the checker. The checker does not resolve names, so **DNS rebinding** and **redirect chains** stay out of its reach, closed by the controls above. It pins the reserved loopback names (`localhost` and the `.localhost` family) to internal, but any other DNS name reads `safe`, because asserting `internal-host` resolves inward would need resolution: the allowlist guards those.

### Cloud instance metadata exposure

A fetch that reaches the link-local metadata endpoint is one of the highest-impact SSRF targets: it answers any local request with the instance's temporary role credentials and bootstrap data (often plaintext secrets), and the attacker then acts as the instance against whatever storage and secret stores the role can touch. Every major cloud exposes it at the same link-local address, and some also behind an internal name, so a denylist on the IP alone misses the name. The checker flags the address in every encoded form, but the name is a DNS name it cannot resolve.

Safer shapes, applied where they fit:

- **Require the metadata service's hardened mode** (token-required, hop limit of one). Treat it as a layer, not a cure, the real fix is still making the endpoint unreachable.
- **Give the instance role least privilege**, so a leaked credential reaches little.
- **Block the path at the network** with egress filtering.

### Implicit trust in the internal network

Internal services often run with no authentication on the reasoning that "only the internal network reaches them": admin panels and operator tools, password-less data stores. An SSRF turns that inside out, because the server making the request is already inside, so the attacker borrows its position. A fetch at an unauthenticated dashboard returns its contents (config, credentials, signing keys), and a connection to a password-less store reaches it directly.

Safer shape: authenticate every internal service regardless of where it sits, because the network is not a security boundary. Require a password on every data store, put real authentication in front of internal tools, and make reaching a service never by itself permission to use it. This second barrier is what holds when an SSRF does slip through.

### Blind and semi-blind SSRF

A fetch feature is not safe just because it never shows you the response. It still leaks through side channels: **timing** (a reachable host answers fast, an unreachable one hangs, mapping the network one request at a time), **partial responses** (a different status or error for an open versus closed port enumerates the same map), and **out-of-band callbacks** (a connection arriving at an attacker-observed server proves the fetch fired and the filter was bypassed). Treat fire-and-forget and validation-only fetches (a webhook verifier, a link checker) as exactly as sensitive as one that returns content.

Safer shapes, applied where they fit:

- Apply the same destination controls a body-returning fetch needs (the four from the first section). None depend on the body coming back.
- Make reachable and unreachable destinations look identical from outside, a uniform timeout and response, to close the timing channel.

## How to act on the result

- **In detect (detection):** each confirmed fetch of an untrusted destination that can reach a privileged surface is a finding. Record what it is (the feature that fetches a user-supplied URL), why it matters (it can reach internal services, cloud metadata, or password-less stores), and the evidence (the function or endpoint). A blind or fire-and-forget fetch counts the same. Where the code validates against host literals, confirm a bypass before claiming one by the procedure under "How to check a destination": cite only a form that passes the code's own filter and reads `private-target` or `parser-divergent`. It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when every condition is met at once: the destination is constrained to an allowlist (or a validated resolved address connected to directly), the client cannot speak `file://`, `ftp://`, `gopher://`, or other over-capable schemes, redirects are not followed blindly, and the privileged surfaces a request could still reach are themselves guarded. Use the checker to prove the textual-form part: every internal literal the validation must reject should read `private-target`. It does not prove the runtime parts (DNS rebinding, redirects, egress), which still need their own reasoning. If a user-controlled destination can still reach an internal target by any path, the risk is not closed: record it and point back to harden.
