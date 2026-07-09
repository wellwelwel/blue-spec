---
description: Establish or update the project's security charter, the safe-by-default principles every later phase must respect. Reads the project's files to learn what it is and uses, weighs any description you give against them, and asks when something is unclear.
---

## User Input

```text
$ARGUMENTS
```

The User Input above decides how this command runs. Read it before proceeding.

## Outline

You are creating or updating the project's **security charter** at `.lagune/memory/charter.md`: the set of safe-by-default principles that every later phase (detect, plan, harden, verify) must respect. This file is a TEMPLATE of placeholder tokens in square brackets (for example `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`). Fill it with concrete values and write it back.

This phase reads the project to decide **which principles it needs**, never to map what the code does with evidence. That mapping is the detect phase. The boundary is purpose, not depth: even when you read code here, you read it to derive a rule, not to record a finding.

### Step 1: Load the charter and pick the mode

Load the charter at `.lagune/memory/charter.md`. If it does not exist, initialize it from the template at `.lagune/templates/charter-template.md` first, and identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.

The User Input above selects one of two modes. The mode sets where the direction comes from, not how deep the reading goes (Step 2 governs that):

- **Input given:** the user describes the project in plain words and may not know the technical terms. Treat the description as direction, which Step 2's reading then broadens beyond what they named.
- **No input:** propose a charter yourself, working out the project from its own files in Step 2.

### Step 2: Read the project to learn what it is and uses

Read in escalating tiers, stopping as soon as the project's purpose and stack are clear:

- **Strategic files first.** Read the dependency manifests and lockfiles, the README, the configuration and environment samples, and the top-level directory shape. These reveal purpose, stack, and the libraries that carry security weight: a payment SDK, an auth library, a web framework, a CLI argument parser, a database client. For most projects this is enough.
- **A deeper code read, only as a fallback.** When there is no usable description and the strategic files do not reveal what the project is, or describe something other than the app itself (a generic or empty manifest, no README, a bare repo, or a manifest that turns out to describe tooling or scaffolding rather than the project), read the code itself, its entry points and the shape of what it does, enough to infer the project's purpose. This read can be token-heavy, so tell the user the strategic files were not enough and that you are about to read more deeply, then proceed.

Either tier reads to decide which principles the project needs, never to record findings or code locations. A payment dependency means payments are in scope and a principle is owed, without mapping where the payment code lives.

### Step 3: Combine the description and the project

The description and the project are two sources that add up, not two claims to judge between. The description carries the user's intent, and Step 2's reading reveals what else the project holds beyond what they named. Both feed the charter. Charter records the policy the project should hold to, never the state of its code, so it does not rule on whether a described feature is built yet.

Work out what each source implies for security, including the parts no one named. A tool that remembers things between runs implies stored data. Users who see only their own data imply login or access control. Anything that takes input from outside implies untrusted input to validate, and anything that handles money or personal details implies sensitive data. Derive principles from those implications, not only from what was said literally.

- **What the user describes** earns its principles, whether or not the code is there yet. A stated intent (it will take payments) is reason enough for the principle, the charter is the policy, not an inventory.
- **What the project reveals beyond the description** earns its principles too. When the files show something the user did not mention (they say a static site, but the manifests show a database client and an auth library), add those principles and note the additions in plain language. This is the charter going further than the user pointed, not correcting them.
- **No description** resolves entirely from Step 2: aim for the same specific, purpose-aware charter a description would have produced, whether the signal was a payment library, an auth setup, a public API surface in a library, the arguments and shell calls in a CLI, or the local storage in a desktop app.

### Step 4: Ask the user when something is still unclear

After reading, ask only when a gap actually changes the charter: you still cannot tell what the project fundamentally is or does, the description and the project point at genuinely different systems and you cannot tell which principles apply, or a security-deciding fact is absent (whether there are users, whether money is handled, where data lives). Asking and the deeper read of Step 2 are complements, not alternatives: a bare project may need both. Do not ask to offload work you can resolve by reading, and phrase every question in plain language a non-developer understands.

### Step 5: Reconcile the existing charter

This charter is reconciled, never append-only. If it was empty or freshly initialized, skip this step. Otherwise re-check each existing principle against what Steps 2 to 4 now show:

- **Still holds:** keep it, refining the wording if the project changed.
- **Changed:** rewrite the rule or the `Why:` line to match.
- **No longer applies:** remove it. A principle about payments stays only while the project still takes payments. Do not keep a principle for history.

This reconcile is for the project's own principles under `## Principles`. The `## Baseline discipline` section is universal, not a project principle: keep it verbatim, and if an existing charter predates it, add it from the template.

The charter has no tracking map and is not part of the finding chain, so reconcile it here in prose only. Do not run repair and do not touch `.lagune/tracking.json`.

### Step 6: Fill the template and set the version

- Replace every placeholder with concrete text. Leave no bracket tokens behind.
- Each principle MUST carry three things: a clear name, an imperative and non-negotiable rule (write it with Never, Always, or MUST, in plain language a non-developer understands), and a plain-language `Why:` line that states the risk it prevents. Explain the risk, not just the fix.
- The starters are a shape, not a quota. Write only the principles this project needs, and as many as it needs. A checklist of rules that do not apply to this project is a failure, not thoroughness.
- The `## Baseline discipline` section carries no placeholders, so fill nothing into it. It does not affect the version, which tracks only the project principles and Governance.
- Fill the Governance section with how the charter is upheld and amended, in plain language.
- For a brand new charter, set `Version` to `1.0.0`. For an update, increment it: MAJOR for removing or redefining a principle, MINOR for adding a principle or materially expanding one, PATCH for wording and clarity fixes.
- Set `Ratified` to today's date in ISO format `YYYY-MM-DD`. Keep the original ratification date on later updates.

### Step 7: Validate, write, and summarize

Validate before writing:

- No bracket tokens remain, and every principle has a name, a rule, and a `Why:` line.
- The date is ISO `YYYY-MM-DD` and the version line is present.
- Each principle's rule is imperative and non-negotiable (Never, Always, or MUST), specific, and free of vague language, and none is duplicated.
- The `## Baseline discipline` section is present and verbatim, with its three blocks intact: only the controls the project needs, prefer the simplest vetted control, and when a control seems skippable.
- **Boundary check:** every principle states a rule the project must hold to, never an observation of what the code does. `Always validate all input before use` is a principle. `The config value is read without validation` is a finding, so drop it or rewrite it as a rule. Likewise, `Always validate data against its schema before persisting it` is a principle, while `Unstructured data is written straight to the database` is a finding.

Then write the completed charter to `.lagune/memory/charter.md` and output a short summary:

- The principles now in the charter, each with its one-line risk.
- The version and, for an update, why it changed and what reconciled (kept, rewritten, removed).
- Anything you had to assume, or any question still open.
- A suggested commit message, for example `docs: establish security charter v1.0.0`.
- **Next step:** point the user to `/lagune.detect`, the phase that reads the code to map what the system actually does, so the later phases work from real context. Note they can rerun `/lagune.charter` any time the principles need to change.

Keep the charter in plain language throughout. A non-developer should be able to read it and understand both the rule and the risk it prevents.
