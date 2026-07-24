# /lagune.plan: Score Findings and Plan Fixes

> Turn what detect found into a defense plan, rating each finding with a category and a CVSS v4.0 score, and pairing it with a fix.

Canonical: https://lagune.ai/docs/commands/plan
Last updated: 2026-07-24

🛡️ Turn what detect found into a defense plan: rate each finding with a category and a CVSS v4.0 score, then pair it with the fix to apply.

## Run it

**Plan everything**

```prompt
/lagune.plan
```

**Point at paths**

```prompt
/lagune.plan src/routes/upload.ts
```

**Focus a worry**

```prompt
/lagune.plan where sensitive data could leak
```

## How it works

This phase continues from detect. Detect already found what your system does and the risk each thing carries, so the plan does not repeat the risk, it rates how serious it is and decides what to do about it. Plan never reads the code, which forces every fix to point at something detect actually detected. It rates each finding with the CVSS v4.0 method: a category, a CVSS v4.0 vector and score reasoned from what detect and the charter captured, and the priority band that score lands on. Each fix also carries the charter principle it upholds.

For example:

- **File uploads** (Priority: **Critical**)
  - _Category:_ Unrestricted file upload (CWE-434).
  - _CVSS:_ CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N (9.3, Critical).
  - _Why this priority:_ anyone can reach the upload over the internet, and it sits on the server that stores customer files.
  - _Upholds:_ III. All input is untrusted until validated.
  - _Fix:_ check the file's real type and size, rename it on save, and store uploads where they cannot be run as code.

From there, you have a rated, prioritized list of fixes, each tied to a finding and ready for the next phase to apply. Because the CVSS vector is Base-only, anyone can paste it into the FIRST or NVD calculator and rederive the same score.

**Tip**

- It builds entirely on detect. If a file or worry was never mapped, it tells you to run `/lagune.detect` on it first.
- Running it again updates the plan: done fixes drop off, new ones come in.
- The defense plan lives in `.lagune/memory/plan.md`.

**Depends on detect**

Plan works only from what [`/lagune.detect`](https://lagune.ai/docs/commands/detect) already mapped, so run detect first.

## Next

Apply the plan: [`/lagune.harden`](https://lagune.ai/docs/commands/harden).

## Frequently Asked Questions

### How does Lagune prioritize vulnerabilities?

/lagune.plan rates each finding with a category and a CVSS v4.0 base score, then pairs it with the fix to apply.

### Does Lagune use CVSS v4.0?

Yes. Each finding gets a CVSS v4.0 base vector and score. Because the vector is Base-only, anyone can paste it into the FIRST or NVD calculator and re-derive the score.

### Does the plan read my code?

No. Plan never reads the code, which forces every fix to point at something detect actually detected.
