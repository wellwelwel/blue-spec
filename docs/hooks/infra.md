# infra hook: Detect IaC misconfiguration

> Sweep Terraform, Dockerfiles, and GitHub Actions for misconfiguration, or score a single snippet, from the command line.

Canonical: https://lagune.ai/docs/hooks/infra
Last updated: 2026-07-24

The `infra` hook flags **infrastructure-as-code misconfiguration** that is decidable from the file: a network open to the world, a wildcard permission, a secret in a manifest, a root container, an untrusted value in a CI shell. It reads only IaC files (`.tf`/`.tf.json`/`.hcl`, `Dockerfile*`, `.github/workflows/**`). It is the deterministic engine behind the [`infra` sub-skill](https://lagune.ai/docs/commands/skills), in **scan** or **check** mode.

## Run it

**Scan the codebase**

```bash
node ./.lagune/hooks/infra.mjs             # scans every IaC file
node ./.lagune/hooks/infra.mjs -d infra    # scans a directory
node ./.lagune/hooks/infra.mjs -f Dockerfile # scans a single file
```

**Check a snippet**

Pass the snippet with `-p` and its kind with `-k` (`terraform`, `dockerfile`, or `github-actions`).

```bash
node ./.lagune/hooks/infra.mjs -k terraform  -p 'actions = ["*"]'  # => iam-wildcard
node ./.lagune/hooks/infra.mjs -k dockerfile -p 'FROM node:20'     # => mutable-tag
```

The scan prints up to two sections. **Infrastructure risks found** exits non-zero and holds the decidable defects (a `0.0.0.0/0` ingress on a sensitive port, a wildcard IAM statement, a manifest secret, `encrypted = false`, an unpinned git module, an image that explicitly runs as root, a `curl | sh`, a CI script injection, `permissions: write-all`). **Infrastructure hardening advisories** does not change the exit code (a mutable base tag, a tag-pinned action). A clean run prints `no infrastructure risks found`.

## How to read the verdict

The check mode prints the highest-severity tag it matched (for example `public-ingress`, `iam-wildcard`, `root-user`, `curl-pipe`, `script-injection`, `write-all`), an advisory tag (`mutable-tag`, `unpinned-action`), or `safe`. Only a finding-severity tag exits non-zero.

### CLI options

| Option      | Alias | Value                                           | Description                                                    |
| ----------- | ----- | ----------------------------------------------- | -------------------------------------------------------------- |
| `--pattern` | `-p`  | a snippet                                       | Check one snippet. Requires `-k`. Repeat for several.          |
| `--kind`    | `-k`  | `terraform` \| `dockerfile` \| `github-actions` | The kind the snippet is judged as.                             |
| `--dir`     | `-d`  | a directory                                     | Scope a scan to a directory. Repeats and combines with `-f`.   |
| `--file`    | `-f`  | a file                                          | Scope a scan to a single file. Repeats and combines with `-d`. |

With no option it scans every IaC file in the project. `-p` cannot be combined with `-d` or `-f`.

**Tip**

The hook catches the blunt, decidable cases: absent encryption, `pull_request_target` exposure, and the right IAM scope are judgment the [`infra` sub-skill](https://lagune.ai/docs/commands/skills) still covers.

## Frequently Asked Questions

### What infrastructure files does the infra hook read?

Terraform/HCL (.tf, .tf.json, .hcl), Dockerfiles, and GitHub Actions workflow and action YAML under .github/. It reaches those files even though the source scanners skip them.
