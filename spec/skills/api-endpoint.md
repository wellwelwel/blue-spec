# API endpoint vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

This terrain is the **non-REST API surface**: a GraphQL endpoint, a gRPC service, a WebSocket connection. Each hands the server a **richer request** than a fixed route does: a nested query to resolve, an RPC method to dispatch, a long-lived stream of messages. The shared mistake is **trusting the connection instead of the operation**, authorizing once at the door and then serving whatever the open session asks. One GraphQL query can fan out to thousands of objects, one gRPC stream can run forever, one WebSocket can carry an injection on its hundredth message. Each operation, field, method, and message is its own request and needs its own check. The injection, transport, and SSRF facets reached through this surface point back to the sub-skill that owns them rather than restating it.

### Per-operation authorization, not per-connection

A single connection or token opens the door, and the server then serves every field, method, or message it carries without re-checking authority for each one. In GraphQL an object is fetched by its `id` and returned because the caller named it, with no check that the caller may see it (Broken Object Level Authorization, the GraphQL face of IDOR), or authorization is enforced on a connection's edges but not its nodes, or on a query but not the mutation that writes. A schema that exposes `node`/`nodes` lets a caller fetch any object by global ID, bypassing the intended entry points. In gRPC the gap is method-level: the call is authenticated, but no per-method check confirms the caller's role permits _this_ RPC. In WebSocket it is per-message: the handshake authenticated the user, but every later message (`delete_user`, `transfer`) is acted on without re-checking that this user may perform it.

Safer shapes, applied where they fit:

- **Authorize the operation, not the connection.** Check authority inside each GraphQL resolver (query and mutation alike), each gRPC method (a server interceptor keyed on the method name and the caller's role), and each WebSocket message handler, never once at connect time.
- **Authorize objects by ownership, not by the caller naming the ID.** Possession of an identifier is not permission, verify the caller may reach that object. This is the same control the `access-control` sub-skill details for IDOR/BOLA, reached through the API instead of a REST route.
- **Apply checks to edges and nodes both,** and disable or guard `node`/`nodes` global-ID lookups that sidestep field-level authorization.

### Query-shape and message-volume denial of service

The request itself is a program whose cost the client controls, and left unbounded it exhausts the server. GraphQL is the sharpest case: a query can nest deeply (each level resolving more objects), ask for a huge `first:`/page count, or **batch** many operations and aliased object requests into one network call, so a single innocuous-looking request fans out to thousands of resolutions. Batching also amplifies brute force: aliasing the same field hundreds of times enumerates objects, sprays passwords, or grinds OTPs and tokens, while a perimeter rate limiter or WAF counts network requests and sees one. gRPC streaming lets a client send arbitrarily large messages or an unbounded count per stream, exhausting memory. WebSocket's persistent connection invites connection exhaustion, message flooding, oversized payloads, and memory blowup from a producer faster than the server drains it (missing backpressure).

Safer shapes, applied where they fit:

- **Bound the request shape at the application layer.** GraphQL: cap query depth and amount, paginate, and prefer query _cost analysis_ (assign a cost per field, reject queries over a budget) for anything with nested relationships. Infrastructure timeouts trip late and are bypassable, so set application-level timeouts on queries and resolvers too.
- **Limit batching as its own control.** Cap how many operations and object instances one call may request, and **forbid batching outright for sensitive objects** (credentials, OTPs, tokens) so brute force must come one slow network request at a time.
- **gRPC:** set `MaxRecvMsgSize`/`MaxSendMsgSize`, cap messages and duration per stream, and set server-side deadlines.
- **WebSocket:** cap total and per-user connections, set a message size limit (`maxPayload`, commonly 64KB or less), rate-limit messages, close idle and dead connections (idle timeouts plus ping/pong heartbeats), and apply backpressure so a fast sender cannot exhaust memory.
- **Rate-limit on identity, not only IP,** and for GraphQL batching keep that limit in code, since one network call hides many operations.

### Schema and introspection exposure

The endpoint volunteers its own map. GraphQL ships with **introspection** and often **GraphiQL** enabled by default and unauthenticated, handing any caller the full schema: every type, field, deprecated and "private" field, and mutation. Even with introspection off, the built-in **"Did you mean …?"** field suggestion leaks names by brute force, and excessive errors (stack traces, debug mode) disclose internals. gRPC has the same shape in **server reflection**, which lets a client enumerate every method and message schema at runtime, narrowing the search to your exact API surface.

Safer shapes, applied where they fit:

- **Disable introspection and GraphiQL in production** (or gate them to authorized roles for a deliberately public API), and disable the field-suggestion hint alongside introspection where the implementation allows.
- **Disable gRPC reflection in production,** enabling it only outside production by an explicit environment check.
- **Return generic errors.** Turn off debug mode and stack traces, log the detail server-side and hand the caller a generic message and an appropriate status code. This is the same discipline the `interpreter` sub-skill applies to error and log output, reached through the API.

### Untrusted message payloads reaching an interpreter

A structured protocol does not sanitize its contents. A GraphQL argument, a Protocol Buffer field, a WebSocket message is untrusted input on its way to a data fetcher, a database query, an OS call, or the DOM, so every injection class (SQL/NoSQL, OS command, LDAP, XML/XXE, CRLF, and XSS when a message is rendered) reaches the same sinks it always does, only through this door. Protocol Buffers give _type_ safety, never _business-logic_ validation, so a well-typed message can still carry an injection. A specific WebSocket trap is parsing a text message with `eval()` instead of `JSON.parse()`, turning every message into code execution.

Safer shape: validate every operation's input against an allowlist (GraphQL custom scalars/enums and input types, `protoc-gen-validate` rules on protobuf messages, a JSON schema and size limit on WebSocket messages), then treat the value as untrusted at the sink exactly as the `interpreter` sub-skill prescribes: parameterized queries, safe APIs, escaping for the target interpreter, and `JSON.parse()` never `eval()`.

### Transport and connection-origin trust

These protocols ride their own transport and inherit its mistakes. gRPC over HTTP/2 and WebSocket both need encryption (gRPC TLS, and **WSS** never plaintext `ws://`), and a missing or weak configuration exposes them to eavesdropping and tampering. gRPC's service-to-service trust commonly rests on **mTLS** (both ends verify certificates), which a one-sided or absent configuration silently weakens. The TLS/mTLS/WSS configuration itself is the `transport` sub-skill's terrain, consult it for the cipher, version, and certificate details.

WebSocket adds a trap with no REST equivalent: **Cross-Site WebSocket Hijacking (CSWSH)**. The handshake is an ordinary cross-origin request the browser attaches the session cookie to, and WebSockets have **no built-in CSRF/origin enforcement**, so a malicious page can open a socket to your app and the browser sends the victim's cookie, handing the attacker a live authenticated channel. The `Origin` header is the one value here the browser sets and page script cannot forge, which is why it must be checked.

Safer shapes, applied where they fit:

- **Require encryption:** TLS 1.2+ with strong ciphers for gRPC, `wss://` for WebSocket, and mTLS with short-lived, rotated certificates for service-to-service gRPC.
- **Validate the WebSocket `Origin` on every handshake against an exact allowlist** (no wildcards, no substring matching), add CSRF tokens to the handshake where the app already uses them, set `SameSite` cookies, and tie connection lifetime to the session (re-validate periodically, close on logout and on session expiry). The cross-site-request reasoning is the `http-request` sub-skill's, applied to the upgrade.

## How to act on the result

- **In detect (detection):** each gap above is a finding: an operation acted on without re-checking authority for that operation or object, an unbounded request shape (depth, batching, stream or connection volume), an introspection, GraphiQL, or gRPC reflection surface left open in production, a message reaching an interpreter sink unvalidated, or an unencrypted (`ws://`, plaintext gRPC) or origin-unchecked (CSWSH) connection. Record what it is, why it matters, and the evidence (the resolver, method, handler, or server config). Where the injection, transport, or SSRF facet is the real issue, record it and follow the `interpreter`, `transport`, or `network` sub-skill, this one only names that the API surface is how it is reached. It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when authority is checked per operation, the request shape is bounded, introspection and reflection are off (or authorized-only) in production with generic errors, every message input is allowlist-validated, and the channel is encrypted with the WebSocket `Origin` checked against an exact allowlist. If any single operation can still reach data without authority, fan out unbounded, expose the schema, carry an injection to a sink, or ride a hijackable or cleartext connection, the risk is not closed: record it and point back to harden.
