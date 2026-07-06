---
name: specialize
description: Author a new built-in Blue Spec sub-skill inside the Blue Spec source, not a scaffolded `.bluespec/` target. Use when adding or refining a security knowledge module that ships with Blue Spec, against the native layout (`spec/skills/*.md` plus the catalog).
user-invocable: true
metadata:
  internal: true
---

# Authoring a built-in Blue Spec sub-skill (development workspace)

The end-user command `@spec/commands/bluespec.specialize.md` writes into a **scaffolded target project**: `.bluespec/skills/<name>.md` and `.bluespec/skills.json`. Neither path exists here. This repo is the **Blue Spec source**, where built-in sub-skills live in `spec/skills/<name>.md` and the catalog is a hardcoded TypeScript array, not a runtime JSON file. There is also no "user" registry: a built-in is registered in code, compiled, scaffolded, and tested.

So you reuse the command's **authoring discipline** (terrain, defense-only gate, template, tags, reconcile-never-append) but **override every output path** to the native layout, and you update the registration points the end-user command never has to.

## Step 1: Run the command's authoring steps, with redirected paths

Read and follow `@spec/commands/bluespec.specialize.md` in full. Its authoring steps hold unchanged. The one thing that does not is where files are read and written, since the command targets a scaffolded project and you are in the source. Remap every path it names:

| Command path (end-user target)                                     | Native path (use this instead)                                                      |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `.bluespec/skills/{regex,javascript,browser}.md` (worked examples) | every `*.md` already in `spec/skills/` (list the directory, mirror the closest one) |
| `.bluespec/templates/specialize-template.md`                       | `spec/templates/specialize-template.md`                                             |
| `node ./.bluespec/hooks/skills.mjs` (list what exists)             | read `spec/skills/` and `SKILLS_CATALOG` in `src/hooks/skills/catalog.ts`           |
| `.bluespec/skills/<name>.md` (the sub-skill file)                  | `spec/skills/<name>.md`                                                             |
| `.bluespec/skills.json` (catalog entry)                            | a `BuiltinSkillEntry` in `src/hooks/skills/catalog.ts`                              |

One path it names stays put: a hook reference inside the `.md` body keeps the `./.bluespec/hooks/<x>.mjs` form, because that body ships verbatim to the end user and must point at their scaffolded path, not the source.

## Step 2: Decide the category (group)

Every built-in belongs to a **category** (`group`), which is how `npx blue-spec add --skills <category>` bundles it into a target project. Categories live in `SKILL_GROUPS` in `src/hooks/skills/groups.ts`.

- A language sub-skill goes under its language key (`python` under `python`, and so on).
- A sub-skill about an application-security risk OWASP tracks goes under `owasp`.
- Match the sub-skill to the category that actually describes it. If none fits, that is a signal a new category may be needed, adding a `SkillGroup` to `SKILL_GROUPS` (key, label, description). Ask the user before inventing one, do not force an unrelated module into `owasp` to avoid the question.

The end-user `skills.json` has no `groups` field by default, but the **built-in** catalog entry does. Set it.

## Step 3: Write and register, then verify

A new built-in is not done when the `.md` exists. Touch each of these:

### Required (a sub-skill is broken without these)

1. Write the authored module to **`spec/skills/<name>.md`** (Step 1). `src/core/assets.ts` reads `spec/skills/` by directory listing, so the file loads automatically once it is on disk, with no code change.
2. Add the `BuiltinSkillEntry` `{ name, tags, groups }` to **`src/hooks/skills/catalog.ts`**. Without this row the file scaffolds, but the `skills` hook never lists it and `add --skills` cannot bundle it.
3. Add a `SkillGroup` to **`src/hooks/skills/groups.ts`**, but only when you introduced a new category.

### Tests (the suite asserts the catalog and the docs stay in sync)

4. **`test/integration/skills/skills.test.ts`** iterates `SKILLS_CATALOG` (e.g. "never repeats the name inside its own tags"), so a new entry is exercised automatically. Check that no count-based or hardcoded-list assertion now fails.
5. **`test/e2e/init/skills-hook.test.ts`** and **`test/e2e/init/manage-cli.test.ts`** assert scaffold and listing behavior, sometimes by sub-skill name. Update any hardcoded expectation that should now include the new one.
6. **`test/integration/cli/manifest.test.ts`** and **`test/integration/cli/scaffold-groups.test.ts`** reference specific skill paths like `.bluespec/skills/regex.md`. Update them only when your change alters what a given category scaffolds.
7. Run the full suite: `npm test`. Its `pretest` hook runs `scripts/build.sh` first, so the compiled `lib/hooks/*.mjs` the e2e tests exercise are rebuilt automatically, no separate build step needed. All green before you call it done.

### Documentation (the built-in catalog is enumerated by hand in the website)

8. Add a row to the "set that ships with Blue Spec" table in **`website/docs/commands/skills.mdx`** (around line 48), giving the built-in its category and focus. This table is maintained by hand and drifts silently when a built-in is missing.
9. The example listing output in **`website/docs/hooks/skills.mdx`** (`# => regex: ...`) is illustrative. Update it only when it should showcase the new one.
10. Update **`README.md`** only when it enumerates built-ins.

### Not touched

- `src/core/skills-catalog.ts` (the _empty user_ catalog factory), `src/hooks/skills/discover.ts` (reads the _user's_ `.bluespec/skills.json`), and `.bluespec/skills.json` itself: these are the **end-user** registry. A built-in never writes there.

## Quick checklist

```
[ ] spec/skills/<name>.md            authored from spec/templates/specialize-template.md (reconciled on a refine)
[ ] src/hooks/skills/catalog.ts      BuiltinSkillEntry added { name, tags, groups }
[ ] src/hooks/skills/groups.ts       only if a new category was introduced
[ ] tests updated + npm test green
[ ] website/docs/commands/skills.mdx table row added
```

## Summary to the user

As Step 8 of the command: state the name, tags, category, what it covers, and that the phases now load it on demand once shipped (end users import it with `@.bluespec/skills/<name>.md`). Note it shadows any same-named entry on a refine. Suggest a commit such as ``feat: add specialization in `<name>` defense``, matching the wording the existing built-ins use, as a suggestion, not a mandate.
