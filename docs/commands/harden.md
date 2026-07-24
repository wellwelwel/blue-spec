# /lagune.harden: Apply Security Fixes to Your Code

> Apply the plan's fixes to your code, safely and one at a time.

Canonical: https://lagune.ai/docs/commands/harden
Last updated: 2026-07-24

🔧 Apply the plan's fixes to your code, safely and one at a time.

## Run it

**Apply everything**

```prompt
/lagune.harden
```

**Point at paths**

```prompt
/lagune.harden src/routes/upload.ts
```

**By priority**

```prompt
/lagune.harden Critical and High
```

## How it works

The plan already decided each fix, so harden just applies it. Since this is the one phase that touches your code, it goes carefully: it shows you each change and asks first, applies one fix at a time so every change stays easy to review, and never weakens a control to make a fix fit. For example, the upload fix:

- **File uploads** (Status: **Applied**)
  - _What changed:_ checks the file's real type and size, rejects anything unexpected, renames it on save, and stores it where it cannot be run as code.
  - _Where:_ the `handleUpload` function, plus the storage helper it calls.

If a fix cannot be fully applied, harden does what it safely can and marks the rest **Partial** or **Blocked**, leaving it open.

**Applied is not verified**

Applied does not mean proven yet. That is what [verify](https://lagune.ai/docs/commands/verify) is for.

**Tip**

- It builds entirely on the plan. If a fix or file was never planned, it tells you to run `/lagune.plan` on it first.
- It confirms before changing anything and never makes a destructive change without asking.
- Running it again reconciles the record: reverted changes drop off, newly applied fixes come in.
- The hardening record lives in `.lagune/memory/harden.md`.

**Depends on plan, and changes your code**

Harden builds on [`/lagune.plan`](https://lagune.ai/docs/commands/plan). It is the one phase that changes your code.

## Next

Prove each fix holds: [`/lagune.verify`](https://lagune.ai/docs/commands/verify).

## Frequently Asked Questions

### Does /lagune.harden change my code?

Yes. It is the one phase that touches your code, applying the plan's fixes one at a time.

### What do Applied, Partial, and Blocked mean?

They are the status Lagune records for each fix. Applied means the fix was made, Partial means only part of it, Blocked means it could not be applied. Applied does not mean proven yet.

### Does Lagune apply fixes without asking?

No. It never weakens a control to satisfy a prompt. If a fix would conflict with a charter rule, it stops and tells you first.
