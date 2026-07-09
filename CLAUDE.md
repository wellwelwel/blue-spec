# SDH (Security-Driven Hardening): Lagune

> This file orients any AI agent (and human) working in this repository. Read it fully before making changes. It describes **what Lagune is**, **who it is for**, **how it is built**, and **how to work in this codebase**. For the file/folder layout and concrete structure, invoke the internal `/architecture` skill, and for the toolchain, code conventions, and build path, the `/engineering` skill.

---

## 1. What this workspace is

This workspace is the **development environment for Lagune**.

Lagune is the practice of **Security-Driven Hardening (SDH)**: a structured, AI-driven security workflow. **Lagune turns a codebase into a more secure one**, driving the work from a spec the agent runs rather than from ad-hoc fixes.

The project stands in the tradition of **Blue Teams**: the defenders in security. Lagune is about defense, hardening, and verification, never offense.

### The problem it exists to solve

Software is increasingly shipped by people, and AI agents, who cannot reliably recognize an insecure pattern: a leaked secret, a missing authorization check, an injectable query. AI coding assistants made this acute by letting non-developers ship real software, but the gap is broader than any one audience. Most projects never get a security pass that is specific to what they actually do. The ecosystem becomes more fragile with every "it works, ship it" moment.

Lagune's mission is to **put a defensive, security-first workflow within reach of any user**, by making the AI agent do the heavy lifting: detecting what a system actually is, and guiding it toward the security practices that matter for that system, in a safe-by-default way.

### What Lagune actually ships

Lagune is **a collection of templates and agent commands**, not a heavy framework. Its value is the **workflow the AI agent runs**: detecting what the system actually does (login, uploads, payments, and so on), mapping the vulnerabilities that matter for that context, then proposing, applying, and validating the right fixes. The context detection is what makes the rest specific instead of generic.

Concretely, the user runs Lagune via the AI agent and the agent follows Lagune's templated, security-first process: scaffolded templates plus slash commands that an AI agent consumes, oriented toward defense rather than feature delivery.

### Flexible by design

Lagune is meant to flex, never to impose a rigid contract. Its principles, requirements, and recommendations are starting points the user can adapt, not a fixed contract. The charter can grow or shrink, a principle can be reworded or dropped, and every phase adapts to what the project actually is rather than forcing the project to fit a template. Safe-by-default never means take-it-or-leave-it.

---

## 2. Who it is for

Lagune is for **any user who wants a development flow with the security practices Lagune specializes in**. "User" means a person or a system, developer or not, and **all are served the same way**. There is no primary or secondary audience. The project must be **self-sufficient**, so the experience does not depend on the user already knowing what to ask for.

What makes that possible is the core idea: Lagune is **not a static catalog of generic recommendations**. It is a spec **intelligent enough to detect the context of the system** it is run against, for example whether the project has login, file uploads, payments, and so on. From that detection it **directs the user to the specific recommendations that matter for that context**.

This is why developers and non-developers are served equally: the intelligence lives in the spec, not in the user. Findings and recommendations should still be expressed in plain language, so they are actionable regardless of the user's technical depth.

---

## 3. Technology stack

- **Development language: TypeScript.** All source is authored in strict TypeScript.
- **Execution / distribution language: JavaScript.** End users never run TypeScript. The project is **built/compiled to JavaScript** and that build is what ships.
- **Distribution channel: npm, run via `npx`.** The intended end-user entry point is something like `npx lagune ...`. This is the friendliest path for the AI / vibe-coder audience and the native idiom of the JS/TS ecosystem.

---

## 4. The Lagune workflow (phase model)

Lagune runs a structured lifecycle with every phase framed around **defense**. This is the **5-phase Blue Team flow** and it is the product's spine:

| #   | Command           | Blue Team purpose                                                                                               |
| --- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | `/lagune.charter` | Establish the project's **security principles** (the rules)                                                     |
| 2   | `/lagune.detect`  | **Detect** what the system does (login, uploads, payments, etc.) and map its assets, dependencies, and surfaces |
| 3   | `/lagune.plan`    | **Match** the detected context to the risks and recommendations specific to it                                  |
| 4   | `/lagune.harden`  | **Apply** security fixes and controls                                                                           |
| 5   | `/lagune.verify`  | **Prove** that each applied control holds, and **stand down** the findings proven closed, out of the chain      |

The **`charter`** is the governing layer: a set of security-first principles that every later phase must respect (think of it as the "compile-time check" for the project's security posture).

There is no separate task-breakdown phase, because `plan` already produces concrete, prioritized fixes, so `harden` applies them directly. And `verify` is set apart to prove each applied control empirically, rather than folding testing into the hardening step. The Blue Team name for this is control verification. It also closes the cycle: a finding proven closed is stood down, removed from the whole chain with the user's confirmation, so it stops being reprocessed. When everything in scope is stood down, the cycle is at rest, reopened only when the code changes. Security is closable, so the flow has an end state, not an endless loop.

Alongside the five sequential phases there is one maintenance command, `/lagune.repair`. It is **not** a 6th phase in the linear flow. Its job is to keep the tracking coherent. Each detect finding is **one tracked item** that plan, harden, and verify carry forward, each acting on it and re-reporting it by name. That name, written identically as the section title in every artifact, is its identity throughout. The tracking map holds only tracking, never prose. The one volatile thing it stores is the file paths the item points at. Those paths live nowhere else, so a rename or a moved file can break the link only there, never in two diverging copies. When that happens, repair corrects the map (`.lagune/tracking.json`) so identity survives the rename. It corrects the paths on the one entry, leaves the prose untouched (the prose never held a path), and surfaces an item no artifact mentions anymore as an orphan for the user to drop. It reads the artifacts and the tracking map, reads the user's source only to learn a renamed file's new path, and never authors security content. The five phases consult the same deterministic tracking during their own reconciliation, so repair is rarely run by hand.

Lagune also carries **sub-skills**: focused, language-agnostic security knowledge modules that load **only on demand**, never by default. A sub-skill is not a command and is not invocable on its own. Detect is the phase that reaches for them: it lists the catalog from `.lagune/specializations.md` (an internal, gitignored listing that prints each sub-skill's name and the tags that say what it covers, rebuilt from the catalog to merge the built-ins with any the user added), matches them against the code, and records which it used, so the later phases reuse that list rather than re-listing. Each reads and follows the matching `.lagune/skills/<name>.md` directly. A user can also import one straight into any prompt with `@.lagune/skills/<name>.md`. The collection grows by adding one knowledge file plus one catalog row, never a new command, and `/lagune.specialize` is how the user grows it on their own: it distills a security source or topic they give it into a new sub-skill, written into the project's own catalog so the phases then load it like any built-in. This is the same context-aware principle as the phases: the relevant knowledge is pulled in for what the project actually is, instead of every check running by default.

> Names above (`/lagune.*`) are the current convention. They can still be refined, so treat them as the working shape, not a frozen contract.

---

## 5. How to work in this codebase (working principles)

These are binding instructions for any agent or contributor working here.

1. **Safe-by-default, in plain language, for everyone equally.** Every default, message, and fix must be safe out of the box and intelligible to any user, developer or not. No user tier is privileged over another.
2. **Context-aware over generic.** Every phase must start from the context detected in `detect` (login, uploads, payments, and so on) and act on what the system actually does. Prefer recommendations specific to that context over generic checklists. The intelligence lives in the spec, not in the user.
3. **Flexible over rigid.** Lagune flexes to the project and the user. Principles, requirements, and recommendations are starting points, not a fixed contract. Let the user reword, drop, add, or scope anything down. Every phase adapts to what the project actually is. Flexibility never weakens the safe-by-default baseline, it only lets the user shape how it is applied.
4. **Reconcile, never append-only.** Lagune's artifacts are living documents, not logs. When a phase re-runs and its artifact already exists, reconcile it against the current truth: re-check each existing entry, keep what still holds, rewrite what changed, and remove what no longer applies (for example, a finding the code shows is now resolved). Write genuinely new content only for what is actually new. The past does not matter for its own sake. Never let an artifact grow by accumulation alone. Closure is this same reconcile reaching its conclusion: when `verify` proves a risk closed, it stands the finding down across the whole chain, with the user's confirmation, instead of leaving a later phase to drop it. This is why `verify` is the one phase that writes to the other phases' artifacts.
5. **Defense only.** Lagune audits, hardens, and verifies. It never produces offensive tooling, exploits for malicious use, or detection-evasion for harm. Dual-use security content is acceptable only in a clearly defensive, authorized framing.
6. **TypeScript in, JavaScript out.** Author in strict TypeScript and ship compiled JavaScript. The end-user runtime is JavaScript via `npx`.
7. **Spec-first, agent-driven, framed for security.** Build the workflow from a proven structure: templates, commands, a governing charter, and an agent that runs the phases. Reimplement that structure in our stack with a defensive purpose.
8. **Structure and engineering live elsewhere.** Concrete repo structure and file layout belong in the internal `/architecture` skill, and the toolchain, code conventions, type rules, and build path belong in the `/engineering` skill. Both load automatically when an agent touches the relevant code. Keep this file focused on the _what_ and _why_, and keep structural and implementation decisions in those skills.
9. **Never kill processes you did not start.** Only stop the processes you launched yourself (for example a headless browser you spawned for verification). Before starting a server, check whether the port is already serving what you need (for example the dashboard on its dev port) and reuse it instead of launching another.

---

## 6. Naming, language, and writing conventions

- **Project name:** Lagune. Working command prefix: `lagune` / `/lagune.*`.
- **All project content is written in English** (docs, code, comments, command text, user messages), regardless of the language used in chat.
- **Prose style:** avoid em dashes where not grammatically necessary (prefer commas, parentheses, or colons) and avoid semicolons (prefer two sentences or a comma).
