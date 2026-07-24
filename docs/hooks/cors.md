# cors hook: Audit CORS origins

> Scan source for a bypassable CORS origin allowlist, or score a single origin value for over-permissive access, from the command line.

Canonical: https://lagune.ai/docs/hooks/cors
Last updated: 2026-07-24

The `cors` hook is the deterministic engine behind the [`http-request` sub-skill](https://lagune.ai/docs/commands/skills), and you can run it yourself. It works in two modes from one command: a **scan** that sweeps source for a **bypassable origin allowlist** (a host-validation regex an attacker host slips past), and a **score** that rates a single **CORS origin** value as `wildcard`, `null`, or `safe`.

## Scan a codebase

With no flag it scans the whole project.

**Whole project**

```bash
node ./.lagune/hooks/cors.mjs
```

**A directory**

```bash
node ./.lagune/hooks/cors.mjs -d src/server
```

**A single file**

```bash
node ./.lagune/hooks/cors.mjs -f internal/auth/origin.go
```

It lists each bypassable allowlist under one header, grouped by file. A host validator whose `.+`/`.*` sits in the authority segment before the trusted-host suffix (`^https?://.+\.trusted\.com`) lets an attacker host like `your-site.com.attacker.com` slip past.

```text
Origin-allowlist patterns with a greedy wildcard (bypassable, review):

internal/auth/origin.go
  ^https?://.+\.trusted\.com
```

This is a review lead, not a closed finding: whether the regex gates a real trust decision is undecidable from the text, so a scan never changes the exit code. Read each and confirm the allowlist compares by full equality. When nothing is found, it prints a single line.

```bash
node ./.lagune/hooks/cors.mjs -d src/clean
# => no bypassable origin allowlist found
```

## Score an origin

Pass each origin with `-o`. The hook prints one word per origin and exits non-zero on any `wildcard` or `null`.

**One origin**

```bash
node ./.lagune/hooks/cors.mjs -o '*'                       # => wildcard
node ./.lagune/hooks/cors.mjs -o 'null'                    # => null
node ./.lagune/hooks/cors.mjs -o 'https://app.example.com' # => safe
```

**Several origins**

Repeat `-o` to score a whole allowlist in one call, one verdict per line, in order.

```bash
node ./.lagune/hooks/cors.mjs \
  -o 'https://app.example.com' \
  -o '*' \
  -o 'null'
# => safe
# => wildcard
# => null
```

| Verdict    | Meaning                                                                          |
| ---------- | -------------------------------------------------------------------------------- |
| `safe`     | Not `*`, `null`, or a `*`-glob. It does not guarantee a well-formed origin.      |
| `wildcard` | `*`, a subdomain/host/port glob: any site (or a wide set) may read the response. |
| `null`     | The `null` origin, which sandboxed iframes and redirects can forge.              |

Only `safe` is an allow, and `-o` is a value oracle: it judges the value, not the handler, so confirm the handler with the `http-request` sub-skill.

### CLI options

| Option     | Alias | Value       | Description                                                    |
| ---------- | ----- | ----------- | -------------------------------------------------------------- |
| `--origin` | `-o`  | an origin   | Score one origin value. Repeat to score several, one per line. |
| `--dir`    | `-d`  | a directory | Scope a scan to a directory. Repeats and combines with `-f`.   |
| `--file`   | `-f`  | a file      | Scope a scan to a single file. Repeats and combines with `-d`. |

With no option it scans the whole project. `-o` is the score mode and cannot be combined with `-d` or `-f`.

**What it does not cover**

The scan reads the **bypassable-regex** shape, and `-o` scores origin **values**. Two source-level patterns stay out of reach: reflection of the request's `Origin` (the server echoes the incoming `Origin` back, or pairs it with credentials), and a permissive `endsWith`/substring allowlist. Recognize them in the code and treat them as the [`http-request` sub-skill](https://lagune.ai/docs/commands/skills) describes.

## Frequently Asked Questions

### Why is a null CORS origin dangerous?

Sandboxed iframes and some redirects send Origin: null, so an allowlist that trusts null grants those contexts read access. The cors hook flags it alongside the wildcard.

### How do I catch a bypassable CORS origin allowlist?

Run node ./.lagune/hooks/cors.mjs over the codebase. It flags a host-validation regex whose greedy wildcard sits before the trusted suffix, so an attacker host like your-site.com.attacker.com slips past.
