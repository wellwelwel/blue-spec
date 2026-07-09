# Regex-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### ReDoS (Regular expression Denial of Service)

On a crafted input, the pattern takes an exploding amount of time to match, stalling or overloading the system.

#### Start by mapping the workspace

Begin every ReDoS pass with the deterministic scanner:

```bash
node ./.lagune/hooks/regex.mjs           # scans the whole project
node ./.lagune/hooks/regex.mjs -d <DIR>  # scans a directory
node ./.lagune/hooks/regex.mjs -f <FILE> # scans a single file
```

- `-d` and `-f` repeat to scan several targets at once.
- The header `Vulnerable regular expressions found:` **is the `unsafe` verdict for every pattern beneath it**, so each is a closed finding.
- The scan is best-effort, so keep reading the code for what it cannot reach: a pattern built across lines, or one hidden behind an alias.

#### How to check a pattern the scan missed

Use `-p` only for a pattern the scan could not reach. Quote each pattern so its slashes or backticks cannot break the command:

```bash
node ./.lagune/hooks/regex.mjs -p '<PATTERN>'
```

- `-p` cannot combine with `-f` or `-d`.
- Repeat `-p` to check several at once, one verdict printed per pattern, in order.
- `-l` sets a custom repetition limit (a non-negative integer) for patterns with many small repeats. It applies to every `-p` in the call, and to a scan:
  ```bash
  node ./.lagune/hooks/regex.mjs -p '<PATTERN>' -l <LIMIT>
  ```

#### How to read the verdict

Scan and `-p` report the same verdict: a pattern under the scan's `unsafe` header already carries it, and a `-p` check prints exactly one of three words:

- **`safe`**: the pattern is not ReDoS-prone by this check. It passes.
- **`unsafe`**: the pattern is ReDoS-prone (nested or stacked quantifiers that can backtrack explosively). Always treat it as a real risk, without exception.
- **`invalid regex`**: the pattern did not parse.

The hook exits non-zero when any pattern reads `unsafe`, and exits zero for `safe`, `invalid regex`, and a clean scan.

#### Common safer shapes

- **Anchor it when it fits.** Add `^` at the start and `$` at the end when the pattern is meant to match the whole input.
- **Reshape it for a linear engine when one fits.** Prefer a form with nothing to backtrack over (for example a negated class `"([^"]*)"` instead of `"(.*?)"`).
- **Bound the repetition.** Prefer a fixed range `{min,max}` (for example `\d{1,3}`) over an open-ended `.*`, `.+`, or `{1,}`.
- **Cap the input length** the pattern runs against, as a further guard.
- **When possible, avoid building the pattern at runtime.** Prefer a literal, fixed pattern over assembling one from variables or untrusted input.

## How to act on the result

- **In detect (detection):** an `unsafe` pattern is a finding. Describe it in plain language: what it is (a regular expression that can be made to hang on crafted input), why it matters (a denial-of-service risk), and the evidence (the function or area where the pattern lives). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the regex control holds only when the verdict is `safe`. An `unsafe` verdict means the risk is not closed: record it as such and point back to harden.
