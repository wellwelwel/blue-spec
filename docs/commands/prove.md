# /lagune.prove: Defense-Only Proof of Concept

> Turn each detected finding into a runnable, defense-only proof of concept (PoC) and advisory for responsible disclosure.

Canonical: https://lagune.ai/docs/commands/prove
Last updated: 2026-07-24

🧪 Turn each detected finding into runnable, defense-only evidence for responsible disclosure.

For every finding the detect map carries, it writes a self-contained advisory and a test that asserts the **safe path**, so the test fails while the issue is live and passes once the code is fixed.

**Tip**

**Lagune** tests live isolated under `.lagune/`, apart from your own suite.

## Run it

**Every finding**

```prompt
/lagune.prove
```

**A named finding**

See the findings already tracked by name:

```prompt
npx -y lagune@latest list --findings

# Findings
#   ...
#   • SQL injection in user lookup
#   ...
```

```prompt
# Then prove one of them
/lagune.prove SQL injection in user lookup
```

## How it works

It reads the source each finding points at and writes one directory per proven finding under `.lagune/proofs/`, holding exactly two files:

| File                          | What it is                                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `report.test.mjs` (or `.cjs`) | The test. It runs on Poku when your project already uses it, otherwise on the native Node.js runner, so it needs nothing installed. |
| `report.md`                   | A self-contained advisory: severity, impact, how it reproduces, and the run command, readable on its own.                           |

The proofs are always JavaScript, so they stay portable whatever language your project is written in. A `README.md` index links every proof and gives a single command to run them all.

**Tip**

- It is **optional and autonomous**: not one of the five phases, and not part of the tracking chain.
- It writes only into `.lagune/proofs/` and never touches the phase artifacts or your code, which it only reads.
- A finding whose test does not reproduce the issue gets no proof, and it tells you to run [`/lagune.detect`](https://lagune.ai/docs/commands/detect) on that spot to reconcile.
- Running it again reconciles the proofs: a finding that is gone or no longer reproduces has its directory removed.

**Builds on detect**

Prove reads the detect map from [`/lagune.detect`](https://lagune.ai/docs/commands/detect), so run detect first.

## Defense only, and authorized

Before generating anything, it confirms you are authorized to test the target, and it refuses any request for a working exploit, an attack payload, or detection-evasion. A proof demonstrates the safe behavior, it never emits an attack input.

## From proof to disclosure

Each proven finding's two files belong together in a **private GitHub Gist** to report the vulnerability. They are evidence of a live, undisclosed issue, so keep them out of commits and share them only through that Gist until the maintainers have resolved it.

Closing a finding in the **Lagune** chain is still the job of [`/lagune.harden`](https://lagune.ai/docs/commands/harden) and [`/lagune.verify`](https://lagune.ai/docs/commands/verify): prove produces evidence, it does not close anything.

## Frequently Asked Questions

### Does Lagune generate exploits?

No. /lagune.prove writes defense-only evidence: a test that asserts the safe path, so it fails while the issue is live and passes once the code is fixed, plus an advisory for responsible disclosure.

### What does prove output?

Two files per finding: a test (report.test.mjs or .cjs) and an advisory (report.md).

### How do I responsibly disclose a bug Lagune found?

Prove writes a self-contained advisory you can share through a private channel such as a private GitHub Gist, following responsible disclosure.
