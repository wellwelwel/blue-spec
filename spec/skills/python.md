# Python-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: the official CPython docs (`pickle`, `yaml`/PyYAML, `tarfile`, `string`, the `-O` flag), Armin Ronacher's "Be careful with Python's new-style string format" (`str.format` traversal), Abdulraheem Khaled (Abdulrah33m), "Prototype Pollution in Python" (class pollution), and OWASP, <https://cheatsheetseries.owasp.org/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### Insecure deserialization via `pickle` (and `shelve`, `dill`, `jsonpickle`, `numpy.load`)

`pickle` reconstructs arbitrary objects, and an object controls its own reconstruction through `__reduce__`, which returns a callable and its arguments to invoke at load time. A class whose `__reduce__` returns `(os.system, ("command",))` runs that callable the moment `pickle.loads` deserializes attacker-controlled bytes, which is remote code execution. Common carriers are a Flask session cookie or an ML model file (`torch.load`, `paddle.load`) holding base64-encoded pickle.

The same property reaches what is built on, or modeled after, pickle:

- **`shelve`** is pickle-backed: `shelve.open` on an attacker-supplied `.db` deserializes on key access, not only at a top-level `loads`, so flag the file path, not just a literal `pickle.loads`.
- **`dill`** and **`jsonpickle`** use or mirror the pickle protocol and honor the same reconstruction hooks, so they cannot be made safe against arbitrary input.
- **`numpy.load`** runs pickle only with `allow_pickle=True` (defaulted to `False` in NumPy 1.16.3 for CVE-2019-6446), so a `.npy`/`.npz` load is a sink only with that flag. Treat `allow_pickle=True` on untrusted data as the finding, not every `np.load`.

Safer shapes, applied where they fit:

- **Never unpickle untrusted data.** Use a data-only format: `json` for simple structures, or `protobuf`/`msgpack`. JSON carries only basic types and cannot instantiate arbitrary objects.
- For ML models, prefer **safetensors**, which does not execute code on load.
- An **HMAC signature** verified with `hmac.compare_digest` before deserializing is integrity-only defense-in-depth, not a fix: it rejects payloads from anyone without the signing key, but the underlying `loads` stays a full RCE primitive if the key leaks or a trusted producer is compromised. Do not treat an HMAC wrapper as closing a pickle-on-untrusted-input finding. (Django removed `PickleSerializer` in 4.1 for this reason.)

`marshal` is a separate case: it does **not** honor `__reduce__` and has no callable-invocation step, so it is not an RCE sink by this mechanism. It is still documented as unsafe against malicious data for a narrower reason (parser memory-unsafety and loading code objects), so treat `marshal.loads` of untrusted bytes as unsafe, but not as a `(callable, args)` RCE.

### Class pollution (Python's "prototype pollution") via `__class__`, `__init__.__globals__`, `__base__`

Python exposes object internals as ordinary attributes: every object has `__class__`, every Python-level method has `__globals__` (the dict of its module-level globals), and class hierarchies are walkable via `__base__`/`__bases__`. A recursive "merge" or "set nested attribute" function that copies attacker-controlled keys into an object via `setattr`/`__setitem__` can therefore traverse from an instance into module globals and other classes' attributes.

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

Impact ranges from global-variable tampering to authentication bypass.

Safer shapes, applied where they fit:

- **Validate against a schema as the primary control** (`pydantic`, or `dataclasses` with explicit fields), reading known keys explicitly, so attacker-named attributes never reach a live object.
- **As a backstop, reject dunder keys** (those that begin and end with `__`: `__class__`, `__init__`, `__globals__`, `__base__`, `__dict__`, and the rest) in any recursive merge or mass-assignment routine. This guard must run at **every recursion level**, or nesting bypasses it, and it should refuse to recurse into non-data attributes rather than walk attribute chains.
- When you parse external JSON, keep it as plain `dict`/`list` and read the keys you expect, rather than merging it into objects.

### Format-string attribute traversal via `str.format()` / `.format_map()`

Python's `str.format()` mini-language (PEP 3101, shared by `.format_map()` and `string.Formatter`) lets the format string itself navigate its arguments: `"{0.attr}"` reads an attribute, `"{0[key]}"` reads an item. Because every Python-level method exposes `__init__.__globals__`, an attacker who controls the format string (not just the arguments) can read module globals and secrets:

```python
CONFIG = {'SECRET_KEY': 'super secret key'}
def format_event(fmt, event):
    return fmt.format(event=event)
# attacker supplies: "{event.__init__.__globals__[CONFIG].SECRET_KEY}"
```

Each hop must match how it is accessed: `[CONFIG]` reads an item, then `.SECRET_KEY` reads an attribute. The vector also needs the object's class to define its own Python-level `__init__` (or another Python-level method to traverse): a class inheriting `object.__init__` exposes a C-level wrapper with no `__globals__`. Impact is secret disclosure, which often escalates to forging signed tokens. An f-string is not affected: it is a fixed source literal, so its embedded expressions never come from runtime or attacker input.

Safer shape: never let untrusted input be the format string. Use `"{}".format(user_value)`, where the literal is fixed and the user value is an argument, not `user_string.format(...)`. When end users must supply templates, prefer f-strings or `string.Template`, whose grammar supports only `$name` substitution with no attribute access. If you must accept user-supplied format strings, subclass `string.Formatter` and override `get_field` to reject any field name containing `__` (Ronacher's `SafeFormatter`), but never-untrusted-format-string is the real fix.

### PyYAML `yaml.load` without SafeLoader

PyYAML implements YAML tags like `!!python/object/apply:os.system` and `!!python/object/new:...` that instantiate arbitrary Python objects and callables, and `yaml.load` historically defaulted to the full, unsafe loader.

`yaml.load(untrusted)` with `Loader=yaml.Loader`/`UnsafeLoader` (or `yaml.unsafe_load`, and historically `FullLoader`) yields RCE:

```yaml
!!python/object/apply:os.system ['id']
```

Real CVEs: CVE-2017-18342 (`yaml.load` ACE before 5.1), CVE-2020-1747 (the original `FullLoader`/`full_load` RCE via the object-constructor tag, fixed in 5.3.1), and CVE-2020-14343 (a bypass of that incomplete fix, fixed in 5.4).

Safer shape: use `yaml.safe_load` (or `yaml.load(data, Loader=yaml.SafeLoader)`), which constructs only standard scalars, sequences, and mappings and cannot instantiate Python objects. Upgrade PyYAML to ≥ 5.4, and in CI (Bandit/Semgrep) ban `yaml.load` without an explicit safe loader, plus `unsafe_load`, `Loader`, and `UnsafeLoader`. For `ruamel.yaml`, avoid `typ='unsafe'`.

### `assert` statements stripped under `-O`

CPython removes every `assert` statement (and `if __debug__:` block) from the compiled bytecode under `-O`/`-OO` or `PYTHONOPTIMIZE`. This is documented, intentional behavior. Any security check written as an `assert`, input validation, an auth check, an invariant, therefore silently vanishes in optimized production builds, so code that was safe in development becomes exploitable:

```python
def process(user):
    assert user.is_admin, "forbidden"   # gone under python -O
```

Safer shape: never use `assert` for runtime validation, input checking, or a security boundary. Use an explicit `if not condition: raise ...` with a proper exception. Reserve `assert` for tests and internal debugging invariants that are safe to disable.

### `tarfile.extractall` / `zipfile` path traversal (CVE-2007-4559, "tar slip")

`tarfile.extract`/`extractall` historically wrote each member's path as-is, so an entry named `../../etc/passwd` (or an absolute path, or a symlink) escaped the target directory, which frequently escalates to code execution: `tar.extractall(path)` on an untrusted archive overwrites arbitrary files.

Safer shapes, applied where they fit:

- On **Python 3.12+**, pass the extraction filter: `tar.extractall(path, filter="data")` (PEP 706). The `data` filter blocks absolute paths, `..` traversal, and unsafe symlinks/devices, and becomes the default in 3.14. This is the first-line fix.
- On older Pythons, validate each member: resolve the absolute path of the join, confirm it stays within the destination before extracting, reject members whose resolved path escapes, and skip symlinks/hardlinks pointing outside. Hand-rolled validation is easy to get subtly wrong (symlink members, absolute paths, `..` surviving normalization), so prefer the stdlib filter on 3.12+.
- The same care applies to `zipfile` ("Zip Slip") and to `shutil.unpack_archive`, which dispatches to both.

### Mutable default arguments (`def f(x=[])`)

Python evaluates a default argument value each time the `def` (or `lambda`) statement is executed, not on each call. For a module-level function that is effectively once, so a mutable default (list, dict, set, or any mutable object) is shared across every invocation:

```python
def add(item, items=[]):   # the same list every call
    items.append(item)
    return items
```

The security consequence is leakage: per-user data held in a shared mutable default crosses calls or requests to the wrong caller.

Safer shape: default to `None` and create the object inside the body.

```python
def add(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

Pylint `W0102` (`dangerous-default-value`) flags it.

### Django REST Framework: insecure-by-default settings

Unlike most of Django, DRF ships several open global defaults in the `REST_FRAMEWORK` settings namespace, so a view is unprotected until the project changes them. `DEFAULT_PERMISSION_CLASSES` defaults to `AllowAny`, so **every view is public unless the default is changed** or each view sets its own permission. `DEFAULT_THROTTLE_CLASSES` is empty, so there is no rate limiting. `DEFAULT_PAGINATION_CLASS` is unset, so a list endpoint returns the whole table, an unbounded query an attacker can turn into denial of service.

Safer shape: set `DEFAULT_PERMISSION_CLASSES` to a real default (for example `IsAuthenticated`), reserving `AllowAny` for genuinely public endpoints, and do not override `permission_classes` on a view without understanding the impact. Configure `DEFAULT_THROTTLE_CLASSES`/`DEFAULT_THROTTLE_RATES` for rate limiting (with a WAF as the outer layer), and set `DEFAULT_PAGINATION_CLASS` so list endpoints are bounded. (The authorization decision and the credential live on the `access-control` and `credential-endpoint` surfaces. This block is the DRF configuration that backs them.)

### Django / DRF framework defaults: keep them on, do not widen them

Django is secure by default, and the recurring finding is code or config that reopens a default. The template engine auto-escapes, and the `safe` filter / `mark_safe()` disable it, so reaching either with untrusted data is XSS (the browser-side detail is the `browser` surface, the Django-specific point is that the safe default was switched off). The other cases are settings or idioms that widen a default:

- `DEBUG = True` in production discloses stack traces, settings, and the `SECRET_KEY`. Keep `DEBUG = False` (and `DEBUG_PROPAGATE_EXCEPTIONS = False`), and never leave `ALLOWED_HOSTS` empty.
- A DRF `ModelSerializer` (or `ModelForm`) using `Meta.exclude` or `fields = "__all__"` is mass assignment: a denylist or "everything" exposes fields the user should not set. Use an explicit `Meta.fields` allowlist.
- Overriding a DRF view's `get_object()` without calling `self.check_object_permissions(request, obj)` reintroduces broken object-level authorization (IDOR): the object loads with no per-object check.
- The ORM's raw escape hatches, `raw()`, `extra()`, and `cursor.execute()`, bypass query parameterization. Never splice user input into them, parameterize (trace these through the `interpreter` surface).
- Hash passwords with Django's `make_password`/`check_password` (and configure `AUTH_PASSWORD_VALIDATORS`), never a hand-rolled hash.

Safer shape: leave the framework's defaults on and tighten, never loosen, them. Render through auto-escaping (avoid `safe`/`mark_safe` on untrusted data), keep `DEBUG = False` with `ALLOWED_HOSTS` set, allowlist serializer fields, check object permissions on every object fetch, and keep raw SQL parameterized. Run `manage.py check --deploy`, which audits the deployment settings (`DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`, secure cookies, SSL redirect, HSTS), and resolve its warnings.

## How to act on the result

- **In detect (detection):** each pattern above that you confirm is a finding. Describe it in plain language: what it is (the Python behavior being abused, or a Django/DRF default left open, for example arbitrary code execution from an unpickled payload), why it matters (the concrete impact), and the evidence (the function, setting, or area where it lives). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the unsafe pattern is gone or properly guarded by the safer shape from its risk block. An HMAC wrapper around pickle, or a top-level-only dunder check, does not close the risk. If the dangerous pattern still reaches untrusted input, record it as not closed and point back to harden.
