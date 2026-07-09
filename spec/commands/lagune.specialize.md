---
description: Specialize Lagune in a security area from a source or topic you give it, distilling it into a new on-demand sub-skill the detect and verify phases load later. It writes a focused, language-agnostic, defense-only knowledge module, never an exploit.
---

## User Input

```text
$ARGUMENTS
```

The User Input above decides how this command runs. Read it before proceeding.

## Outline

You are giving Lagune a new **specialty**: a focused, language-agnostic security sub-skill the detect and verify phases load on demand, listed in `.lagune/specializations.md` and importable directly with `@.lagune/skills/<name>.md`. You distill the user's source or topic into it. A sub-skill audits and explains a risk area, it never rewrites the user's code, and it never produces an attack input. The shape lives in `.lagune/templates/specialize-template.md`, and the built-in sub-skills under `.lagune/skills/` (`regex`, `javascript`, `browser`) are worked examples to mirror.

The result is the sub-skill at `.lagune/skills/<name>.md`, a one-line entry in the catalog `.lagune/skills.json` so `.lagune/specializations.md` lists it, and a `.gitignore` re-include so the sub-skill stays version-controlled. You write all three. You never touch the user's source.

### Step 1: Read the input

Take the User Input as the security source or topic to specialize in. It may be a pasted article or reference, or a short phrase such as "prototype pollution in our cache layer" or "GraphQL injection". If it is empty, ask the user what security concern the sub-skill should cover, then stop until they answer. Never invent a topic.

### Step 2: Defense-only gate

This command is defense only. If the topic asks for offensive tooling, a working exploit, an attack payload, or detection evasion, refuse and explain that a sub-skill audits and explains, it never produces an attack input. Dual-use content is acceptable only in a clearly defensive framing.

### Step 3: Settle the terrain and name, decide create or refine

First settle the **terrain**: the area the sub-skill covers, never the vulnerability. The area is what the knowledge is about, and the attacks are what it teaches you to defend, so when the topic names an attack, settle on the surface that attack targets. For example, the built-ins set the rule: the regex sub-skill covers ReDoS, yet its terrain is `regex`, not `redos`. This same terrain is the title in Step 5 and the tags in Step 6, so name it once here.

The name is that terrain as a safe filename: lowercase, replace every run of characters outside `a-z 0-9 -` with a single `-`, trim leading and trailing `-`, and collapse repeats. Derive it from the terrain you settled, never from the raw topic, so an attack topic never becomes the name. If the terrain is unclear, ask the user for a short area name. This name is also the identity used in `.lagune/skills.json`.

List what already exists by reading the catalog from the project root:

```text
@.lagune/specializations.md
```

Then check whether `.lagune/skills/<name>.md` exists.

- **It exists** (a built-in like `regex`, or one you specialized before): this is a **refine**. Read the current file and use it as the base. Reconcile, never append: fold the new knowledge into the existing sections, keep what still holds, rewrite what changed, and preserve the file's shape. Never replace a built-in from scratch and never blindly clobber an earlier version.
- **It is new:** author from the template in Step 5.

### Step 4: Gather scope

In plain language, work out what the sub-skill must check, what distinguishes a real finding from a false one, and what the safer shapes are. Ask the user only what you need to author it well. Keep everything readable by a non-developer.

### Step 5: Author from the template

Fill in `.lagune/templates/specialize-template.md`:

- Set the `# [SKILL_DOMAIN] vulnerabilities` title to the terrain you settled in Step 3.
- Keep the purpose line, the two rules under `## Rules`, and the detect/verify shape under `## How to act on the result` verbatim.
- **Credit the source, when there is one.** If the material the user gave you has an identifiable origin (an article title, an author, a link, a standard), keep the optional `> - Source: ...` quote and fill it with a short plain credit. If the input was just a topic, or has no attributable source, drop that line entirely. Never invent a source.
- Under `## What to look for`, add one `### ` block per risk class in scope, each in plain language: what the dangerous pattern is, why it matters, and how to make it safe (the `Safer shape:` line, or the bullet list / `#### Common safer shapes` variants the template's comments allow). It may reference an existing deterministic hook only if one genuinely fits, never invent a new hook.

On a refine, apply these to the existing file rather than a blank one. Write no frontmatter: the tags live in the catalog, not the `.md`.

### Step 6: Propose tags, the user confirms

Derive 2 to 4 tags by the same terrain principle as the name (Step 3): the terrain or ecosystem the sub-skill lives in, an abbreviation, its variation, the plain name, never the vulnerability itself. The built-ins set the shallow style: `regex` carries `RegExp`, `Regular Expression`; `javascript` carries `JavaScript`, `Node.js`, `Deno`, `Bun`; `browser` carries `Browser`, `DOM`, `Navigator`. Propose a flat list of candidate tags and let the user add and drop any freely, never a fixed set to pick one from. On a refine, start from the existing entry's tags and reconcile them the same way.

### Step 7: Write the files and keep the sub-skill tracked

- Ensure `.lagune/skills/` exists, then write `.lagune/skills/<name>.md` with the authored or reconciled content. An existing name is reconciled from its current content first, so this never discards a built-in or an earlier version unseen.
- Update `.lagune/skills.json`. If it is absent, create it as `{ "name": "lagune", "entries": [] }`. Add the `{ "name": "<name>", "tags": [...] }` entry, or on a refine rewrite that one entry, preserving every other entry untouched. This is the catalog row `.lagune/specializations.md` is rebuilt from.
- Rebuild the listing so the detect and verify phases see the new entry. Run the hook from the project root:

  ```bash
  node ./.lagune/hooks/specializations.mjs
  ```

  It rewrites `.lagune/specializations.md` from the catalog, folding your new entry in with the built-ins. On a refine this refreshes the changed tags.

- Keep the sub-skill under version control. Lagune ignores the built-in sub-skills by default (`.gitignore` carries `/.lagune/skills/*`), so a sub-skill you author needs an explicit re-include or it stays invisible to git and is lost on the next clone. Run the hook from the project root:

  ```bash
  node ./.lagune/hooks/git.mjs --keep-skill <name>
  ```

  This adds `!/.lagune/skills/<name>.md` after the `/.lagune/skills/*` line, idempotently. It is needed once per sub-skill, on a create. On a refine of a name already re-included, it is a no-op, so running it again is harmless.

### Step 8: Summarize

In plain language, tell the user the sub-skill's name, its tags, what it covers, and that the detect and verify phases now load it on demand (and they can import it directly with `@.lagune/skills/<name>.md`), mentioning it shadows any built-in of the same name on a refine. Suggest a commit message such as `feat: specialize Lagune in <name>`. Say it as a suggestion, not a mandate.
