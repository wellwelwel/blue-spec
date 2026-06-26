# Credential endpoint vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/> and <https://owasp.org/www-community/attacks/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

A credential endpoint is any surface that takes a secret and tells the caller whether it was right: the login form above all, but also a one-time-code check, a password-reset or recovery step, a "confirm your password" gate, a coupon or gift-card redeemer, a token or API-key check. The single theme is **automated, high-volume guessing**: the endpoint can be asked its yes/no question with no limit on the **rate and volume** of attempts. The fix is a cost and a ceiling keyed across account, source, and global, plus a signal to tell a human apart from a script. Getting the decision itself right (hashing, session, authorization, recovery verification) is the `access-control` terrain, and validating an externally issued or federated token (OAuth, SAML, JWT) is the `federation` terrain.

### The shapes of guessing (brute force, spraying, stuffing)

The same endpoint is attacked along three axes, and a defense tuned for one misses the others:

- **Brute force:** many passwords against **one** account, walking a dictionary or keyspace until one works.
- **Password spraying:** **one** common password (`Spring2025!`, `Password1`) tried against **many** accounts, one or two attempts each. It is built to stay under a per-account failure counter: no single account ever trips the lockout, yet the attacker sweeps the whole user base.
- **Credential stuffing:** username-and-password **pairs leaked from another breach** replayed here, betting on password reuse. Each pair is tried once or twice, so it also evades per-account counters, and because the pairs are real elsewhere the success rate is worth automating at scale.

The consequence: **per-account lockout alone does not defend this endpoint.** It stops classic brute force but is blind to spraying and stuffing, which spread thinly across accounts on purpose. A naive lockout also creates its own denial-of-service: an attacker who knows a username can lock its owner out at will. The control must watch the endpoint as a whole (failures per source, per endpoint, globally), not just per account.

Safer shapes, applied where they fit:

- **Rate-limit the endpoint on several keys at once**, not one. Throttle per account, per source IP, per device or session, and globally, so a pattern that hides under one key is caught by another. Spraying and stuffing show up in the cross-account totals even when every single account looks quiet.
- **Add cost after a few failures, not a hard permanent lock.** Prefer progressive delays (exponential backoff), a temporary cooldown, or a step-up challenge over an indefinite lockout that an attacker can weaponize against legitimate users. If you do lock, lock for a bounded window and notify the account owner.
- **Make a wrong answer cost the same whether the account exists or not.** Uniform response and uniform timing on login, reset, and signup, so the endpoint does not double as a username oracle that makes guessing more efficient (this overlaps the recovery and anti-enumeration guidance in `access-control`).
- **Treat reuse as the root of stuffing.** Check submitted passwords against a known-breached-password list (k-anonymity range query, never sending the full hash) and reject matches at set time, so a credential already leaked elsewhere cannot be reused here. Encourage or require a second factor, which makes a correct stolen password insufficient on its own.

### Anti-automation and bot management

Every guessing campaign is economical only because a machine makes the attempts. The broader control is telling automated traffic apart from a human and raising the price of automation, on the credential endpoints and on any other abusable high-value action (bulk account creation, coupon or gift-card enumeration, OTP-request flooding, scraping).

The failure is an endpoint with no proof-of-humanity and no automation signal: no challenge, no device fingerprint, no behavioral check, and rate limits keyed only on a source IP the attacker rotates through thousands of residential addresses, one attempt each. Distributed automation then dissolves every single-key limit, and the volume itself (mass OTP sends, mass account creation) becomes the damage even before any credential is guessed.

Safer shapes, applied where they fit:

- **Introduce a proof-of-work or proof-of-humanity after a few failures or on risk signals**, a CAPTCHA or an invisible challenge, so each additional attempt costs the attacker real time or compute. Trigger it adaptively (on failure rate, on a new device, on a suspicious source) rather than on every legitimate user, to keep the friction off normal logins.
- **Use signals beyond the IP.** Device and TLS fingerprints, a session or device token, and behavioral cues (typing and timing patterns, navigation) let a limit key on something an attacker cannot rotate as cheaply as an address. Combine them, since any one alone is evadable.
- **Throttle the expensive and abusable actions, not just login.** Cap OTP and verification-email sends per account and per source, cap account creation, and rate-limit code-redemption and lookup endpoints, so automation cannot turn a free action into a flood or an enumeration.
- **Feed known-bad sources into the decision** (botnet ranges, datacenter IPs hitting a consumer login), and treat a bot-management service as one layer, not the whole defense: a determined attacker adapts, so keep the rate ceilings and the second factor underneath it.

## How to act on the result

- **In detect (detection):** each credential-checking endpoint reachable without a working limit on the rate and volume of attempts is a finding. Describe in plain language what it is (an endpoint that guessing or automation can hammer), why it matters (account takeover via brute force, spraying, or stuffing, or a flood or enumeration via unthrottled actions), and the evidence (the route and the absent or single-key limit). A per-account lockout with no cross-account or per-source control is still a finding against spraying and stuffing.
- **In verify (proof):** the control holds only when automated guessing is demonstrably uneconomical, not merely when a single rapid burst is blocked. Confirm the limit holds across keys at once: many passwords against one account is throttled, and a wide-and-thin sweep (one password across many accounts, or many breached pairs one attempt each) is caught by per-source and global ceilings rather than slipping under a per-account counter. Confirm a challenge or rising cost kicks in under sustained or distributed attempts, the endpoint does not leak whether an account exists, a known-breached password is refused, and OTP, email, and account-creation actions are capped. A bot-management or CAPTCHA layer alone does not count as closed, since it can be bypassed, so the rate ceilings and ideally a second factor must hold underneath. If the endpoint can still be asked its question fast or often enough for guessing or automation to pay off, the risk is not closed: record it as such and point back to harden.
