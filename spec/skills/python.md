# Python-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: the official CPython docs (`pickle`, `yaml`/PyYAML, `tarfile`, `string`, the `-O` flag), Armin Ronacher's "Be careful with Python's new-style string format" (`str.format` traversal), and Abdulraheem Khaled (Abdulrah33m), "Prototype Pollution in Python" (class pollution).

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### Insecure deserialization via `pickle` (and `shelve`, `dill`, `jsonpickle`, `numpy.load`)

`pickle` is designed to reconstruct arbitrary objects, and it lets an object control its own reconstruction through `__reduce__`, which returns a callable and its arguments to be invoked at load time. This is a documented stdlib feature, not a bug: the docs warn the module is not secure and to only unpickle data you trust. Any class can define `__reduce__` to return `(os.system, ("command",))`, so when `pickle.loads` deserializes attacker-controlled bytes that callable executes immediately, which is remote code execution. A common shape is a Flask session cookie or an ML model file (`torch.load`, `paddle.load`) that is base64-encoded pickle.

The same execution-by-design property reaches the things built on, or modeled after, pickle:

- **`shelve`** is pickle-backed: `shelve.open` on an attacker-supplied `.db` deserializes on key access, not only at a top-level `loads`, so flag the file path, not just a literal `pickle.loads`.
- **`dill`** and **`jsonpickle`** use or mirror the pickle protocol and honor the same reconstruction hooks. They cannot be made safe against arbitrary input.
- **`numpy.load`** runs pickle only when `allow_pickle=True` (the default was flipped to `False` in NumPy 1.16.3 in response to CVE-2019-6446), so a `.npy`/`.npz` load is a sink only with that flag set. Treat `allow_pickle=True` on untrusted data as the finding, not every `np.load`.

Safer shapes, applied where they fit:

- **Never unpickle untrusted data.** Use a data-only format: `json` for simple structures, or `protobuf`/`msgpack`. JSON supports only basic types and cannot instantiate arbitrary objects.
- For ML models, prefer a format like **safetensors** that does not execute code on load.
- An **HMAC signature** verified with `hmac.compare_digest` before deserializing is integrity-only defense-in-depth, not a fix: it rejects payloads from anyone without the signing key, but the underlying `loads` is still a full RCE primitive if the key leaks or a trusted producer is compromised. Do not treat an HMAC wrapper as closing a pickle-on-untrusted-input finding. (Django deprecated its `PickleSerializer` in 4.1 and removed it in 5.0 for this reason.)

Note `marshal` is a separate case: it does **not** honor `__reduce__` (it cannot even serialize such an object) and has no callable-invocation step, so it is not an RCE sink by this mechanism. It is still documented as unsafe against maliciously constructed data for a narrower reason (parser memory-unsafety and loading code objects), so do not treat `marshal.loads` of untrusted bytes as safe, but do not flag it as a `(callable, args)` RCE either.

### Class pollution (Python's "prototype pollution") via `__class__`, `__init__.__globals__`, `__base__`

Python exposes deep object internals as ordinary attributes: every object has `__class__`, every Python-level method has `__globals__` (a reference to the dict holding the function's module-level globals), and class hierarchies are walkable via `__base__`/`__bases__`. A recursive "merge" or "set nested attribute" function that copies attacker-controlled keys into an object via `setattr`/`__setitem__` can therefore traverse from an instance into module globals and other classes' attributes.

The canonical, demonstrated payload nests `__class__.__init__.__globals__` to overwrite the default value of another function's keyword-only argument (its `__kwdefaults__`):

```json
{
  "__class__": {
    "__init__": {
      "__globals__": {
        "execute": { "__kwdefaults__": { "command": "echo Polluted" } }
      }
    }
  }
}
```

Impact ranges from global-variable tampering to authentication bypass. Reaching a Flask app's `secret_key` through `__globals__` and `sys.modules` to forge privileged session cookies is a plausible escalation, but in the source research it was an unexplored idea, not a working exploit: the only confirmed impact there was denial of service, and the `sys.modules` hop depends on `sys` being reachable in the target module's globals. Treat it as a hypothetical gadget, not a demonstrated one.

Safer shapes, applied where they fit:

- **Validate against a schema as the primary control** (`pydantic`, or `dataclasses` with explicit fields), reading known keys explicitly, so attacker-named attributes never reach a live object.
- **As a backstop, reject dunder keys** (keys that begin and end with `__`: `__class__`, `__init__`, `__globals__`, `__base__`, `__dict__`, and the rest) in any recursive merge or mass-assignment routine. This guard must run at **every recursion level**, not only the top, or nesting bypasses it, and it should refuse to recurse into non-data attributes rather than walk attribute chains.
- Where you parse external JSON, keep it as plain `dict`/`list` and read the keys you expect, rather than merging it into objects.

### Format-string attribute traversal via `str.format()` / `.format_map()`

Python's `str.format()` mini-language (PEP 3101, shared by `.format_map()` and `string.Formatter`) lets the format string itself navigate attributes and items of its arguments: `"{0.attr}"` reads an attribute, `"{0[key]}"` reads an item. Because every Python-level method exposes `__init__.__globals__`, an attacker who controls the format string (not just the arguments) can read module globals and secrets:

```python
CONFIG = {'SECRET_KEY': 'super secret key'}
def format_event(fmt, event):
    return fmt.format(event=event)
# attacker supplies: "{event.__init__.__globals__[CONFIG].SECRET_KEY}"
```

The final hop must match how it is accessed: `[CONFIG]` reads an item (the globals dict), then `.SECRET_KEY` reads an attribute (mixing them, ending in `[SECRET_KEY]` against a non-dict, raises `TypeError`). The vector also needs the object's class to define its own Python-level `__init__` (or another Python-level method to traverse): a class inheriting `object.__init__` exposes a C-level wrapper with no `__globals__`. Impact is disclosure of secrets, which often escalates to forging signed tokens. This is distinct from f-strings: an f-string is a fixed source literal, so its embedded expressions are never sourced from runtime or attacker input.

Safer shape: never let untrusted input be the format string. Use `"{}".format(user_value)` where the literal is fixed and the user value is an argument, not `user_string.format(...)`. When end users must supply templates, prefer f-strings or `string.Template`, whose grammar only supports `$name` substitution and has no attribute access. If you genuinely must accept user-supplied format strings, subclass `string.Formatter` and override `get_field` to reject any field name containing `__` (Ronacher's `SafeFormatter`), but the never-untrusted-format-string rule is the real fix.

### PyYAML `yaml.load` without SafeLoader

PyYAML implements YAML tags like `!!python/object/apply:os.system` and `!!python/object/new:...` that instantiate arbitrary Python objects and callables. `yaml.load` historically defaulted to the full, unsafe loader.

`yaml.load(untrusted)` with `Loader=yaml.Loader`/`UnsafeLoader` (or `yaml.unsafe_load`, and historically `FullLoader`) yields RCE:

```yaml
!!python/object/apply:os.system ['id']
```

Real CVEs: CVE-2017-18342 (`yaml.load` ACE before 5.1), CVE-2020-1747 (the original `FullLoader`/`full_load` RCE via the object-constructor tag, fixed in 5.3.1), and CVE-2020-14343 (a bypass of that incomplete fix, fixed in 5.4).

Safer shape: use `yaml.safe_load` (or `yaml.load(data, Loader=yaml.SafeLoader)`), which constructs only standard scalars, sequences, and mappings and cannot instantiate Python objects. Upgrade PyYAML to ≥ 5.4 and ban `yaml.load` without an explicit safe loader, plus `unsafe_load`, `Loader`, and `UnsafeLoader`, in CI (Bandit/Semgrep rules). For `ruamel.yaml`, avoid `typ='unsafe'`.

### `assert` statements stripped under `-O`

CPython removes every `assert` statement (and `if __debug__:` block) from the compiled bytecode when run with `-O`/`-OO` or `PYTHONOPTIMIZE`. This is documented, intentional behavior. Any security check written as an `assert`, input validation, an auth check, an invariant, therefore silently vanishes in optimized production builds, so code that was safe in development becomes exploitable:

```python
def process(user):
    assert user.is_admin, "forbidden"   # gone under python -O
```

Safer shape: never use `assert` for runtime validation, input checking, or a security boundary. Use an explicit `if not condition: raise ...` with a proper exception. Reserve `assert` for tests and internal debugging invariants that are safe to disable. Bandit `B101` (`assert_used`) flags every `assert`, so it cannot tell production from test code on its own and is suppressed by path skips.

### `tarfile.extractall` / `zipfile` path traversal (CVE-2007-4559, "tar slip")

`tarfile.extract`/`extractall` historically wrote each member's path as-is with no sanitization, so an entry named `../../etc/passwd` (or an absolute path, or a symlink) escaped the target directory. This was documented-but-unpatched for about 15 years (CVE-2007-4559). In a September 2022 re-discovery, Trellix found Python's `tarfile` in use across roughly 588,000 unique repositories and estimated that about 61% of those examined, over 350,000 repositories, would be vulnerable. A separate follow-up effort patched 61,895 projects. The bug frequently escalates to code execution. `tar.extractall(path)` on an untrusted archive overwrites arbitrary files.

Safer shapes, applied where they fit:

- On **Python 3.12+**, pass the extraction filter: `tar.extractall(path, filter="data")` (PEP 706). The `data` filter blocks absolute paths, `..` traversal, and unsafe symlinks/devices. It becomes the default in Python 3.14. This is the first-line fix.
- On older Pythons, validate each member: resolve the absolute path of the join and confirm it stays within the destination before extracting, reject members whose resolved path escapes, and skip symlinks/hardlinks pointing outside. Hand-rolled validation is easy to get subtly wrong (symlink members, absolute paths, `..` surviving normalization), so prefer the stdlib filter on 3.12+.
- The identical care applies to `zipfile` ("Zip Slip") and to `shutil.unpack_archive`, which dispatches to both.

### Mutable default arguments (`def f(x=[])`)

Python evaluates a default argument value each time the `def` (or `lambda`) statement is executed, not on each call. For a module-level function that is effectively once, so a mutable default (list, dict, set, or any mutable object) is shared across every invocation:

```python
def add(item, items=[]):   # the same list every call
    items.append(item)
    return items
```

This is primarily a correctness footgun, but it has real security and privacy consequences: state leaks across calls or requests. Per-user data held in a shared mutable default can surface to the wrong caller (an illustrative class of bug, not a single cited incident).

Safer shape: default to `None` and create the object inside the body.

```python
def add(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

Pylint `W0102` (`dangerous-default-value`) flags it.

## How to act on the result

- **In detect (detection):** each pattern you confirm is a finding. Describe it in plain language: what it is (the Python behavior being abused), why it matters (the concrete impact, for example arbitrary code execution from an unpickled payload, secret disclosure from a user-controlled format string, or a security check that vanishes under `-O`), and the evidence (the function or area where it lives). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the unsafe pattern is gone or properly guarded: untrusted data parsed with a data-only format instead of pickle, a schema validating mass-assignment with the dunder reject running at every level, a fixed literal format string, `yaml.safe_load`, an explicit `raise` instead of `assert`, `filter="data"` on extraction, and a `None` sentinel for defaults. An HMAC wrapper around pickle, or a top-level-only dunder check, does not close the risk. If the dangerous pattern still reaches untrusted input, record it as not closed and point back to harden.
