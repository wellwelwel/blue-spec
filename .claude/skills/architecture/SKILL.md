---
name: architecture
description: Authoritative architecture reference for the Blue Spec codebase. Use BEFORE writing or changing any source under src/, spec/, lib/, or test/, before adding an agent adapter, before touching the build path, and whenever a decision depends on repo layout, code conventions, the command/template split, the agent-agnostic core vs. adapter boundary, or what Blue Spec scaffolds into a target project. Covers the toolchain, directory layout, type rules, and the command formats each supported agent expects.
user-invocable: true
metadata:
  internal: true
---

# Blue Spec architecture

This skill is the specialized, authoritative description of **how Blue Spec is structured**: repository layout, build and distribution, how commands and templates are organized, the core/adapter boundary, and what Blue Spec scaffolds into a target project. Consult it before changing source, before adding an agent, and whenever a decision depends on the shape of the codebase.

The product mission and workflow philosophy live in [CLAUDE.md](../../../CLAUDE.md). This skill covers the _how_, not the _why_.

## Repository

### Toolchain

- **Runtimes:** Node.js (current LTS), Bun, and Deno. Blue Spec must run on all three, so keep code runtime-agnostic.
- **Language:** TypeScript, authored in `src/`.
- **Module system:** ES Modules only (ESM) throughout.
- **Package manager:** npm, matching the npx/npm distribution path.
- **Bundler:** esbuild (transpile and bundle only, it does not type-check).
- **Type-checking:** `tsc --noEmit`, run separately since esbuild skips type checks.
- **Tests:** Poku, run against each runtime: Node (`npm test`), Bun (`bun run test:bun`), and Deno (`deno task test:deno`).

### Layout

Top-level directories. Their internal structure is defined in the sections below.

| Directory         | Purpose                                                                             |
| ----------------- | ----------------------------------------------------------------------------------- |
| `src/`            | TypeScript source. Everything authored by hand lives here.                          |
| `src/types/`      | The single home for every type declaration. No type is declared elsewhere.          |
| `lib/`            | Compiled JavaScript build output. Generated, not edited. This is what ships.        |
| `spec/`           | The Blue Spec core: the commands, templates, and sub-skills that ship.              |
| `spec/commands/`  | The `/bluespec.*` command definitions an agent reads to run each phase.             |
| `spec/templates/` | The files a command fills in (the security artifacts produced per phase).           |
| `spec/skills/`    | Non-invocable sub-skills: on-demand knowledge the `/bluespec.skills` command loads. |
| `test/`           | Poku test suites, run against Node, Bun, and Deno.                                  |

## Code conventions

### General

- **Arrow functions over `function`.** Declare with `const`. Use a `function` only when the `this` context strictly requires it.
- **Named exports only.** Never use `default export`.
- **Practice early return.** Handle edge cases up front and exit, rather than nesting the main logic.
- **No abbreviations.** Names are clear and explicit (for example `left`/`right`, not `a`/`b`, and `index`, not `i`).
- **Avoid nested `if-else-else-if`.** Favor clean, well-decoupled approaches when branching grows.
- **No duplicated logic or types.** Reuse existing logic and types whenever it is viable.
- **No side effects inside loops or iterations.** Keep iteration pure.
- **Prefer native capabilities over external dependencies** whenever possible.
- **Always prefix native imports with `node:`** (for example `node:path`, `node:fs`).
- **Prefer the async Node.js APIs when viable** (for example `node:fs/promises`).

### Types

- **All type declarations live in `src/types/`.** No `type` or `interface` is declared anywhere else in the codebase.
- **Prefer `type`.** Use `interface` only when a class is meant to implement it.
- **`any` and `as unknown as` are forbidden.** No exceptions.
- **Reach for `as` last.** Prefer a direct type annotation or `satisfies`. A plain `as` cast is allowed, but only when neither of those fits.

## Build & ship

- **Build tool:** esbuild bundles `src/` into self-contained JavaScript in `lib/`, so the published package carries no runtime `node_modules` for the end user.
- **Output:** `lib/` holds the shipped JavaScript. It is generated, never edited by hand.
- **Entry point:** the `package.json` `bin` field maps the `blue-spec` command to a file in `lib/` (with a `node` shebang), so `npx blue-spec ...` runs the bundle directly.
- **End-user install:** none. The bundle is self-contained, so running via `npx` needs no dependency install on the user's machine.

## Command & template anatomy

A phase of the workflow is a pair: a **command** and one or more **templates**.

- **A command instructs.** It is the agent's reading: how to think about the phase, what to look for, what questions to resolve. Commands live in `spec/commands/`, as markdown (`.md`) files with frontmatter, the format Claude Code consumes natively.
- **A template structures.** It is the mould for the phase's output: the security artifact the command produces, with its sections and the fields to fill in. Templates live in `spec/templates/`.

A phase command points to its template. The command carries the reasoning, the template carries the shape of the result. Splitting them keeps the "how to think" reusable and the "what to produce" consistent.

A command that produces no artifact has no template, and the type layer encodes which commands those are: `repair` and `skills`, plus `list`, a read-only command that prints the tracked findings by name through the `list` hook and writes nothing. `specialize` is the exception that is not a phase yet still pairs with a template (`specialize-template.md`): its artifact is a sub-skill file under `.bluespec/skills/`, not a `memory/` phase artifact.

### Sub-skills

`spec/skills/` holds the **built-in sub-skills**: agent-agnostic knowledge modules that load only on demand. Nothing opens them directly. The `/bluespec.skills` command is the single door, resolving a selector to a sub-skill file, so a phase needing the knowledge runs `/bluespec.skills <selector>`. Adding a built-in is one `.md` plus one row in the baked catalog (`src/hooks/skills/catalog.ts`), no new command. A user grows the same set at runtime with `/bluespec.specialize`, which writes a sub-skill into `.bluespec/skills/` and its row into `.bluespec/skills.json`. The `skills` hook reads that file and merges it over the baked catalog, the user's entry winning a name collision.

## Agent-agnostic core vs. agent adapters

The codebase splits into two layers, and the split is what lets new agents be added later without rewriting the workflow.

- **The core is agent-agnostic.** Templates, the per-phase content, and the context-detection logic know nothing about which agent runs them. This is where the security value lives, and it is written once.
- **An adapter is thin.** Its only job is to translate the core's commands into the format and location a given agent expects. It carries no security logic of its own.

Adapters are **data, not code**. Each supported agent is a single entry in the agent registry under `src/providers/`, declaring its key, display name, command format, and target directory. A factory turns each entry into a provider, and a format dispatcher under `src/transform/` renders the same core command into that agent's packaging. Adding an agent is adding a row, not writing a module. The registry is the single source of truth for which agents are supported.

The command formats are:

- **Skill** (`<dir>/bluespec.<phase>/SKILL.md`): a directory per command with `name` / `description` / `argument-hint` / `user-invocable` frontmatter. Used by Claude Code, Codex CLI, Antigravity, Cursor, Devin, Kimi, Lingma, RovoDev, Trae, and Mistral Vibe. Skill directories use each agent's current, project-scoped location (for example `.claude/skills`, `.codex/skills`, `.agent/skills`, `.cursor/skills`).
- **Copilot prompt file** (`.github/prompts/bluespec.<phase>.prompt.md`): GitHub Copilot's prompt-file format, invoked as `/bluespec.<phase>`.
- **Markdown command** (`<dir>/bluespec.<phase>.md`): a single markdown file whose name becomes the command. Used by Amazon Q Developer, Amp, Auggie, IBM Bob, Cline, CodeBuddy, Continue, CoStrict, Crush, Factory Droid, iFlow, Junie, Kilo Code, Kiro CLI, opencode, Pi, Qoder, Qwen, Roo, SHAI, and Windsurf.
- **Forge** (`.forge/commands/bluespec.<phase>.md`): a markdown command that swaps `$ARGUMENTS` for Forge's `{{parameters}}` placeholder.
- **TOML** (`<dir>/bluespec.<phase>.toml`): `description` plus a multi-line `prompt`, with `$ARGUMENTS` rendered as `{{args}}`. Used by Gemini CLI and Tabnine CLI.
- **Goose recipe** (`.goose/recipes/bluespec.<phase>.yaml`): a YAML recipe with the required `version` / `title` / `description` / `instructions` / `prompt` fields, with `$ARGUMENTS` rendered as `{{ args }}`.

A future agent is one more row, leaving the core untouched. Keep adapters thin and the core neutral. Any logic that an adapter would duplicate belongs in the core instead.

## What Blue Spec scaffolds into a target project

Running Blue Spec in a user's project creates two things:

- **`.bluespec/`** holds Blue Spec's state in that project: the filled-in charter and the artifacts each phase produces (the detect map, the defense plan, and so on), plus `hooks/` (the compiled helper scripts the agent runs, see The tracking map) and `skills/` (the non-invocable sub-skills `/bluespec.skills` loads on demand, both the built-ins copied at init and any the user adds with `/bluespec.specialize`). Init also seeds `skills.json`, the runtime catalog of user sub-skills (empty until `specialize` writes to it), a sibling of `tracking.json`. It is committed alongside the user's code, so the security work is versioned and reviewable like any other part of the project.
- **Agent commands** are written by the adapter into the agent's own location, in that agent's native format (a skill directory, a prompt file, a markdown command, a TOML command, or a Goose recipe, per the chosen agent's registry entry). For example, Claude Code reads them from `.claude/skills/`, GitHub Copilot from `.github/prompts/`, and opencode from `.opencode/commands/`. All hold the `/bluespec.*` commands the user invokes.

The split mirrors the repository's own core/adapter boundary: `.bluespec/` is the agent-agnostic state, and the agent's own directory is where the adapter places what that specific agent reads.

## The tracking map

Each detect finding is one tracked **item**. The later phases carry that same item forward: it is a single entry that plan, harden, and verify re-report by name as they act on it, never a separate entry per phase. Its identity is its `name` (the finding's name, written identically as the section title in `detect.md`, `plan.md`, `harden.md`, and `verify.md`), and the map keys on that name and nothing else. The prose artifacts carry only that shared title and never a path. The file paths are the one volatile thing, and they live only in the tracking map. A rename or a moved path is corrected in one place, and every memory stays valid. The **tracking map** is tracking only: no prose, no note, no separate id, no phase.

- **Where it lives:** `.bluespec/tracking.json`, a sibling of `manifest.json` and `memory/`. It is internal state, committed but never hand-edited and never shown to the user.
- **Shape:** `{ name: 'blue-spec', entries: [{ name, paths }] }`, where `name` is the identity and `paths` is `string[]` (charter has no items). There is no cross-entry link: the conveyor lives in the prose (which artifact carries the item's section), not in the map. Types live in the types module under `src/types/`.
- **Two flow acts, plus repair apart:** the map is maintained by two acts the phases perform in the normal flow, **track** (registration) and **untrack** (stand-down), and by **repair** (realignment), a maintenance act that runs only via `/bluespec.repair`, never as part of a phase. Track records each finding a phase reports and re-reports an existing item by name as a later phase writes, following a renamed path and never removing. By convention detect is where a finding is born and plan, harden, and verify re-report it, but the hook keys on the name alone and does not enforce the order. Untrack drops an item from the map: verify calls it at closure to stand a `✅ Risk closed` finding down, after removing its section from the prose artifacts. Repair realigns the whole map against the artifacts and the code, and is the only act that surfaces what is gone. Without tracking there is nothing to repair, so track is what populates the map along the normal flow.
- **The shared core:** a pure tracking module under `src/core/` holds only what the hooks share: the map's I/O (load, serialize, write), the matcher and fold that drive registration, the removal that drives stand-down, and the payload guards (an `{ entries: [...] }` guard that requires `name` plus a `paths` string array, and a `{ names: [...] }` guard for untrack), each failing closed. The matcher finds the single map entry whose `name` equals the observed name, then overwrites `paths` in place when they changed (`moved`) or leaves it (`unchanged`), and a name with no match is `new`. Every hook consumes the same flat entry shape the file has.
- **Each hook owns its own logic.** What is specific to one hook lives in that hook's scope, not in the core. The **track** hook registers and updates and never orphans, treating an empty payload as a no-op. The **untrack** hook removes entries by name and rejects an empty payload, never touching the prose. The **repair** hook runs the same fold but additionally surfaces every map entry whose name appears in no reported entry as `unresolved` (`orphan`, or `renamed-candidate` when its paths match a reported entry under a new name), never removing it itself, and rejects an empty payload rather than accepting it. Each exposes a pure engine the tests exercise directly, plus the payload-driven function the CLI entry runs.
- **The hooks:** the deterministic engines ship as runnable **hooks** under `src/hooks/`, invoked as a node CLI from the project root with their input as a positional argument. Each entry holds no logic of its own: it imports its hook's pure function and ends with one call to the shared runner under `src/cli/`, which fires only when the file is the one being executed: importing an entry runs nothing, while running it reads the argument, prints the result, and exits non-zero on error. Passing the input as a process argument keeps it inert, so a value with quotes or backticks can never inject into the command. The build compiles each entry on its own into a self-contained artifact. A hook that grows past one file becomes a folder with an `index.ts` entry, and the build resolves the folder name as the artifact name. The init step copies the hooks into `.bluespec/hooks/`, so the user never installs Blue Spec: init populates everything the workflow needs, the hooks included. Hooks are read from `lib/` (compiled JS), not `spec/`, since they ship as runnable code.
- **Who calls them:** the four phases call the **track** hook at the end of their Step 7. Detect registers the findings it wrote, and plan, harden, and verify re-report each item by the finding's name (additive, never removing). Only `/bluespec.verify` calls the **untrack** hook, at closure (its Step 8), to stand a `✅ Risk closed` finding down after it has removed the finding's section from the four prose artifacts. This is why verify alone writes across the other phases' artifacts. Only the `/bluespec.repair` command calls the **repair** hook, to realign the whole map when something diverged. The phases never repair the tracking themselves: when one notices the tracking is inconsistent (a tracked path that no longer exists), it runs `/bluespec.repair` and continues. There is no user-facing track or untrack command, both are internal plumbing.
- **Non-goals:** the hooks are mechanical and read nothing but the snippets they are handed. The `/bluespec.repair` command reads the user's source only to learn a renamed file's new path, never to author or judge security. No hook edits the `.bluespec/memory/*.md` prose artifacts or injects IDs or anchors into them. The artifacts stay pure prose, and the one call no hook makes alone (fixed vs renamed) is returned for the agent or user to decide, never guessed.
