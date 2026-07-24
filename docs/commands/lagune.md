# /lagune: Secure Code as Your AI Writes It

> Build what you ask and harden it as it is written, guided by the charter, with no flow to follow.

Canonical: https://lagune.ai/docs/commands/lagune
Last updated: 2026-07-24

⌨️ Do the work you asked for, secured as it is written. **`/lagune`** takes any prompt at any stage, builds what you wanted, and hardens it with safe defaults before handing it back.

## Run it

Mark **`/lagune`** on any prompt, and describe the work as you always would.

**📘 Agent Instructions**

```md
# My project instructions for agents

<!-- ... -->

## Security

- Use the `/lagune` skill whenever you build or change code, so it improves safety by default.
```

    - For example: **AGENTS.md**, **CLAUDE.md**, **.github/copilot-instructions.md**, **.cursorrules**, etc.

**💬 A feature**

```prompt
/lagune let users upload a custom photo on their profile.
```

**💬 A fix**

```prompt
/lagune nothing happens when the user submits the form. Look into what it might be and fix it.
```

**💬 A refactor**

```prompt
/lagune decouple and improve the payload logic
```

**Charter optional, but better with it**

**`/lagune`** runs with or without a charter. With one, your project's own rules shape every build. Set them once with [`/lagune.charter`](https://lagune.ai/docs/commands/charter).

## How it works

It wraps the work in three movements, without writing anything to Lagune:

1. It loads your charter, if it exists, and its principles govern the whole build, falling back to a safe-by-default baseline when you have none yet.
2. It reads what you asked and matches the [sub-skills](https://lagune.ai/docs/commands/skills) your work touches, the same on-demand knowledge the audit flow uses.
3. It applies the defense as the code is written, then re-reads its own result to confirm the controls actually hold before handing the work back.

The result is working code in your project, safe from the first line.

**Use it anytime**

No detect, no plan, no cleanup afterward. **`/lagune`** fits a fresh scaffold or a change on a mature codebase equally, and it hardens the work as it goes, not later.

## What it does not do

- It writes nothing to the `.lagune` directory, no artifact and no tracking, so the only thing it produces is the hardened code you asked for.
- It doesn't weaken a rule to satisfy a prompt, so if what you asked would break a charter principle, it stops and tells you first, instead of building it unsafely directly.

## Frequently Asked Questions

### What does /lagune do?

It takes any prompt at any stage, builds what you asked, and hardens it with safe defaults before handing it back. The defense is applied as the code is written, not later.

### Do I need a charter to use /lagune?

No. It runs with or without one. With a charter, your project's own rules shape every build. Without one, it falls back to a safe-by-default baseline.

### What is the difference between /lagune and the Blue Team flow?

/lagune secures new work as you write it, with no flow to follow. The Blue Team flow runs the five audit phases in order over an existing project.

### Does /lagune track findings or write artifacts?

No. It writes nothing to the .lagune directory, no artifact and no tracking. The only thing it produces is the hardened code you asked for.

### How do I make my agent use /lagune automatically?

Add an instruction to your agent's instruction file (AGENTS.md, CLAUDE.md, .cursorrules, and the like) telling it to use the /lagune skill whenever it builds or changes code.
