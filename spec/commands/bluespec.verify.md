---
description: Prove each applied control holds by reading the code and confronting it with the hardening record, then stand the findings proven closed down out of the chain. Reads the hardening record and the charter, then verifies every applied control, just the controls, files, or directories you name, or the priorities you choose. Read-only on your code, it only writes Blue Spec's own chain.
---

## User Input

```text
$ARGUMENTS
```

The User Input above decides how this command runs. Read it before proceeding.

## Outline

You are proving that the controls hardening applied **actually hold**, and producing a **verification report** at `.bluespec/memory/verify.md`: a verdict for each applied control, how it was proven, and the evidence behind it. This phase **continues from harden**. Harden already applied the controls and recorded where each one landed, so this phase does not re-apply anything: it proves what is there. Every verdict must point at a control that is really in the hardening record, never a control you imagine.

Think of this phase as a **detect focused on the fixes**. Like detect, it reads the code, but it does not look with an open mind for anything that carries weight: it reads each place the hardening record says a control was applied, and confirms the code there matches. The record and the code can disagree (Step 4 names how). The proof is this confrontation of **what the record claims against what the code shows**, never a test you write or the system run live.

This phase is **read-only on the user's code**: no test, no dependency, no code edit. It writes only Blue Spec's own chain. It is also where the cycle **closes**: a `✅ Risk closed` verdict stands the finding down, removing it from the detect map, the plan, the hardening record, this report, and the tracking, so it is no longer reprocessed (Step 8, with the user's confirmation). When every finding in scope is stood down, the cycle is at **rest**, reopened only when the code changes.

The hardening record is the **primary input**, and this phase is built entirely on it. The charter is the governing context: a control upholds a principle, so confirming the control holds is confirming that principle is met.

### Step 1: Decide the scope from the input

This phase is built entirely on the hardening record. It proves controls that record says were applied. The User Input above selects one of three modes:

- **No input** (the User Input is empty): verify **every applied control** in the hardening record, highest priority first. This is the full verification pass across what was hardened.
- **Controls, files, or directories given** (the input names one or more control names from the record, or paths in the project): verify only the matching controls. Match a name to the record's applied controls, and match a path to the controls through the tracking map (`.bluespec/tracking.json`), which records the paths each control points at. Leave the rest untouched.
- **One or more priorities chosen** (the input names priorities, for example `Critical`, or `Critical and High`): verify only the controls whose plan fix carried any of those priorities. The pass covers those priority bands, not the whole record.

If the input is ambiguous, prefer the most literal reading (an existing path is a path, a known control name is a control), and state which mode you chose before continuing.

### Step 2: Load context

- Load the hardening record at `.bluespec/memory/harden.md`. This is the **required primary input**.
  - If it does not exist, **stop and tell the user to run `/bluespec.harden` first**. There is nothing to prove without it. Do not invent controls to verify around a missing record.
  - If it exists, read its applied controls. Each block's name, status, what changed, and where is what you prove. Verify only controls that are really in the record.
    - A block marked `Applied` is the control you set out to prove holds.
    - A block marked `Partial` is proven only for the part that was applied. Verify that part, and carry the unfinished part into **Not yet holding** so the report and the record stay in step.
    - A block marked `Blocked` was never applied. Do not verify it. Note it under **Not yet holding** as still open, and leave it for harden.
  - **Check that the scope is covered by the record** before validating:
    - If **nothing** in the scope you chose is in the record (the named controls match no applied control, the named paths match no control's evidence, or no control carries any of the named priorities), **stop and tell the user** to run `/bluespec.harden` on that scope first, then run the verify phase again. Do not prove a control the record does not carry.
    - If the scope is **partly** covered, verify the controls that are in the record, and record each uncovered part under **Not yet holding**. Do not stop, and do not invent a control for the uncovered part.
- Load the verification report at `.bluespec/memory/verify.md`.
  - If it does not exist, initialize it from the template at `templates/verify-template.md` first, and identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
  - If it already exists, read the verdicts already in it. You will reconcile them in Step 3 before proving anything new. Each verdict's identity is the applied control it points at, named so it traces back to the hardening record.
- Load the charter at `.bluespec/memory/charter.md` for the governing principles, **if it exists**. A control upholds a principle, so proving the control holds is proving that principle is met. If a control fails to hold, the principle it upholds is not yet met, and that belongs in the report. If the charter does not exist, prove the controls from the hardening record alone.

### Step 3: Reconcile the existing report

This report is reconciled, never append-only. If the report was empty or freshly initialized, skip this step. Otherwise, before proving anything new, re-check each existing verdict against the current code and the current hardening record:

- **Still valid:** the control is still applied in the code, the record still carries it, and re-reading the code still gives the same verdict. Keep it, and update its wording or evidence if the code moved on.
- **Stale:** the control is no longer in the code, or the record no longer carries it. **Remove the verdict** from the report. Do not keep stale verdicts for history. The report reflects what holds now, not what once held.
- A verdict that flipped (a control that held now fails, or a failure that is now fixed) is rewritten to the current result, not duplicated. Re-read the code rather than trusting the old verdict.
- Only re-check verdicts that fall within the current scope. A verdict outside the scope you are running stays untouched.

If reconciling reveals the chain is inconsistent (for example the tracking map points a control at a file that was renamed or moved, so the path on record no longer exists), run `/bluespec.repair` and then continue. Repair fixes Blue Spec's internal tracking across every phase at once, so the chain stays coherent. Do not try to repair the tracking yourself: this phase reconciles its own report in prose, repair owns the tracking.

### Step 4: Confirm each control against the code

For each in-scope applied control, read the code and confirm whether it holds. You only read: do not edit code, do not write tests, do not add dependencies, and do not run the system.

- **Read the code the control points at.** The hardening record's `Where` describes the area in plain language, and the tracking map (`.bluespec/tracking.json`) holds the file paths for that control. Open those paths and read the area the `Where` describes. The control's identity is the record's `What changed` (what the control is meant to do) and `Where` (where it should be). You are checking the code against that claim.
- **Confront the claim with the code.** Trace that the control described in `What changed` is actually present, complete, and correct in the code, not merely named. A record can claim more than the code delivers, so trust the code over the record. Reasons the two can disagree: the control was applied incompletely, the hardening pass recorded a fix it did not really make, or someone changed the code outside Blue Spec since it was hardened. The verdict comes from this confrontation.
- **Respect the record's own status.** If the record marks a control `Partial`, confirm only the part it says was applied, and carry the unfinished part into **Not yet holding**. If it marks a control `Blocked`, it was never applied: do not confirm it, note it under **Not yet holding**, and leave it for harden.
- **Judge against the charter.** A control upholds a principle. If the code confirms the control, the principle is met. If the code shows the control does not hold, say which principle is therefore not yet met.
- **Do not soften the judgment.** Read what the code does, not what the record wishes it did. If the control is not fully in the code, the honest verdict is `❌ Risk not closed`, even when the record says `Applied`. Never describe a risk as closed to match the record.
- **If you suspect a new problem, do not map it here.** This phase confirms the recorded fixes, it does not detect new findings (that is detect's job). If, while reading, you notice something that looks like a security problem the detect map never covered (whether newly introduced or simply missed), do not record it as a verdict and do not invent a finding. Note it plainly to the user and tell them to run `/bluespec.detect` on that spot so it is mapped properly, then planned and hardened.
- **The verdict is about the risk, not the control.** The control is what you read, but the verdict tells the reader what they actually want to know: is the security risk the control was meant to close actually closed in the code now? An icon carries it at a glance, and the words name the risk in plain language, not the control in jargon. The two are usually the same, but not always. A control can be present yet leave the risk open, for example a safe function added next to the unsafe one, while the unsafe one is still reachable. Judge the risk, and let the control's state be the evidence for that judgment.
- Decide one verdict per control:
  - **✅ Risk closed:** the control is present, complete, and correct where the record says, **and** nothing nearby reopens the same risk. The principle it upholds is met. This is the only verdict that tells the reader the problem is genuinely gone.
  - **❌ Risk not closed:** the code contradicts the record, or shows the control incomplete or absent, **or** the control is there but the risk it targets is still reachable another way. The plan fix it traces to is reopened in effect, and the gap goes under **Not yet holding**, pointing back to harden. When the control exists but the risk persists, say exactly that, so the reader is not misled by a control that does not finish the job.
  - **❓ Cannot tell from the code:** the code does not make it clear enough to confirm or deny (for example, the control depends on configuration or a path you cannot read from the code alone). Record what is missing under **Not yet holding** so it can be settled.

The `✅ Risk closed` findings are this run's **closure candidates**, stood down in Step 8. Every other verdict is still open work and stays in the chain.

### Step 5: Consult the sub-skills

Sub-skills are focused, language-agnostic security knowledge modules that load only on demand. This step is the door to them, and it has a fixed mechanism. Do not improvise an equivalent.

1. **List the catalog by running the hook**, from the project root:

   ```bash
   node ./.bluespec/hooks/skills.mjs
   ```

   This is the only authoritative source. It merges the built-in sub-skills with any the user registered in `.bluespec/skills.json`, and prints each one as `name: tags`. The **tags are the matching signal, and they exist nowhere else**.

2. **Apply every entry whose tags cover a control in scope.** To apply one, read `.bluespec/skills/<name>.md` directly and follow it, to judge the code as it now stands and let that judgment inform the verdict. The only judgment here is which listed sub-skills match the controls in scope, not whether to consult at all. A control no sub-skill covers is simply left to the reading above. This stays read-only on the user's code: the sub-skill reads and reports, it never edits the code.

Report only the sub-skills you applied and how each informed a verdict, never the ones that did not match: an uncovered control is left to the reading above, not announced as a non-match. If none applied, say so in one line.

### Step 6: Fill the template

- Replace every placeholder with concrete text. Leave no bracket tokens behind.
- Set `Scope` to reflect the mode you ran: all applied controls, the named controls or paths, or the chosen priorities.
- **Merge, do not overwrite.** The report now holds the reconciled verdicts from Step 3 plus what you proved in Step 4. Add a new verdict block only for a control you actually verified this run, not already represented. Do not duplicate a verdict that is already there under a different wording.
- Write one block per verified finding, titled with the finding's name (verbatim from the hardening record and detect, no action prefix). Each block MUST carry these parts:
  - **Result:** one of `✅ Risk closed`, `❌ Risk not closed`, or `❓ Cannot tell from the code`. State it about the risk, in plain language a non-developer understands, with the icon first.
  - **How proven:** the way you confirmed it, in plain language: what code you read at the control's `Where`, and how it did or did not match what the record claims. Name what you saw, not a test (there is none).
  - **Evidence:** a short, plain-language note of what you read (the function or area) and what the code showed there, precise enough for a reader to check the same place and reach the same verdict. Do not write the file path here. The path goes to the tracking map in Step 8, where reconcile keeps it current through a rename.
- The template ships with three starter blocks. This is a starting point, not a limit. Add or remove blocks so the report matches what was actually verified.
- Fill **Applied sub-skills** from the sub-skills you applied in Step 5, naming under each the verdict(s) it informed. Remove the section if none applied.
- Record anything that does not yet hold under **Not yet holding**: a control whose risk is `❌ Risk not closed` and the gap, a `❓ Cannot tell from the code` control and what is missing to settle it, the unfinished part of a `Partial` control, and any `Blocked` control still waiting on harden. Name the control and the plan fix each item traces to, so verify, harden, and the plan stay in step. Remove that section if every in-scope control is `✅ Risk closed`.
- Set `Verified` to today's date in ISO format `YYYY-MM-DD`.

### Step 7: Validate before writing

- No bracket tokens remain.
- Every block is titled with a finding name that really exists in the hardening record, and carries Result, How proven, and Evidence.
- No verdict for a finding the record no longer carries, or a control no longer in the code, is still in the report, and no verdict is duplicated.
- Every `Result` is one of `✅ Risk closed`, `❌ Risk not closed`, or `❓ Cannot tell from the code`, and every `❌ Risk not closed` or `❓ Cannot tell from the code` control has a matching entry under Not yet holding.
- Every result rests on the code you actually read, not on the record's claim alone, and no result was softened to match the record. A control that is present but leaves its risk reachable is `❌ Risk not closed`, not `✅ Risk closed`.
- Nothing was written to the user's code: no test, no dependency, no code change. Writes are confined to Blue Spec's own chain artifacts and tracking.
- The `Scope` line matches the mode you actually ran.
- You ran the sub-skill hook in Step 5 and can name every sub-skill it printed. For each printed name, you either applied it to the controls it covers or can say in one line why no in-scope control falls under it. If you cannot account for a printed name, Step 5 is unfinished: go back.
- The date is ISO `YYYY-MM-DD`.

### Step 8: Write, close, and summarize

Run 8a to 8e in order. Cleanup is last, so the report on disk is truthful even if the user declines.

**8a. Write the report.** Write the reconciled report to `.bluespec/memory/verify.md`.

**8b. Register tracking.** Register the findings you verified, including the closed ones, so the tracking map stays current. Hand the track hook the `entries` list of `{name, paths}`, named by the finding's name (your section title), with `paths` the file paths you read. Run it from the project root, passing the payload as the single argument:

```bash
node ./.bluespec/hooks/track.mjs '{"entries":[{"name":"<FINDING NAME>","paths":["<PATH>"]}]}'
```

Do not edit `.bluespec/tracking.json` yourself, and do not reconcile here. Repairing the chain across phases stays with `/bluespec.repair`.

**8c. Ask before standing the closed findings down.** Take this run's `✅ Risk closed` findings. If there are none, skip to 8e. Otherwise list them by name and ask for one confirmation to stand the whole batch down. If the user declines, stand nothing down: they stay in the chain and remain candidates next run.

**8d. Stand the confirmed findings down.** Only on confirmation, for each confirmed finding, by its name (the section title, identical across artifacts):

- Remove its section from `detect.md`, `plan.md`, `harden.md`, and `verify.md`.
- Then drop the same names from the tracking map with the untrack hook, one call for the batch:

```bash
node ./.bluespec/hooks/untrack.mjs '{"names":["<FINDING NAME>"]}'
```

Remove the prose before the tracking. Do not edit `.bluespec/tracking.json` yourself.

**8e. Summarize.** Output a short summary to the user:

- The scope you ran (all controls, named controls or paths, or priorities).
- The controls verified, each with its result (the icon and the risk in plain language) and a one-line note of how it was proven, highest priority first.
- The sub-skills you applied, if any, named plainly. Do not list the ones that did not apply.
- What changed since the last run: results added, results removed because the control is gone, and results that flipped.
- What was stood down this run, or, if the user declined, what was kept instead.
- Anything under Not yet holding, including any control whose risk is not closed, any `❓ Cannot tell from the code` control and what would settle it, and any part of the scope the hardening record did not cover.
- If you suspected a new problem outside the recorded controls, tell the user to run `/bluespec.detect` on that spot so it is mapped, planned, and hardened properly. Do not treat it as a verdict here.
- A suggested commit message, for example `docs: record control verification results`.
- **Next step:** the recommendation depends on what the report shows. Frame it as the recommended next step.
  - If any risk is `❌ Risk not closed`, point back to `/bluespec.harden` to re-apply it, since the fix is effectively still open. If it stays unclosed because the plan never covered it, point to `/bluespec.plan` (or `/bluespec.detect` for an unmapped spot) first.
  - If any control is `❓ Cannot tell from the code`, name what would settle it so the user can resolve it and rerun `/bluespec.verify`.
  - If everything in scope is `✅ Risk closed` and the chain is now empty, tell the user the cycle is at rest, reopened only when the code changes, with `/bluespec.charter` available any time the principles change.
  - If everything in scope is `✅ Risk closed` but open findings remain outside this scope, tell the user this slice is at rest and name what is still open.

Keep the report in plain language throughout. A non-developer should understand what was proven, how, and what still does not hold, while the `Evidence` note stays precise enough that, with the path from the tracking map, a reader can check the same place.
