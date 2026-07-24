# /lagune.verify: Prove Security Controls Hold

> Prove each applied fix holds, then close out the ones that do.

Canonical: https://lagune.ai/docs/commands/verify
Last updated: 2026-07-24

⚖️ Prove each applied fix holds, by reading the code and confronting it with what harden recorded, then close out the ones that do.

## Run it

**Verify everything**

```prompt
/lagune.verify
```

**Point at paths**

```prompt
/lagune.verify src/routes/upload.ts
```

**By priority**

```prompt
/lagune.verify Critical and High
```

## How it works

It reads the code at each spot harden recorded and confirms it really matches the claim. The proof is that confrontation, code against record. Each control gets one of three verdicts:

| Verdict                      | Meaning                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| ✅ Risk closed               | The code does exactly what the record claims.               |
| ❌ Risk not closed           | The control is still open. Verify sends you back to harden. |
| ❓ Cannot tell from the code | The evidence is not visible in the code alone.              |

A risk proven closed is then stood down out of the chain, with your confirmation. For example:

- **File uploads** (Verdict: **✅ Risk closed**)
  - _How proven:_ read the upload handler and saw it detects the file's real type from its content, enforces a size limit, and refuses anything else, exactly as the record claims.
  - _Evidence:_ the `handleUpload` function, which detects the real file type from content.

If the risk is not closed, verify says so plainly and sends you back to [`/lagune.harden`](https://lagune.ai/docs/commands/harden), since the fix is still open.

**Tip**

- It builds entirely on the hardening record.
- It only reads your code to judge it, and never weakens a control or rewrites the code to make a verdict pass.
- Running it again reconciles the report: stale verdicts drop off, and a risk that is no longer closed is flagged again.
- When a risk is proven closed, it asks once, then clears that finding from the whole chain (detect, plan, harden, verify, and tracking).
- The verification report lives in `.lagune/memory/verify.md`.

**Depends on harden**

Verify builds on [`/lagune.harden`](https://lagune.ai/docs/commands/harden).

## The cycle closes

When everything in scope is stood down, the cycle is at rest. It reopens only when the code changes. Security is closable, so the flow has an end state, not an endless loop.

## Frequently Asked Questions

### How does Lagune verify a fix?

/lagune.verify reads the code and confronts it with what harden recorded, returning one of three verdicts: Risk closed, Risk not closed, or Cannot tell from the code.

### What is a stand down?

When verify proves a risk closed, the finding is stood down: removed from the whole chain, with your confirmation, so it stops being reprocessed.

### Can security work ever be finished?

Yes. SDH is closable: a proven-closed finding is stood down, so the flow has an end state, not an endless loop.
