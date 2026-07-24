# Infrastructure-as-code vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/>, and provider hardening guides.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

This terrain is the **infrastructure defined as static config**: Terraform/HCL, Dockerfiles, and GitHub Actions workflows. The defect lives in the declaration, never at runtime, and most of it is decidable from the file alone: a network opened to the world, a wildcard permission, a secret in a manifest, an image that runs as root, an untrusted value spliced into a CI shell. The neighbours: how a running container is contained is `container`, and FaaS trigger/IAM wiring is `serverless`.

### Deterministic pre-pass

Run the infra hook first. It reads only IaC files (`.tf`/`.tf.json`/`.hcl`, `Dockerfile*`, `.github/workflows/**`) and its verdict is literal.

```bash
node ./.lagune/hooks/infra.mjs           # scans every IaC file in the project
node ./.lagune/hooks/infra.mjs -d infra  # scans a directory
node ./.lagune/hooks/infra.mjs -f Dockerfile # scans a single file
```

It prints up to two sections. **Infrastructure risks found** exits non-zero and holds the decidable defects:

- **Terraform:** a security-group / NACL ingress open to `0.0.0.0/0` (or `::/0`) on a sensitive port, a wildcard IAM `Action`/`Resource`/`Principal` (`"*"`), a literal secret in a resource attribute, `encrypted = false`, and a git-sourced module with no pinned `?ref=<commit>`.
- **Dockerfile:** a final image that runs as root by an explicit `USER root`/`0` (a missing `USER` is not flagged, since the effective user comes from the base image, which the file does not show), and a `RUN` that pipes a downloaded script into a shell with no checksum/signature check.
- **GitHub Actions:** an untrusted `github.event.*` field interpolated into a `run:` block (script injection), and `permissions: write-all`.

**Infrastructure hardening advisories** does not change the exit code: a final `FROM` not pinned to a `@sha256` digest, and an action pinned to a tag/branch rather than a full commit SHA. These are posture, not defects. A clean run prints a single line. Score one snippet with `-p` and its kind `-k`:

```bash
node ./.lagune/hooks/infra.mjs -k terraform  -p 'actions = ["*"]'  # => iam-wildcard
node ./.lagune/hooks/infra.mjs -k dockerfile -p 'FROM node:20'     # => mutable-tag
```

### Reading beyond the hook

- **Encryption that is absent, not disabled:** the hook flags `encrypted = false`, but an encryption block that simply is not written (relying on a default, or expecting a sibling module to set it) it cannot judge. Confirm at-rest encryption is actually configured for every store.
- **`pull_request_target` and secret exposure:** a workflow that checks out untrusted PR code under `pull_request_target`, or exposes `secrets.*` / `id-token: write` to attacker-influenced steps, is dangerous only in combination. Read the trigger, the checkout, and the step that uses the secret together.
- **Over-broad state and drift:** a plan that widens access beyond the app's need, a wildcard the policy could scope down, a public bucket or database. The hook catches the blunt cases. The right scope is a judgment.

Safer shape: default every network to closed and open the minimum, scope every IAM statement to concrete actions and resources, keep secrets out of manifests (read them from a secret store), run containers as a non-root user from a digest-pinned base, and pin every third-party action to a commit SHA. Treat all workflow inputs from forks as untrusted.

## How to act on the result

- **In detect (detection):** each risk the hook reports is a finding. Record what it is, why it matters (the blast radius it opens), and the evidence (the file and the block). Advisories are posture to raise with the user, not automatic findings. It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the declaration is actually tightened: the ingress is scoped to known CIDRs, the IAM statement names concrete actions and resources, the secret is gone from the manifest, the image runs as non-root, and the workflow treats fork input as data. A plan that still declares the open state is not closed. If the applied config can still expose the resource, the risk is not closed: record it and point back to harden.
