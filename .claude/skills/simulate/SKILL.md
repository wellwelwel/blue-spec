---
name: simulate
description: How to simulate a Lagune command end to end so the user sees both the process and the results in chat. Use when the user asks to simulate, demo, preview, run, or see in action any lagune command. Read this before attempting any such simulation.
user-invocable: true
metadata:
  internal: true
---

# Simulating a Lagune command

This skill exists because simulating a command is deceptively easy to get wrong in a way that wastes the user's time and trust. Hard sessions produced four non-negotiable rules and a method. Follow them exactly.

Use this skill whenever the user asks to "simulate", "demo", "show in practice", "run", or "see in action" any `/lagune.*` command (`charter`, `detect`, `plan`, `harden`, `verify`), or to preview how a command behaves before shipping it.

## Before you start (mandatory)

Do not begin a simulation, build a scenario, or copy a fixture until both of these are settled, in this order:

1. **The user must tell you which Lagune command to simulate.** This is required, never assume or pick one. If the user has not named a command (`charter`, `detect`, `plan`, `harden`, or `verify`), ask which one before doing anything else. If they named more than one, confirm the order you will run them in.
2. **Then suggest the fixture, enumerated, and let the user choose.** Once the command is known, list the available fixtures (from `.claude/skills/simulate/fixtures/`) as a numbered list, each with a one-line description of its scenario, and ask the user to pick one by number. Do not silently default to a fixture. If only one fixture exists, still present it and confirm before using it. If none fits the command, say so and offer to add a new fixture (see the fixtures section).

Only after the command is named and the fixture is chosen do you proceed to the rules and method below.

## Why this skill exists (read this first)

A Lagune command is **not a standalone program**. It is a file of instructions (`spec/commands/lagune.<phase>.md`, scaffolded as a skill the agent reads) that tells an AI agent how to do a phase of security work. "Running the command" means **an agent following those instructions**. There is no binary that emits a deterministic result independent of the agent. So a "simulation" is the agent executing the command's steps for real, against a real scenario, while showing its work.

The failure mode to avoid: narrating what you _imagine_ the command would output, formatting it to look like a terminal, and presenting it as if it ran. That is theatre. The user cannot tell invented output from real output, and they will (rightly) call it a farce. Everything below is designed to make the simulation **real and verifiable by the user**, not a performance.

## The four hard rules

### Rule 1: Run the scenario under `./temp`

Build everything the simulation touches (the fixture, the `.lagune/memory/` artifacts the phases produce, any inputs) inside `./temp` at the repo root, never in the system `/tmp`.

- `/tmp` is invisible to the user: they cannot open those files in their editor, so everything you do there becomes "trust me". `./temp` is in their workspace, openable, inspectable.
- `./temp` is git-ignored, so the simulation never pollutes commits.
- Clean up `./temp` when the user is done, or leave it for them to inspect, but ask first.

#### The fixtures: start every simulation from one

Neutral sample projects ship next to this skill, each in its own directory under `.claude/skills/simulate/fixtures/<name>/`. Pick the fixture whose scenario fits what the command needs, or add a new one (see below). Every fixture is a small, real project that deliberately contains both robust and fragile code, in **neutral pairs** so the command has to analyze the code, not read a label.

Available fixtures:

- **`image-upload-service`**: a small ESM HTTP service that accepts image uploads, imports images from a remote URL, and serves them back.
- **`template-toolkit`**: a publishable ESM npm package (a library plus a `tmpl` CLI) for rendering templates and parsing text.

**Always begin a simulation by copying one fixture raw into `./temp`.** If `./temp` already exists and is not empty, clear it first, so each run starts clean (replace `<name>` with the fixture you chose):

```bash
rm -rf ./temp && mkdir -p ./temp
cp -R .claude/skills/simulate/fixtures/<name>/. ./temp/
```

Then build the chain on top in `./temp` by running the upstream phases for real (per Rule 4), so the `.lagune/memory/*.md` artifact the command reads is produced by its own phase, not hand-written. Run the command's steps against `./temp`, following its spec to the letter (per Rule 3), and show every step's output per Rule 2.

To add a fixture, create `.claude/skills/simulate/fixtures/<new-name>/` as a small, real project with its own `package.json`, keep robust and fragile code in neutral pairs, add no revealing comments or names, and list it above. Add one when a command needs material the current fixtures do not cover (a different language or stack, secrets handling, auth, a database, and so on).

### Rule 2: Expose prompts and responses as fenced code blocks IN the chat message

This is the rule that took longest to learn. When you run a tool (`Bash`, `Read`), the user's interface shows a **truncated preview** of that tool's `IN` and `OUT`. You do not control how much is shown, and it is usually cut off. If the evidence that backs a claim lives only inside a tool call's output, **the user does not see it**, and any sentence you write describing it reads as invention.

Therefore:

- After running a tool, **copy the relevant raw output into a fenced code block** (triple backticks) in your normal chat message. The fenced block renders fully and identically in every interface. This is the "yellow letters" the user means: a markdown code block.
- The command's prompt and interaction (what `/lagune.<phase>` shows as it runs: the step by step, the scope decision, the verdicts) also goes in a fenced code block, styled like a transcript.
- Never write "the output above shows X" pointing at a tool call. Point at the fenced block you pasted, which the user can read in full.
- When a number or line in your transcript came from a real run, it must match the raw output you pasted. If you write a transcript line that is not backed by pasted raw output, you are inventing, so stop.

A reliable pattern: run the command, redirect raw output to a file under `./temp` (for example `./temp/run.log`), then `Read` that file (the Read result is shown to you in full) and paste its contents into a fenced block. The user can also open `./temp/run.log` to verify.

**Show as you go, never in a batch at the end.** The trigger is per step: the moment a step produces something the user should see (an input it read, its transcript, the artifact it wrote), paste it into a fenced block in the same message, before the next step. If you are about to start the next phase or fix and the previous step's output is not on screen yet, stop and paste it first. If the user has to remind you to show a command's output, the rule already failed.

### Rule 3: You are the command, so follow its spec to the letter

"Running the command" is you executing `spec/commands/lagune.<phase>.md` step by step, not doing the phase your own way and calling it the command.

- **Open that spec first and treat it as the single source of truth.** Follow its steps in order. Do not run the phase from memory or from this skill's summary.
- **Perform every confirmation stop the spec gates, for real.** `harden` must confirm before it edits any code, a full `detect` scan must be confirmed because it is token-heavy. Present what the spec says to present, in a transcript block, and wait. Never edit code or run a gated step without the confirmation first.
- **Decide scope, verdicts, fixes, priorities, and findings the way the spec's steps decide them**, against the real scenario. If you cannot point to the spec step that justifies a line of output, you are acting as yourself, so stop and follow the spec.

### Rule 4: Each phase's input must come from running the previous phase, not from you

The chain is `charter → detect → plan → harden → verify`, each phase reading what the one before it wrote. Hand-authoring a downstream artifact with the answers you expect (a `harden.md` that records exactly what you want `verify` to confirm or catch) is the failure: the downstream phase is then tested against your prediction, not reality, so it misses whatever you missed.

- **Produce every upstream artifact by running its phase**, under its own spec, shown per Rule 2. To demo `verify`, run `detect` (reads the code), then `plan` (reads `detect.md`), then `harden` (reads `plan.md`, edits the code). Even when the user starts mid-chain, build the missing artifacts this way, in order.
- **Let the artifact say what the run actually produced**, gaps included: a `Partial`, a `Blocked`, a finding you did not foresee. A suspiciously clean artifact is the tell this rule was broken.
- A deliberately divergent scenario is fine (harden applies everything, then the code is reverted so `verify` must catch the drift), but introduce the divergence visibly (revert in a shown tool call, keep the real artifacts), never by hand-writing a record the run never produced.

## The method, step by step

Each phase reads the one before it and writes what the table shows. Know this chain, and do not break it:

| Phase     | Reads                                                                                  | Writes                                       |
| --------- | -------------------------------------------------------------------------------------- | -------------------------------------------- |
| `charter` | the project context                                                                    | `.lagune/memory/charter.md`                  |
| `detect`  | the **code**                                                                           | `.lagune/memory/detect.md`                   |
| `plan`    | **only `detect.md`**, never the code                                                   | `.lagune/memory/plan.md`                     |
| `harden`  | **only `plan.md`** plus the charter, and **edits the user's code**                     | `.lagune/memory/harden.md`                   |
| `verify`  | `harden.md` **and the code**, confronting record against reality, **changing no code** | the `Verdict`/`Reason` on `harden.md` blocks |

Then, for the command you are simulating:

1. Copy the fixture raw into `./temp` (Rule 1).
2. Build the chain by running each upstream phase, in order, against `./temp` (Rule 4).
3. Run the target phase under its `spec/commands/lagune.<phase>.md`, to the letter (Rule 3).
4. Show every input, transcript, and artifact in a fenced block as you go (Rule 2). Write each output artifact as a real file, then `Read` and show it.

## Honesty checks before you present anything

- Did this actually run, or am I typing what I think would happen?
- Is every transcript line backed by raw output I pasted, or a `./temp` file the user can open, rather than a truncated tool call? (Rule 2)
- Have I already pasted the output of every step so far, so the user never has to ask? (Rule 2)
- Did I follow each phase's spec, confirmation stops included, instead of acting as myself? (Rule 3)
- Did each upstream artifact come from running its phase, not from me hand-writing the result I wanted? (Rule 4)
- Is the scenario under `./temp`, not hidden in `/tmp`? (Rule 1)

If any answer is no, fix it before sending. The user would rather see real, modest output than a polished invention.
