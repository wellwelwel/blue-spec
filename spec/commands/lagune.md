---
description: Do the work the prompt asks for, with security guarding the build as it happens. Loads the charter, matches the security knowledge the work touches, builds safe-by-default, then checks its own result against what it used.
---

## User Input

```text
$ARGUMENTS
```

The User Input above is the work to do. Read it before proceeding.

## Outline

You are doing the work the prompt asks for (a login page, an upload, an endpoint, whatever it is), and **making it secure as you build it**. It is a way to work: the same work you would do anyway, built so the code is safe-by-default the moment it lands.

This bends to any prompt at any stage, from a first scaffold to a change on a mature codebase. What it produces is the work itself, done safely, in the user's own code.

The shape is three movements around the work: load the defense, build with it, then confirm what you built holds.

### Step 1: Load the charter

Read the charter at `.lagune/memory/charter.md`. It carries the project's security principles, the rules every part of this work must respect.

- **It exists:** load it. Its principles bind the whole build.
- **It does not exist:** proceed anyway. Fall back to the safe-by-default baseline the sub-skills carry, and tell the user in one line that you are working without a charter.

The charter is context to build against.

### Step 2: Work out what you are about to build

Before any sub-skill or any code, think through the work the prompt asks for the way you normally would: what you will build, the pieces it needs, and the boundaries it crosses. A login page implies credentials, a session, and a form that takes input from outside. An upload implies a file crossing a boundary and landing somewhere. An endpoint implies untrusted input and a response.

This is your own reasoning about the task, not a checklist. Its only job is to give Step 3 something concrete to match: the security-relevant surfaces of what you are about to create.

### Step 3: Match the sub-skills to the work

Sub-skills are focused, language-agnostic security knowledge modules that load only on demand. Match them to the work you scoped in Step 2, through this mechanism.

First, list the catalog once:

```text
@.lagune/specializations.md
```

It prints each sub-skill as `name: tags`, suffixing ` [required]` on any the catalog flags. The tags say what each one covers. Reach a verdict on every entry, one at a time:

- **`[required]`:** always applies. Its knowledge governs the work regardless of what you are building.
- **Its context is in the work:** the thing its tags name is part of what you are about to build (its tags say uploads and you are building an upload). It applies.
- **Its context is not in the work:** nothing you are building touches what its tags name. Skip it. Most entries will not apply to a given piece of work, and that is normal.

Judge from what the work actually involves, read off your Step 2 reasoning, not from how relevant an entry feels. For every entry that applies, read `.lagune/skills/<name>.md` directly, one at a time, and follow it. Each carries the defense knowledge for its class of work (uploads, shell, sessions, and so on): let it shape how you build that part, in line with the charter.

Keep the list of sub-skills you applied. Step 5 reuses it to check your own work.

### Step 4: Build it, safe-by-default

Do the work. Build what the prompt asked for, exactly as you normally would, with the charter's principles and the matched sub-skills shaping every security-relevant part as you write it.

- **Apply the defense inline, not afterward.** As you write each part a sub-skill covers, apply that sub-skill's guidance there and then. Validate input at the boundary, not later. Reach for the safe construct the first time, not after a working-but-unsafe version. Security is part of building the thing, never a pass over it once it works.
- **Stay safe-by-default.** The result must be safe out of the box, with no follow-up step required to make it so. Never leave a default that is unsafe until configured.
- **Prefer the simplest vetted control.** Reach for what already exists in order: the project's own tools first, then a platform or framework built-in, then a well-maintained library, and only then custom code. Never hand-roll a security primitive (cryptography, escaping, authentication, sessions) a vetted standard already provides.
- **Never break a charter principle to satisfy the prompt.** If doing what was asked would violate a principle, stop and surface the conflict to the user rather than building it that way. Safe-by-default is not negotiable against a feature request.
- **Use real, current dependencies when one is needed.** Prefer the project's existing tools. When a new one is genuinely warranted, pin a real, maintained version and confirm it against current documentation rather than memory.

Build only what the prompt asked for. This is the work, done well and done safely, not an audit of the surrounding code.

### Step 5: Check your own work against what you used

Before you call the work done, confront what you just built with the defense you applied. This is read-only on what you wrote: you re-read it, you do not rebuild it.

For each sub-skill you applied in Step 3, and for each charter principle that bears on this work, read back over the code you just wrote and confirm the defense actually holds:

- **Is the control on the path, not beside it?** Follow the untrusted data or the risk end to end through what you built, and confirm the guard sits on that path. A safe function written next to the unsafe one that still runs is not applied.
- **Is it complete?** The size limit lands but the file-type check is missing, the one route is guarded but a sibling route is not: an incomplete control leaves the risk reachable.
- **Where a sub-skill ships a deterministic checker** (a hook it tells you to run), run it over what you built and take its result. Its verdict stands over your own reading.

If the check finds a gap, close it now: this is still the same piece of work, and finishing it means finishing it securely. Re-check after the fix. Only when the defense you used holds across everything you built is the work done.

### Step 6: Report what you did in the session

Tell the user plainly what you built and how you kept it safe. Keep it short and in plain language a non-developer understands:

- What you built, in one or two lines.
- Whether a charter was in effect, or that you worked without one.
- The sub-skills you applied and, for each, the defense it shaped in what you built. If none applied, say so in one line.
- Anything you checked in Step 5 that needed closing, and that it is now closed.
- Any point where the safe choice differed from what was literally asked, and how you resolved it (or the conflict you surfaced, if a principle stopped you).

The deliverable is the working, safe code in the user's project.
