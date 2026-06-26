# Identity federation vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/> and <https://owasp.org/www-community/attacks/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

The application accepts a **token or assertion** from an external party (an OAuth/OIDC provider, a SAML identity provider, a JWT signer, a QR-driven companion app) and grants a session on it. Detect finds the verification call and the session issued on its result. That session is only as safe as the verification: the application must confirm the token is authentic (signed by the expected issuer with a real algorithm), is meant for this application (the right audience), is current (not expired or replayed), and arrived through a flow an attacker cannot redirect or forge. Skip any one and the proof is forgeable, so an attacker mints or replays a token and logs in as anyone. The blocks below are the proofs an application receives and the ways each is accepted without being verified.

### JWT validation

A JSON Web Token carries claims and a signature, trustworthy only when the signature is verified with the **right key and the right algorithm** and the claims are checked. The failures all let an attacker supply a token the application accepts as genuine:

- **`alg: none`:** the token declares no signature, and a library that honors the header accepts an unsigned token as valid. An attacker drops the signature, edits the claims, and is admitted.
- **Algorithm confusion (`RS256` to `HS256`):** the verifier picks the algorithm from the token's own header, so an attacker changes a token signed with RSA (`RS256`) to claim `HS256` and signs it with the server's **public** key as the HMAC secret. Because the public key is public, the forged signature verifies. The token's header must never decide the algorithm.
- **Signature not verified at all:** the code decodes the token and reads its claims without verifying the signature, treating a base64 payload anyone can edit as authenticated state.
- **Missing claim checks:** even a correctly signed token must be the right one. No `exp` check never expires, no `iss` check accepts a token from any signer, no `aud` check accepts a token minted for a different application (service A replayed at service B), and no `nbf`/`iat` sanity lets a stale or future-dated token through.
- **Weak or shared secret:** an `HS256` token signed with a short, guessable, or hardcoded secret is forgeable by anyone who recovers it, and a secret shared across services lets one service mint tokens another trusts.

Safer shape: pin the accepted algorithm in the code, never read it from the token header, and reject any token whose `alg` is not the expected one (and reject `none` outright). Verify the signature against the issuer's published key (the JWKS, matched by `kid`) for asymmetric tokens, and use a long, random, per-service secret for symmetric ones. After the signature passes, validate every claim that bounds the token: `iss` is the expected issuer, `aud` is this application, `exp` is in the future and `nbf`/`iat` are sane, and the subject and scopes are what the operation requires. Keep token lifetimes short, and prefer a vetted library configured strictly over hand-rolled verification.

### OAuth 2.0 and OpenID Connect flow integrity

OAuth/OIDC delegates authentication to a provider through a sequence of browser redirects, and the integrity of that sequence is the security. The breakages:

- **No `state`, so CSRF on the callback:** without an unguessable `state` value bound to the user's session and checked on return, an attacker initiates a flow, captures their own authorization code, and tricks the victim's browser into completing it, linking the attacker's identity to the victim's session (or the reverse, session fixation onto the victim). `state` is the CSRF token of the OAuth flow.
- **Unvalidated `redirect_uri`:** the provider sends the code or token to the `redirect_uri`, so if the application or the provider accepts a loosely matched one (a substring, a wildcard, an open redirect on the registered host, a path the attacker controls), the code or token is delivered to the attacker. The redirect target must match a pre-registered exact value.
- **Authorization code interception without PKCE:** a public client (a mobile or single-page app) that exchanges a code with no PKCE lets an attacker who intercepts the code redeem it. PKCE binds the code to the client that started the flow.
- **Implicit flow and tokens in the URL:** the legacy implicit flow returns the access token in the redirect fragment, where it leaks through history, referers, and logs.
- **Accepting an ID token or `userinfo` without validation:** an OIDC ID token is a JWT and must be validated as one (see the JWT block), plus its `nonce` checked against the one sent. Trusting an unvalidated `access_token` as proof of identity, or reading the email from an ID token without verifying `aud`/`iss`/signature, lets a token from another client or a forged one authenticate the wrong user (the confused-deputy and token-substitution risks).
- **Scope and consent creep:** requesting broad scopes, or treating a granted scope as an authorization decision the application should make itself, hands more than the feature needs.

Safer shape: use the authorization-code flow with PKCE for every client, never the implicit flow. Generate a random `state` bound to the session and reject a callback whose `state` does not match, and send and verify a `nonce` for OIDC. Register exact `redirect_uri` values and match them exactly, never by prefix or wildcard. Validate the ID token as a JWT (signature, `iss`, `aud`, `exp`, `nonce`) before trusting any claim, and use the `access_token` only to call APIs, never as proof of who the user is. Request the narrowest scopes, keep the client secret server-side, and make the application's own authorization decision rather than inferring it from a scope.

### SAML assertion validation

SAML carries identity as a signed XML assertion. XML signatures are subtle, so the failures cluster around trusting an assertion the identity provider did not actually sign over the data the application reads:

- **Unsigned or partially signed assertion:** the application reads the subject from an assertion (or a response) whose signature it never verified, or verifies the response signature but consumes an unsigned inner assertion. An attacker forges or edits the identity.
- **XML Signature Wrapping (XSW):** the attacker keeps a validly signed assertion but wraps or appends a second, forged assertion so the signature checker validates the original while the application reads the injected one. The verification and the consumption look at different elements.
- **Signature confusion and weak validation:** accepting any signing certificate rather than the pinned identity-provider certificate, ignoring the canonicalization or transform tricks (including the XML-comment truncation bug that splits a username), or trusting an assertion signed by an unexpected key.
- **Missing condition checks:** not enforcing `Conditions` (`NotBefore`/`NotOnOrAfter`), `AudienceRestriction` (the assertion is for this service provider), `Recipient`, and `InResponseTo`, so a stale, replayed, or wrong-audience assertion is accepted.

Safer shape: verify the XML signature against the **pre-configured identity-provider certificate** (pinned, not taken from the message), and ensure the element you validate is the exact element you consume, so wrapping cannot split them. Require the assertion (not only the response) to be signed, reject multiple or unexpected assertions, and enforce every condition: validity window, `AudienceRestriction` equals this service provider, `Recipient` matches the assertion-consumer URL, and `InResponseTo` ties back to a request you sent (with replay protection). Use a mature, maintained SAML library configured strictly rather than parsing XML by hand, and canonicalize defensively.

### Cross-device and QR-code login (QRLjacking)

A "scan to log in" or "approve on your phone" flow authenticates one device by an action on another, and the danger is that what gets approved is not bound to the user who approves it. In **QRLjacking**, the attacker lifts a login QR code that encodes a session they control and relays it to the victim through a phishing page. The victim scans it with their authenticated app, binding their account to the attacker's waiting session: account takeover. The same shape covers any out-of-band approval whose confirmation does not show, and bind to, exactly what is authorized.

Safer shape: bind the cross-device login to context the attacker cannot relay transparently. On the approving device, show a clear description of the session being authorized, the requesting device, location, and a short matching code the user confirms, so a relayed QR is visibly wrong. Expire the QR or push challenge quickly, tie it to the originating device or browser session, require an explicit approve step rather than mere possession of the code, and reject a code presented far from where it was issued. Treat the approval like any sensitive action: it must describe the real operation and be bound to the actor, not just scanned.

**Boundary (not a risk to check code against).** Verifying the external proof only establishes **who** the user is. What happens next (the session issued, the per-object authorization, the recovery flow) is `access-control`: a perfectly validated token over a broken session or a missing ownership check is still exploitable. Rate-limiting the guessing of the application's own credentials is `credential-endpoint`.

## How to act on the result

- **In detect (detection):** each place the application accepts an external token or assertion and grants identity on it without fully verifying it (the failures above) is a finding. Describe in plain language what it is (a federated login that trusts a forgeable or replayable proof), why it matters (an attacker mints or replays a token and authenticates as any user), and the evidence (the verification function, the callback handler, the assertion consumer, the QR flow). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when a forged, swapped, or replayed proof is demonstrably rejected, not merely when a genuine login works. Confirm empirically that a token with `alg: none`, a public-key-as-HMAC `RS256`-to-`HS256` swap, an unsigned or edited payload, or a wrong `aud` or expired `exp`, is refused. An OAuth callback with a missing or mismatched `state` (or a `redirect_uri` not exactly registered) fails, and an ID token is validated before any claim is trusted. A SAML response with an unsigned, wrapped, or wrong-audience assertion is rejected against the pinned IdP certificate. A relayed QR or unbound cross-device approval does not complete. The algorithm must be pinned in code, the signature verified against the expected key, every bounding claim or condition enforced, and the flow's anti-CSRF and exact-redirect controls present. If any forgeable or replayable proof can still mint a session, the risk is not closed: record it as such and point back to harden.
