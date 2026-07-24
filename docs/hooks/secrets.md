# secrets hook: Detect hardcoded secrets

> Sweep a codebase for hardcoded credentials from the command line.

Canonical: https://lagune.ai/docs/hooks/secrets
Last updated: 2026-07-24

The `secrets` hook flags **credentials compiled into the source** instead of read from the environment. It keys on **provenance** (a literal versus an environment lookup), not on the value's contents, so it needs no exhaustive catalog of provider prefixes and produces almost no false positives. It is the deterministic engine behind the [`secrets` sub-skill](https://lagune.ai/docs/commands/skills).

Provider-format signatures, connection-string credentials, and a literal bound to a secret-named identifier are **language-agnostic**: the same string reads the same in any file. The two heuristics that depend on syntax, an environment lookup with a hardcoded default and a secret flowing into a log sink, are **language-aware**, so a JavaScript `console.log` is never read on a Rust file and Python's `os.getenv("X", "default")` is seen on its own.

## Run it

```bash
node ./.lagune/hooks/secrets.mjs           # scans the whole project
node ./.lagune/hooks/secrets.mjs -d src    # scans a directory
node ./.lagune/hooks/secrets.mjs -f config.ts # scans a single file
```

The scan prints up to two sections. **Hardcoded secrets found** is the finding set (a hardcoded default for a secret-named environment variable, a credential embedded in a connection string, or a value matching a curated provider format), so the hook exits non-zero. **Secret handling to review manually** is a lead set: a plain literal bound to a secret-named identifier (its provenance is decidable, but whether the value is a real secret is not), and a secret-named value flowing into a log or response sink. A clean run prints `no hardcoded secrets found`.

### CLI options

| Option   | Alias | Value       | Description                                                    |
| -------- | ----- | ----------- | -------------------------------------------------------------- |
| `--dir`  | `-d`  | a directory | Scope a scan to a directory. Repeats and combines with `-f`.   |
| `--file` | `-f`  | a file      | Scope a scan to a single file. Repeats and combines with `-d`. |

With no option it scans the whole project.

### Language coverage

The environment-fallback finding and the log-sink lead read a per-language set of forms, so they cover the languages below and stay silent elsewhere. The other three signals run on **every** file.

| Signal              | Languages                                                                       |
| ------------------- | ------------------------------------------------------------------------------- |
| Environment default | JavaScript/TypeScript, Python, Ruby, PHP, Kotlin, Java, Go (`cmp.Or`), Rust, C# |
| Log / response sink | JavaScript/TypeScript, Python, Ruby, PHP, Java, Kotlin, Go, Rust, C, C++, C#    |

**Is this a policy problem?**

No. Detecting a secret's format to warn that it was committed is standard defensive tooling, the same operation gitleaks, trufflehog, and GitHub push-protection perform. The hook ships detection signatures (public token **formats**), never a live secret, and it audits and explains rather than exfiltrating.

## Frequently Asked Questions

### How does the secrets hook avoid false positives?

It keys on provenance, not on the value contents. High-confidence formats (provider tokens, environment fallbacks, connection strings) are findings that exit non-zero. A plain literal bound to a secret-named identifier is a review lead to confirm, and the same identifier read from process.env is not flagged at all.
