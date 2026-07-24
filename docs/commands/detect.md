# /lagune.detect: Map Your System and Its Risks

> Read your code and map what your system does and where the risks are.

Canonical: https://lagune.ai/docs/commands/detect
Last updated: 2026-07-24

🔬 Find out what your system really does and where the risks are.

Detect reads the code and records only what it actually finds, with the evidence the later phases need. Its governing instruction is detection, not invention.

## Run it

**Full scan**

```prompt
/lagune.detect
```

**Point at paths**

```prompt
/lagune.detect src/routes/ src/auth.ts
```

**Describe a concern**

```prompt
/lagune.detect make sure customer data is never exposed
```

## What it maps

**Lagune** reads the code and maps what it finds. Each finding carries what it is, why it matters, and the evidence. For example:

- **File uploads**, the system accepts files from users:
  - _Why it matters:_ a file disguised as an image can hide malicious code.
  - _Evidence:_ the `POST /upload` handler trusts the MIME type the client sends, without checking the file's real type.
- **Login and sessions**, users sign in to reach their account:
  - _Why it matters:_ weak session handling lets one account be taken over by another.
  - _Evidence:_ the session issuance logic, where sessions are issued with no expiry set.

From there, you have a clear map of what your system does and where the risks live, ready for the next steps to act on.

**Tip**

- Running it again updates the map: solved findings drop off, new ones come in.
- The detect map lives in `.lagune/memory/detect.md`.

## Next

Turn the map into a plan: [`/lagune.plan`](https://lagune.ai/docs/commands/plan).

## Frequently Asked Questions

### What does /lagune.detect do?

It reads your code and maps what your system does and where the risks are, recording only what it actually finds. Its rule is detection, not invention.

### What is a finding in Lagune?

A finding is one detected risk, carrying what it is, why it matters, and the evidence in code. It is the tracked unit that plan, harden, and verify carry forward.

### Where is the detect map stored?

At .lagune/memory/detect.md.
