# Security Slash Commands for AI Agents

> The slash commands your AI agent unlocks with Lagune: audit an existing project or secure new work as you build, all governed by the charter.

Canonical: https://lagune.ai/docs/get-started/commands
Last updated: 2026-07-24

Once **Lagune** is set up in your project, your **AI** agent unlocks a set of slash commands. There are two ways to use them, and both are governed by the **charter**: secure new work as you build it, or run the full audit over a project.

**⌨️ Build / Development**

You don't need to finish your work before securing it. Use [**`/lagune`**](https://lagune.ai/docs/commands/lagune) for the work you are writing **right now**:

| Command                                       | What it does for you                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| [**/lagune.charter**](https://lagune.ai/docs/commands/charter) | Sets your project's security rules, the foundation `/lagune` builds against |
| [**/lagune**](https://lagune.ai/docs/commands/lagune)          | Builds what you ask and hardens it as it is written, guided by the charter  |

**Use it anytime**

[**`/lagune`**](https://lagune.ai/docs/commands/lagune) honors your charter rules whenever it runs. It takes any prompt, builds what you asked, and hardens it with safe defaults as it goes, not later.

---

#### Special commands

| Command                                             | What it does                                                                            |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [**/lagune.specialize**](https://lagune.ai/docs/commands/specialize) | Specializes **Lagune** in a new security _sub_-skill from articles, exploits, or topics |

**🔬 Audit: Blue Team Flow**

The full **Blue Team flow**: read what a project does, map its risks, and close them. Each command builds on the previous, so following the list top to bottom is all it takes:

| #   | Command                                       | What it does for you                                                           |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | [**/lagune.charter**](https://lagune.ai/docs/commands/charter) | Sets your project's security rules, proposed for you or shaped by what you say |
| 2   | [**/lagune.detect**](https://lagune.ai/docs/commands/detect)   | Reads your code and maps what your system does and where the risks are         |
| 3   | [**/lagune.plan**](https://lagune.ai/docs/commands/plan)       | Turns what detect found into a defense plan, with a fix for each finding       |
| 4   | [**/lagune.harden**](https://lagune.ai/docs/commands/harden)   | Applies the plan's fixes to your code, safely and one at a time                |
| 5   | [**/lagune.verify**](https://lagune.ai/docs/commands/verify)   | Proves each applied fix holds and closes out the ones that do                  |

---

#### Special commands

| Command                                             | What it does                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [**/lagune.specialize**](https://lagune.ai/docs/commands/specialize) | Specializes **Lagune** in a new security _sub_-skill from articles, exploits, or topics    |
| [**/lagune.prove**](https://lagune.ai/docs/commands/prove)           | Turns each detected finding into a runnable, defense-only proof for responsible disclosure |

---

#### Internal commands

| Command                                     | What it does                           |
| ------------------------------------------- | -------------------------------------- |
| [**/lagune.repair**](https://lagune.ai/docs/commands/repair) | Repairs **Lagune**'s internal tracking |

**Tip**

Security is not a cost, it is an investment: what you put in upfront, you save many times over in the incidents you never have 🙋🏻‍♂️

## Frequently Asked Questions

### What slash commands does Lagune add?

/lagune to harden work as you build it, and the five-phase Blue Team audit flow: /lagune.charter, /lagune.detect, /lagune.plan, /lagune.harden, /lagune.verify. Plus /lagune.specialize and /lagune.prove.

### What is the Lagune Blue Team flow?

A five-phase audit: charter (set rules), detect (map risks), plan (score and plan fixes), harden (apply fixes), verify (prove they hold and close them).

### What is the difference between /lagune and the audit flow?

/lagune secures new work as you write it, with no flow to follow. The audit flow runs the five phases in order over an existing project.
