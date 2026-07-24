# Hardcoded-secret vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

A **secret compiled into the artifact** is a credential (an API key, a token, a password, a private key) that lives in the source instead of in the environment or a secret store. It ships to everyone with repo access and stays in history forever, so a single leak of the code is a leak of the credential. The defect is decidable from the shape of the assignment alone: a literal, not a lookup. Two neighbours belong elsewhere: a secret in a `.tf`/Kubernetes manifest is `infra` (its `secrets-in-data` check), and how a validated secret is stored or rotated is `crypto` (key management).

### Deterministic pre-pass

Run the secrets hook first. It is deterministic and its verdict is literal: it keys on **provenance** (a literal versus an environment lookup), not on the value's contents, so it does not depend on an exhaustive catalog of provider prefixes and produces almost no false positives.

```bash
node ./.lagune/hooks/secrets.mjs           # scans the whole project
node ./.lagune/hooks/secrets.mjs -d <DIR>  # scans a directory
node ./.lagune/hooks/secrets.mjs -f <FILE> # scans a single file
```

It prints up to two sections. **Hardcoded secrets found** is the finding set and exits non-zero, holding the cases whose shape is decisive: a hardcoded fallback for an environment secret (`process.env.X ?? "…"`), a credential embedded in a connection string, or a value matching a curated provider format (AWS `AKIA…`, GitHub `ghp_…`, Stripe `sk_live_…`, a PEM private key). **Secret handling to review manually** is the lead set: a plain literal bound to a secret-named identifier, whose name and shape cannot prove it is a real credential rather than a hash, public key, or non-secret token, and a secret-named value flowing into a log or response sink. Read each by hand. A clean run prints a single line.

Flagging a committed secret by its format is standard defensive tooling (gitleaks, trufflehog, and GitHub push-protection do the same), shipping detection signatures, never a live secret.

### Reading beyond the hook

- **Split or obfuscated literals:** a token assembled from concatenated parts (`"ghp_" + "…"`) or base64-wrapped to dodge a scanner is the same defect. Treat the assembly as a lead and confirm by resolving it.
- **Secrets in the wrong file:** a `.env` committed to the repo, a credential in a checked-in config, or a key beside the data it protects. The hook skips `.env` and config formats by design (they are expected to be gitignored). Confirm they actually are.
- **A secret that reached a client bundle:** a key inlined into front-end code is public the moment it ships. A `NEXT_PUBLIC_`/`VITE_`-prefixed secret is exposed on purpose and must never be a real credential.

Safer shape: keep every credential out of source, config, and version control. Read it from the environment or a secrets manager at runtime, and if a literal ever reached a commit, rotate it, it is already burned.

## How to act on the result

- **In detect (detection):** each provider token, environment fallback, and connection-string credential the hook reports is a finding. Record what it is (a committed credential), why it matters (anyone with repo or history access holds the secret), and the evidence (the file and the identifier). A bare literal bound to a secret-named identifier, and a secret flowing into a sink, are leads to confirm, not automatic findings. Confirmed leads flow through detect's normal steps and are tracked like any other finding.
- **In verify (proof):** the control holds only when the credential is gone from the working tree **and** from history, and the code reads it from the environment or a secret store instead. A removed literal that still sits in an old commit is not closed (the secret must be rotated), and a value moved from a literal into a committed `.env` is not closed either. If any credential can still be recovered from the repository or its history, the risk is not closed: record it as such and point back to harden.
