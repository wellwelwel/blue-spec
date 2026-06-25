---
description: Detect what the system actually does by reading the code, and map the security-relevant findings (login, uploads, payments, data exposure, and so on) with the evidence later phases need. Scans the whole project, specific files, or a focused scope, depending on the input.
---

## User Input

```text
$ARGUMENTS
```

The User Input above decides how this command runs. Read it before proceeding.

## Outline

You are producing a **detect map** at `.bluespec/memory/detect.md`: a record of what the system actually does that carries security weight, based on reading the code. This is detection, not invention. Record only what the code supports, with the evidence (files, routes) that later phases need to act on. Each finding is also explained in plain language with its risk, so any reader understands it.

This phase works the same way whether the project is brand new or already exists. You map whatever code is present, even if there is very little.

### Step 1: Decide the scope from the input

The User Input above selects one of three modes:

- **No input** (the User Input is empty): the user wants a general detect. A full scan can read a large part of the project and consume a lot of tokens, so **do not scan yet**. First tell the user you are about to scan the whole project, note that it can be token-heavy, and ask them to confirm before you proceed. If they decline, ask what files, directories, or focus to use instead. Only run the full scan after they confirm.
- **Files or directories given** (the input names one or more paths in the project): focus **only** on those paths. Do not scan the rest of the project. Map what those paths show.
- **A focus described** (the input describes what to look for, for example "make sure there is no sensitive data exposure"): scan the workspace **for that specific concern**. The map covers what the user asked about, not a general inventory.

If the input is ambiguous between a path and a focus, prefer the most literal reading (an existing path is a path), and state which mode you chose before continuing.

### Step 2: Load context

- Load the detect map at `.bluespec/memory/detect.md`.
  - If it does not exist, initialize it from the template at `templates/detect-template.md` first, and identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
  - If it already exists, read the findings already in it. You will reconcile them in Step 3 before adding anything new. Each finding's identity is its name (the section title), which the later phases reuse verbatim. The prose carries the wording, never the file path: the path lives only in the tracking map, where reconcile keeps it current.
- Load the charter at `.bluespec/memory/charter.md` for context only, **if it exists**. Do not force the findings to fit the charter. Matching risks against the charter's rules is the plan phase, not this one. This phase stays a neutral detection of what the system does.

### Step 3: Reconcile the existing map

This map is reconciled, never append-only. If the map was empty or freshly initialized, skip this step. Otherwise, before detecting anything new, re-check each existing finding against the current code:

- **Still holds:** the code still supports it. Keep it, and update its wording or evidence if the details changed.
- **Resolved or gone:** the code shows it is fixed or no longer applies. **Remove it** from the map. Do not keep resolved findings for history. The map reflects the present, not the past.
- Only re-check findings that fall within the current scope. A finding outside the scope you are running stays untouched.

A finding that `verify` already proved closed was stood down out of the whole chain, so it is simply absent here. That absence is expected, not a broken chain, and is no reason to run repair.

If reconciling reveals the chain is inconsistent (for example the tracking map points a finding at a file that was renamed or moved, so the path on record no longer exists), run `/bluespec.repair` and then continue. Repair fixes Blue Spec's internal tracking across every phase at once, so the chain stays coherent. Do not try to repair the tracking yourself: this phase reconciles its own map in prose, repair owns the tracking.

### Step 4: Read the code in scope and detect

Read the code within the chosen scope and detect the things that carry security weight. What carries weight depends on what the project is, so detect from the project at hand, not from a fixed list. As a starting point, the things to look for include untrusted input and how it is validated, secrets and configuration, data storage and any exposure of sensitive data, authentication and access control where the project has users, the boundaries where the project takes input from the outside (a web request, a command-line argument, a file it reads, a public API it exports, an external or third-party call), and any place it runs commands, queries, or deserializes data. A web service, a library, a CLI, a script, and a desktop or mobile app each weight these differently. Detect from evidence in the code, not from assumption. If the scope is a described focus, concentrate on that concern.

### Step 5: Consult the sub-skills

Sub-skills are focused, language-agnostic security knowledge modules that load only on demand. This step is the door to them, and it has a fixed mechanism. Do not improvise an equivalent.

1. **List the catalog by running the hook**, from the project root:

   ```bash
   node ./.bluespec/hooks/skills.mjs
   ```

   This is the only authoritative source. It merges the built-in sub-skills with any the user registered in `.bluespec/skills.json`, and prints each one as `name: tags`. The **tags are the matching signal, and they exist nowhere else**.

2. **Apply every entry whose tags match the scope you just read.** To apply one, read `.bluespec/skills/<name>.md` directly and follow it, scoped to the paths in question. The knowledge lives in that file: do what it says, do not improvise beyond it, and do not edit the user's code. The only judgment here is which listed sub-skills match the scope, not whether to consult at all. A sub-skill whose context is absent is simply skipped, and finding none applicable is a valid outcome.

Anything a sub-skill surfaces is recorded as a finding through the steps below, like any other.

Report only the sub-skills you applied and what each surfaced, never the ones that did not match: an absent context is skipped in silence, not announced. If none applied, say so in one line.

### Step 6: Fill the template

- Replace every placeholder with concrete text. Leave no bracket tokens behind.
- Set `Scope` to reflect the mode you ran: a full scan, the specific paths, or the described focus.
- **Merge, do not overwrite.** The map now holds the reconciled findings from Step 3 plus what you detected in Step 4. Add a new finding block only for something genuinely new, not already represented. Do not duplicate a finding that is already there under a different wording.
- Write one finding per detected item. Each finding MUST carry three parts:
  - **What it is:** a plain-language description any reader understands.
  - **Why it matters:** the risk it carries, in plain language. Explain the risk, not just the fact.
  - **Evidence:** a short, plain-language note of where the finding lives (the function or route, what the code does there) so later phases know what to act on. Do not write the file path here. The path goes to the tracking map in Step 8, where reconcile keeps it current through a rename, so the prose never carries a path that can go stale.
- The template ships with three starter findings. This is a starting point, not a limit. Add or remove findings to match what the code actually shows.
- Fill **Applied sub-skills** from the sub-skills you applied in Step 5, naming under each the finding(s) it surfaced or confirmed. Remove the section if none applied.
- If the scope asked about something the code did not make clear, record it under **Not determined**. Do not guess to fill a gap. Remove that section if everything in scope was determined.
- Set `Mapped` to today's date in ISO format `YYYY-MM-DD`.

### Step 7: Validate before writing

- No bracket tokens remain.
- Every finding has What it is, Why it matters, and Evidence, the Evidence note points at a real location you read, and it carries no file path (the path goes to the tracking map in Step 8).
- No finding that Step 3 found resolved is still in the map, and no finding is duplicated.
- Every finding's name is unique. The tracking map keys an item by its name alone, and the later phases reuse that name verbatim, so two findings sharing a name would collide into one item. If two would share a name, qualify each so they read distinctly.
- The `Scope` line matches the mode you actually ran.
- You ran the sub-skill hook in Step 5 and can name every sub-skill it printed. For each printed name, you either applied it or can say in one line why its context is absent from the scope. If you cannot account for a printed name, Step 5 is unfinished: go back.
- The date is ISO `YYYY-MM-DD`.

### Step 8: Write and summarize

- Write the reconciled map to `.bluespec/memory/detect.md`.
- Register the findings you wrote so the tracking map keeps each one's identity. This is registration, not reconciliation: hand the track hook only the findings this run wrote, as the `entries` list of `{name, paths}`, and it records the new ones and follows a renamed path for the rest. It never removes anything you did not report. `name` is the finding's name (this section's title), and `paths` holds the file paths the finding points at (one or more). The path lives here, in tracking, never in the prose. The tracking map holds no note: the prose carries the wording, the map carries only identity and paths. Run it from the project root, passing the payload as the single argument (a name with quotes or backticks stays intact) and reading the JSON result from standard output:

```bash
node ./.bluespec/hooks/track.mjs '{"entries":[{"name":"<FINDING NAME>","paths":["<PATH>"]}]}'
```

Do not edit `.bluespec/tracking.json` yourself, and do not reconcile here. Track only registers what this phase wrote. Repairing the chain across phases stays with `/bluespec.repair`.

- Output a short summary to the user:
  - The scope you ran (full scan, paths, or focus).
  - The findings detected, each with its one-line risk.
  - The sub-skills you applied, if any, named plainly. Do not list the ones that did not apply.
  - What changed since the last run: findings added, findings removed because they are now resolved, and findings updated.
  - Anything left under Not determined.
  - A suggested commit message, for example `docs: update detect map`.
  - **Next step:** point the user to `/bluespec.plan`, the phase that turns these findings into prioritized fixes, each tied to a charter principle. Frame it as the recommended next step, and note they can rerun `/bluespec.detect` (on the whole project or a narrower scope) whenever the code changes.

Keep the map in plain language throughout. A non-developer should understand what each finding is and the risk it carries, while the evidence stays precise enough for the next phases to use.
