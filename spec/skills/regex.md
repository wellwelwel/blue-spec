# Regex-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### ReDoS (Regular expression Denial of Service)

On a crafted input, the pattern takes an exploding amount of time to match, stalling or overloading the system.

#### How to check a pattern

Blue Spec ships a deterministic checker. Run it from the project root, passing the pattern as a single argument so its quotes or backticks cannot break the command:

```bash
node ./.bluespec/hooks/regex.mjs '<PATTERN>'
```

It accepts an optional second argument, a custom repetition limit (a non-negative integer), for patterns with many small repeats:

```bash
node ./.bluespec/hooks/regex.mjs '<PATTERN>' <LIMIT>
```

Pass the pattern's source only, without the surrounding slashes or flags. Check each suspicious pattern you found in the code, one call per pattern.

#### How to read the verdict

The checker prints exactly one of three words:

- **`safe`**: the pattern is not ReDoS-prone by this check. It passes.
- **`unsafe`**: the pattern is ReDoS-prone (nested or stacked quantifiers that can backtrack explosively). Always treat it as a real risk, without exception.
- **`invalid regex`**: the pattern did not parse.

#### Common safer shapes

- **Anchor it when it fits.** Add `^` at the start and `$` at the end when the pattern is meant to match the whole input.
- **Reshape it for a linear engine when one fits.** Prefer a form with nothing to backtrack over (for example a negated class `"([^"]*)"` instead of `"(.*?)"`).
- **Bound the repetition.** Prefer a fixed range `{min,max}` (for example `\d{1,3}`) over an open-ended `.*`, `.+`, or `{1,}`.
- **Cap the input length** the pattern runs against, as a further guard.
- **When possible, avoid building the pattern at runtime.** Prefer a literal, fixed pattern over assembling one from variables or untrusted input.

## How to act on the result

- **In detect (detection):** an `unsafe` pattern is a finding. Describe it in plain language: what it is (a regular expression that can be made to hang on crafted input), why it matters (a denial-of-service risk), and the evidence (the function or area where the pattern lives). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the regex control holds only when the verdict is `safe`. An `unsafe` verdict means the risk is not closed: record it as such and point back to harden.
