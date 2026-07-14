# Migrate

> Move a legacy .bluespec/ install to Lagune with a single command, keeping your charter, artifacts, tracking, and own sub-skills.

Canonical: https://lagune.ai/docs/commands/migrate
Last updated: 2026-07-14

🔀 Move a legacy `.bluespec/` install to **Lagune**, keeping everything you wrote.

**For projects installed under the legacy name**

If your project was set up by the legacy `blue-spec` package, its state lives in `.bluespec/` and its agent commands answer to `/bluespec.*`. Migrate brings all of it to Lagune in one run.

Run it once, from the project root:

```bash
npx -y lagune@latest migrate
```

**Your memories and specializations are never lost**

Only the old name inside them changes, never the content. The one exception, as in [`update`](https://lagune.ai/docs/get-started/install#update): a built-in you refined is reset to the shipped version, still recoverable from your git history.

**Tip**

In doubt? Make sure your project's current state is committed before running the migration.

## What changes

Once migrated, your project will answer to the new commands and paths:

**Commands**

| Before                 | After                |
| ---------------------- | -------------------- |
| `/bluespec`            | `/lagune`            |
| `/bluespec.charter`    | `/lagune.charter`    |
| `/bluespec.detect`     | `/lagune.detect`     |
| `/bluespec.plan`       | `/lagune.plan`       |
| `/bluespec.harden`     | `/lagune.harden`     |
| `/bluespec.verify`     | `/lagune.verify`     |
| `/bluespec.repair`     | `/lagune.repair`     |
| `/bluespec.specialize` | `/lagune.specialize` |
| `/bluespec.prove`      | `/lagune.prove`      |

**Files**

In your `.gitignore`, every line of the legacy block is rewritten in place (an entry missing from an older block is backfilled):

| Before                                   | After                                  |
| ---------------------------------------- | -------------------------------------- |
| `# Blue Spec`                            | `# Lagune`                             |
| `/.bluespec/templates/`                  | `/.lagune/templates/`                  |
| `/.bluespec/hooks/`                      | `/.lagune/hooks/`                      |
| `/.bluespec/proofs/`                     | `/.lagune/proofs/`                     |
| `/.bluespec/specializations.md`          | `/.lagune/specializations.md`          |
| `/.bluespec/skills/*`                    | `/.lagune/skills/*`                    |
| `!/.bluespec/skills/<your-sub-skill>.md` | `!/.lagune/skills/<your-sub-skill>.md` |
| `/**/bluespec.*`                         | `/**/lagune.*`                         |
| `/**/bluespec/`                          | `/**/lagune/`                          |

In `.lagune/manifest.json` and `.lagune/tracking.json`, the identity field is renamed and everything else is kept:

| Before                | After              |
| --------------------- | ------------------ |
| `"name": "blue-spec"` | `"name": "lagune"` |

**Paths**

Lagune's own state moves as one directory:

| Before       | After      |
| ------------ | ---------- |
| `.bluespec/` | `.lagune/` |

In your agent's own location, the command artifacts are renamed, one line per supported agent:

| Before                                   | After                                  |
| ---------------------------------------- | -------------------------------------- |
| `.agent/skills/bluespec*`                | `.agent/skills/lagune*`                |
| `.agents/commands/bluespec*.md`          | `.agents/commands/lagune*.md`          |
| `.amazonq/prompts/bluespec*.md`          | `.amazonq/prompts/lagune*.md`          |
| `.augment/commands/bluespec*.md`         | `.augment/commands/lagune*.md`         |
| `.bob/commands/bluespec*.md`             | `.bob/commands/lagune*.md`             |
| `.claude/skills/bluespec*`               | `.claude/skills/lagune*`               |
| `.clinerules/workflows/bluespec*.md`     | `.clinerules/workflows/lagune*.md`     |
| `.codebuddy/commands/bluespec*.md`       | `.codebuddy/commands/lagune*.md`       |
| `.codex/skills/bluespec*`                | `.codex/skills/lagune*`                |
| `.continue/prompts/bluespec*.prompt`     | `.continue/prompts/lagune*.prompt`     |
| `.cospec/commands/bluespec*.md`          | `.cospec/commands/lagune*.md`          |
| `.crush/commands/bluespec*.md`           | `.crush/commands/lagune*.md`           |
| `.cursor/skills/bluespec*`               | `.cursor/skills/lagune*`               |
| `.devin/skills/bluespec*`                | `.devin/skills/lagune*`                |
| `.factory/commands/bluespec*.md`         | `.factory/commands/lagune*.md`         |
| `.forge/commands/bluespec*.md`           | `.forge/commands/lagune*.md`           |
| `.gemini/commands/bluespec*.toml`        | `.gemini/commands/lagune*.toml`        |
| `.github/prompts/bluespec*.prompt.md`    | `.github/prompts/lagune*.prompt.md`    |
| `.goose/recipes/bluespec*.yaml`          | `.goose/recipes/lagune*.yaml`          |
| `.hermes/skills/bluespec*`               | `.hermes/skills/lagune*`               |
| `.iflow/commands/bluespec*.md`           | `.iflow/commands/lagune*.md`           |
| `.junie/commands/bluespec*.md`           | `.junie/commands/lagune*.md`           |
| `.kilocode/workflows/bluespec*.md`       | `.kilocode/workflows/lagune*.md`       |
| `.kimi/skills/bluespec*`                 | `.kimi/skills/lagune*`                 |
| `.kiro/prompts/bluespec*.md`             | `.kiro/prompts/lagune*.md`             |
| `.lingma/skills/bluespec*`               | `.lingma/skills/lagune*`               |
| `.opencode/commands/bluespec*.md`        | `.opencode/commands/lagune*.md`        |
| `.pi/prompts/bluespec*.md`               | `.pi/prompts/lagune*.md`               |
| `.qoder/commands/bluespec*.md`           | `.qoder/commands/lagune*.md`           |
| `.qwen/commands/bluespec*.md`            | `.qwen/commands/lagune*.md`            |
| `.roo/commands/bluespec*.md`             | `.roo/commands/lagune*.md`             |
| `.rovodev/skills/bluespec*`              | `.rovodev/skills/lagune*`              |
| `.shai/commands/bluespec*.md`            | `.shai/commands/lagune*.md`            |
| `.tabnine/agent/commands/bluespec*.toml` | `.tabnine/agent/commands/lagune*.toml` |
| `.trae/skills/bluespec*`                 | `.trae/skills/lagune*`                 |
| `.vibe/skills/bluespec*`                 | `.vibe/skills/lagune*`                 |
| `.windsurf/workflows/bluespec*.md`       | `.windsurf/workflows/lagune*.md`       |

## How it works

Migrate reads your legacy manifest and carries the whole install over:

1. Renames `.bluespec/` to `.lagune/`.
2. Removes the legacy `/bluespec.*` agent commands and writes the `/lagune.*` ones in their place, in your agent's own format.
3. Rewrites the old name inside the manifest, the tracking, the phase artifacts, and any sub-skill you authored, keeping their content otherwise intact.
4. Migrates the Lagune block in your `.gitignore`, preserving your own entries and any sub-skill re-include.
5. Refreshes the templates, hooks, and built-in sub-skills to the installed version, the same way [`update`](https://lagune.ai/docs/get-started/install#update) does.

Your security work survives as it is: the charter, the artifacts each phase produced, the tracked findings and the paths they point at, and every sub-skill of your own.

**Tip**

- It touches only Lagune's own files, never your code.
- Running it again is a no-op: once the project runs on Lagune, there is nothing left to migrate.
- If both `.bluespec/` and `.lagune/` exist, it stops and asks you to keep the one holding your state before running again.
