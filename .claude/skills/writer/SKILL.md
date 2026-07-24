---
name: writer
description: Authoritative reference for writing Lagune's prose. Use before writing, editing, or translating any artifact, charter, command text, doc, or user-facing message.
user-invocable: true
metadata:
  internal: true
---

# Lagune writing

This skill is the specialized, authoritative description of **how Lagune's prose is written**: the language and style conventions, the plain-language rule, and the reconcile discipline that keeps artifacts living. Consult it before writing or editing any artifact, the charter, command text, a doc, a comment, or a user-facing message.

## Language and style

- Avoid em dashes or semicolons where they are not grammatically necessary. Where one would go, for example, use the mark the sentence actually calls for, usually a comma, colon, or parentheses.
  - Write in complete sentences, each with a beginning, middle, and end, instead of chopping one thought into fragments. A semicolon, an em dash, or a period used to cut a sentence short is the same habit wearing different punctuation, so the fix is to compose the sentence, not to swap the mark that split it.
- When the document already exists, read it and study its existing style before you edit, then write in that same voice. When it is entirely new, read a similar or equivalent file to learn the pattern first.
- Avoid writing a file path or pasting a code snippet into a document. A flat document does not track the source, so a moved file or a changed snippet leaves a stale, broken reference.

## Rules

- **All project content is written in English** (docs, code, comments, command text, user messages), regardless of the language used in chat.
- **Less is more:** cut anything that adds words without meaning: throat-clearing openers that delay the point, reinforcement triads where one word does the job, framing sentences that announce content instead of being it, and padding that stretches a thought to look thorough. Stop once the point lands.
- **Remove before you add:** before editing existing text, first remove everything that is no longer valid, then adapt and update what changed, and add new text only when it is genuinely needed.
- **Redundancy is forbidden:** judged across the whole document, not one sentence at a time. A sentence clean on its own still counts as redundant when its meaning already lives elsewhere. Say each thing once, in the one place it belongs.
- **Describe intent, not implementation:** do not restate logic, cite specific variable or method names, or re-explain how something is built. A rename or a refactor silently turns that prose false, so say what it does and why, and let the code stay the single source of how.
- **Never break lines by hand in the middle of the prose:** line width, wrapping, and formatting are Prettier's job, not yours.
- Use straight quotes and apostrophes (`'` and `"`), never their curly forms, and avoid any character a standard keyboard lacks.

## Translation

When the source is in another language, translate it into natural American English that reads as though written in English from the start, as fluent as the original.

- Avoid literal or stiff translations. ❌ "The name of the project of the organization" is a calque, ✅ "The project name in the organization" is English.
- Grasp the original's tone, idiom, and intent before you translate, then reproduce those in English.
- Where the source is unclear or ambiguous, ask for more context before translating instead of guessing.

## Plain language

Findings, recommendations, messages, and fixes are expressed in plain language, actionable regardless of the user's technical depth. No user tier is privileged over another. The deep security knowledge is carried by the spec and its on-demand sub-skills, so the surface stays intelligible to any user, developer or not.

## Reconcile, never append-only

Lagune's artifacts are living documents, not logs. When a phase re-runs and its artifact already exists, reconcile it against the current truth: re-check each existing entry, keep what still holds, rewrite what changed, and remove what no longer applies (for example, a finding the code shows is now resolved). Write genuinely new content only for what is actually new. The past does not matter for its own sake. Never let an artifact grow by accumulation alone.

Closure is this same reconcile reaching its conclusion. When `verify` proves a risk closed, it stands the finding down across the whole chain, with the user's confirmation, instead of leaving a later phase to drop it. This is why `verify` is the one phase that writes to the other phases' artifacts.

## Review

After writing, run this checklist:

- [ ] Remove every redundancy, across the whole document.
- [ ] Where the writing runs long-winded or roundabout, tighten it to be direct, without sacrificing clarity.
- [ ] Confirm every rule and recommendation in this skill is followed.
