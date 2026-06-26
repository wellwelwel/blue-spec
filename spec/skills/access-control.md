# Access control vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/> and <https://owasp.org/www-community/attacks/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

Access control is one chain, not three features: **proving who the user is** (authentication), **carrying that proof** across requests (session), and **deciding what they may do and touch** (authorization). The blocks below hold or fail together, so audit them in one pass. Every one of these decisions must be enforced **server-side, from the authenticated identity**, never from a value the client sends and the server trusts.

### Broken object-level authorization (IDOR)

The application exposes a reference to an internal object, a database id, a filename, a key, in a URL, form field, or API path, and serves or mutates that object without checking the current user may reach **that specific object**. `GET /invoices/1043` returns invoice 1043 to whoever asks, because the code authenticated the user but never asked "is this user's invoice 1043?". Incrementing the reference (`1042`, `1044`) walks the whole table. The missing check is per-object, not per-user, so authentication can be perfect and the bug still present.

Safer shape: enforce ownership or permission on every object access, at the data layer where the object is loaded, keyed on the authenticated identity (`where id = ? and owner_id = current_user`). Where the reference itself should not be enumerable, map the user-facing handle to the real id through a per-user indirection or an unguessable identifier, but treat that as defense in depth: an unguessable id layers over the ownership check, it does not replace it.

### Broken function-level authorization (forced browsing)

Access to a privileged page, endpoint, or action is gated only by **not linking to it**, or by a check that runs in the UI and not on the server. The admin panel at `/admin`, the bulk-export endpoint, the "delete user" action, all reachable by typing the URL or replaying the request, because the server renders or executes them without re-checking the caller's role. Hiding a button is not authorization. The usual ways in: predictable paths, leftover debug or backup endpoints, and an HTTP method the UI never uses (a `PUT` where the page only sends `GET`).

A static asset can leak the same privilege model even when no endpoint is exposed. A stylesheet whose selectors name every role's features (`.addUsers`, `.deleteAdmin`, `.exportUserData`), or a per-role file (`AdministratorStyling.css`) served without the page's own authorization, hands an unauthenticated attacker that map straight from view-source.

Safer shape: deny by default and require an explicit, server-side authorization check on every endpoint and every action, including each HTTP method, derived from the authenticated identity's role or permission. Centralize the check (a gate every route passes through) rather than scattering per-handler `if` statements that are easy to forget. Remove or lock down unused, debug, and backup endpoints. Authorize any static asset that reveals a role the same way as the page it styles, and keep selector names from describing the feature they gate: scope them per component or obfuscate them at build time (CSS Modules, JSS, scoped CSS).

### Parameter tampering and setting manipulation

The client controls a value the server then treats as authoritative for a security or business decision: a `price`, `quantity`, `discount`, `role`, `isAdmin`, `account_id`, or `userId` carried in a form field, query string, cookie, or hidden input and used without re-deriving or re-validating it server-side. The attacker edits `price=100` to `price=1`, flips `role=user` to `role=admin`, or changes `account_id` to someone else's. **Setting manipulation** is the same mistake on a write: a request that sets a configuration or preference value (the email used for password reset, a notification target, a feature flag, a quota) is accepted as sent, letting the attacker reconfigure the application or another account in their favor.

Safer shape: never trust a client-supplied value for a security or pricing decision. Re-derive it server-side from a trusted source (look the price up from the catalog by product id, take the acting user from the session, compute the total on the server), and for any value the client legitimately sends, validate it against what that user is allowed to set. Sign or keep server-side any state that must survive a round-trip, so a tampered copy is detected. Treat configuration writes as privileged: authorize who may change which setting, and confirm a sensitive change (the reset email, the payout account) out of band.

### Mass assignment (over-posting)

A handler binds an incoming object straight onto a model or record, so fields the client was never meant to set are written because they happened to be in the payload. A signup that accepts `{ name, email }` also accepts `{ name, email, role: "admin", emailVerified: true, balance: 9999 }` when the framework maps every key to a column. The attacker exploits the gap between the fields the form shows and the fields the bind accepts.

Safer shape: bind only an explicit allowlist of fields per operation (a per-action input type or DTO, or a `permit`/`pick` list), never the whole request object onto the model. A block-list is fragile, since a new sensitive column is unprotected the day it is added. Keep authorization-bearing fields (`role`, `owner`, `verified`, `balance`) out of any client-bindable shape entirely, and set them only through code paths that check permission.

### Tenant isolation

A multi-tenant application serves many customers from shared infrastructure, and the boundary between them is a query filter rather than a wall. When a request reaches data without scoping every query to the caller's tenant, one customer reads or writes another's records, the most damaging failure for a SaaS product. The tenant must be derived from the authenticated session, never from a `tenant_id` the client sends (that is parameter tampering with a worse blast radius), and the scope must hold everywhere data is touched: the primary store, caches, search indexes, file storage, background jobs, and exports. A cache key or a shared connection that forgets the tenant leaks across the boundary even when the main query is correct.

Safer shape: bind the tenant to the server-side session and apply it as a mandatory filter on every data path, ideally enforced below the application (row-level security, a per-tenant schema or database, a query layer that refuses an unscoped read) so a forgotten `where tenant_id = ?` fails closed instead of returning everything. Scope caches, search, files, and jobs by tenant too, and run recurring cross-tenant probes that must return nothing.

### Transaction and step-up authorization

For an operation whose consequence is high (a payment, a transfer, a privilege change, a bulk delete), the action itself must be authorized, and bound to exactly what the user confirmed. The failures: an action runs on session alone with no re-authentication or confirmation, a confirmation step the attacker can skip or replay, or an approval not tied to the specific operation, so a token or "yes" captured for one transfer is reused for another (a CSRF-style or replay abuse). A summary the server never binds to the executed action lets what runs differ from what was confirmed.

Safer shape: require step-up authentication (re-enter the password, a second factor, a signed confirmation) for sensitive operations, and bind the authorization to the exact action: the actor, the operation, the target, the normalized parameters, a timestamp, and a short expiry, with replay protection so a captured approval cannot be reused or retargeted. Make irreversible actions idempotent or demand an explicit duplicate confirmation, and compute and display the real operation server-side so the user confirms what will actually run.

### Password and credential storage

Stored credentials are the highest-value target, and the failure is storing them recoverably: plaintext, reversible encryption, a fast or unsalted hash (`MD5`, `SHA-1`, raw `SHA-256`), or a home-grown scheme. A fast hash falls to offline cracking at billions of guesses a second once the store leaks, and an unsalted one falls to precomputed (rainbow) tables, so the whole user base is exposed by a single dump.

Safer shape: hash passwords with a memory-hard, deliberately slow, salted algorithm built for the purpose, **Argon2id** preferred, then **scrypt** or **bcrypt**, at tuned work factors, with a unique per-password salt the library handles. Never encrypt (reversible) when you can hash (one-way), never invent your own scheme, and verify with a constant-time comparison. Cap input length sensibly, consider an extra server-side secret (a pepper) held outside the database, and re-hash transparently on login when you raise the work factor or migrate algorithm.

### Authentication strength and account recovery

The login and recovery surfaces decide identity, and the weak spots are the policies around them rather than the password hash. **Weak factors:** a password-only login on a sensitive account with no option for a second factor, where any leaked or guessed credential is full access. **Recovery as a side door:** a "forgot password" flow weaker than the login it resets, security questions whose answers are public or guessable, a reset link or code that is long-lived, reusable, predictable, or sent to a destination the attacker just changed, or a reset response that reveals whether an account exists. **Identity binding:** an email or phone used as identity but never verified, so an account is created or taken over against a destination the user does not control, or a verified contact silently changed without re-confirmation.

Safer shape: offer multi-factor authentication, and require it for sensitive roles, preferring app-based or hardware factors over SMS. Make recovery no weaker than login: a single-use, expiring, unpredictable reset token sent only to a pre-verified, unchanged destination, with the same anti-enumeration response on reset, login, and signup (a uniform "if the account exists, we sent a link" message and uniform timing). Retire secret questions in favor of a proper recovery channel. Verify email and phone before trusting them as identity, with a signed, expiring, single-use link, normalize and validate the address, and re-confirm both old and new destination on any change. (Throttling credential guessing lives in the `credential-endpoint` terrain, and validating a federated token lives in `federation`: this block is the strength of the application's own login and recovery logic.)

### Session integrity

Authentication produces a session, the standing proof of identity for every later request, so a correct login is quietly undone here. The failures: **predictable identifiers**, a session id with too little entropy or a guessable pattern, so an attacker computes or brute-forces a valid one (session prediction). **Fixation**, the id is not regenerated at the privilege boundary, so an attacker who plants a known id before login (via a URL parameter or a set cookie) inherits the victim's authenticated session after they sign in. **Theft / hijacking**, the cookie is exposed to capture, missing `HttpOnly` (readable by injected script), missing `Secure` (sent over plaintext), missing or weak `SameSite` (sent on cross-site requests), or an id placed in the URL where it leaks through logs, history, and referers. **Stale lifecycle**, sessions that never expire, do not end on logout, survive a password change, or are not invalidated server-side, so a captured or shared session lives indefinitely.

Safer shape: generate session ids from a cryptographically secure source with ample entropy, and keep them server-side, in a cookie, never in the URL. Regenerate the id on every privilege change (login above all, also step-up and role change) to defeat fixation. Set `HttpOnly`, `Secure`, and an appropriate `SameSite` on the cookie, scope it tightly, and bind the session to its context where feasible. Enforce both idle and absolute timeouts, invalidate server-side on logout and on password or credential change, and let a user see and revoke active sessions.

## How to act on the result

- **In detect (detection):** each confirmed link that trusts the client where it must enforce server-side is a finding, named by its risk block above. Trace it concretely (for an IDOR, that incrementing `GET /invoices/1043` to `1044` returns another user's record because no ownership check keys on the session). Describe each in plain language: what it is, why it matters (from reading one other user's record to full account or tenant takeover), and the evidence (the endpoint, query, handler, storage call, or cookie configuration). Because the blocks are one chain, note the links that compound: an IDOR is worse alongside a long-lived session. It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** prove each link empirically against the Safer shape of its block, not by checking the UI hides the path. The closed conditions: a request for another user's object id is refused, a privileged endpoint and each of its HTTP methods is denied to an unprivileged caller, a tampered price, role, or `tenant_id` is overridden or rejected, an over-posted field never reaches the model, a cross-tenant query returns nothing, a sensitive action demands step-up and a replayed approval fails, the password store uses a slow salted hash, recovery is no weaker than login and does not reveal account existence, and the session id regenerates on login, carries `HttpOnly`/`Secure`/`SameSite`, and is invalidated on logout and password change. If any client-controlled value can still select an object, drive a decision, cross a tenant boundary, or stand in for identity, the risk is not closed: record it as such and point back to harden.
