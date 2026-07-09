---
name: engineering
description: Authoritative engineering reference for Lagune, covering the toolchain, code conventions, type rules, the build and distribution path, and how the tracking hooks work. Use before writing or changing source under src/ or test/, or before the build.
user-invocable: true
metadata:
  internal: true
---

# Lagune engineering

This skill is the specialized, authoritative description of **how Lagune is built**: the toolchain, code conventions, type rules, the build and distribution path, and the implementation of the deterministic tracking hooks. Consult it before writing or changing source, before touching the build, and whenever you apply the code conventions.

The product mission and workflow philosophy live in [CLAUDE.md](../../../CLAUDE.md). The repository layout, the command/template split, the core/adapter boundary, what Lagune scaffolds, and the tracking-map model live in the [architecture](../architecture/SKILL.md) skill. This skill covers the _build_, not the _shape_.

## Toolchain

- **Runtimes:** Node.js (current LTS), Bun, and Deno. Lagune must run on all three, so keep code runtime-agnostic.
- **Language:** TypeScript, authored in `src/`.
- **Module system:** ES Modules only (ESM) throughout.
- **Package manager:** npm, matching the npx/npm distribution path.
- **Bundler:** esbuild (transpile and bundle only, it does not type-check).
- **Type-checking:** `tsc --noEmit`, run separately since esbuild skips type checks.
- **Tests:** Poku, run against each runtime: Node (`npm test`), Bun (`bun run test:bun`), and Deno (`deno task test:deno`).

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
- **Entry point:** the `package.json` `bin` field maps the `lagune` command to a file in `lib/` (with a `node` shebang), so `npx lagune ...` runs the bundle directly.
- **End-user install:** none. The bundle is self-contained, so running via `npx` needs no dependency install on the user's machine.

## The tracking hooks

The tracking-map model (item identity, where the map lives, its shape, who calls each hook, and the non-goals) lives in the [architecture](../architecture/SKILL.md) skill. This section covers how that machinery is implemented.

- **The shared core:** a pure tracking module under `src/core/` holds only what the hooks share: the map's I/O (load, serialize, write), the matcher and fold that drive registration, the removal that drives stand-down, and the payload guards (an `{ entries: [...] }` guard that requires `name` plus a `paths` string array, and a `{ names: [...] }` guard for untrack), each failing closed. The matcher finds the single map entry whose `name` equals the observed name, then overwrites `paths` in place when they changed (`moved`) or leaves it (`unchanged`), and a name with no match is `new`. Every hook consumes the same flat entry shape the file has. A separate core module holds the pure section-removal surgery, apart from the tracking module so repair can reuse it later.
- **Each hook owns its own logic.** What is specific to one hook lives in that hook's scope, not in the core. The **track** hook registers and updates and never orphans, treating an empty payload as a no-op. The **untrack** hook removes entries by name and, uniquely, reaches into the memory artifacts through the shared section-removal surgery to stand a finding down there too, and rejects an empty payload. The **repair** hook runs the same fold but additionally surfaces every map entry whose name appears in no reported entry as `unresolved` (`orphan`, or `renamed-candidate` when its paths match a reported entry under a new name), never removing it itself, and rejects an empty payload rather than accepting it. Each exposes a pure engine the tests exercise directly, plus the payload-driven function the CLI entry runs.
- **The hooks:** the deterministic engines ship as runnable **hooks** under `src/hooks/`, invoked as a node CLI from the project root with their input as a positional argument. Each entry holds no logic of its own: it imports its hook's pure function and ends with one call to the shared runner under `src/cli/`, which fires only when the file is the one being executed: importing an entry runs nothing, while running it reads the argument, prints the result, and exits non-zero on error. Passing the input as a process argument keeps it inert, so a value with quotes or backticks can never inject into the command. The build compiles each entry on its own into a self-contained artifact. A hook that grows past one file becomes a folder with an `index.ts` entry, and the build resolves the folder name as the artifact name. The init step copies the hooks into `.lagune/hooks/`, so the user never installs Lagune: init populates everything the workflow needs, the hooks included. Hooks are read from `lib/` (compiled JS), not `spec/`, since they ship as runnable code.
