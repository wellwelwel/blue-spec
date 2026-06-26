# JavaScript-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### Remote code execution (RCE)

`eval`, the `Function` constructor, `setTimeout`/`setInterval` called with a string, and (in Node) `vm` run without real isolation, all turn data into executable code. Any one of them reached by untrusted input is arbitrary code execution.

Safer shape: remove the dynamic path entirely. Parse with `JSON.parse`, dispatch through a lookup map keyed by an allowlisted value, and pass functions (never strings) to the timers.

The same applies wherever the code spawns a subprocess. In Node, `child_process.exec` and `execSync` run their argument through a shell, so any untrusted value spliced into the command string becomes shell injection, and a reachable one is full command execution. `spawn`/`execFile` with a string and `shell: true` carry the same risk.

Safer shape: never build a shell command from input. Call `execFile`/`spawn` with the binary and an argument array (no `shell` option), so the input stays a single argument and is never parsed as shell syntax. Keep the binary fixed and allowlist it rather than letting input choose what to run.

A related Node footgun is the `fs` module fed an unsanitized path: a value that flows into `readFile`, `createReadStream`, `require`, or any path argument can climb out of the intended directory (`../`, an absolute path, a null byte) and read or write files the app never meant to expose. `require(userValue)` additionally executes whatever it resolves to.

Safer shape: resolve the path against a fixed base directory and confirm the result still sits inside it before opening it, never pass input to `require`, and treat the file system as a sink that needs the same allowlisting as a subprocess.

### Prototype pollution

A bracket assignment with a non-literal key the application does not fully control can reach `__proto__`, `constructor`, or `prototype` and mutate `Object.prototype`, so every object in the process inherits the injected property. It enters through a deep merge, a recursive `Object.assign`-style copy, or building an object from parsed user input (a query string, JSON body, or config), but also through any cache, registry, or lookup keyed by a value that flows in from upstream. The dangerous operation is the same wherever it happens: a dynamic key assigned without guarding those three names.

Safer shapes, applied where they fit:

- **Prefer a `Map` or `Set`** over an object literal when the keys come from anywhere untrusted. A `Map` keyed by an arbitrary string has no prototype chain to walk, so `__proto__` is just another key.
- **Use a null-prototype object** as the target when an object is required, so there is no prototype to pollute:

  ```ts
  Object.create(null);
  ```

- **Guard the dangerous keys explicitly** when a plain object must be kept, defining `__proto__` as an own property instead of letting the assignment walk the prototype:

  ```ts
  export const safeObject = (
    target: Record<string, unknown>,
    key: string,
    value: unknown
  ): void => {
    if (key === '__proto__') {
      Object.defineProperty(target, key, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      target[key] = value;
    }
  };
  ```

  Reject or skip `constructor` and `prototype` keys on the same path.

- **Harden the runtime as defense in depth.** `Object.freeze`/`Object.seal` on a built-in prototype stops it being mutated, but only where no dependency mutates that prototype itself, so test before relying on it. In Node, `--disable-proto=delete` removes the `__proto__` accessor entirely. Both are backstops, not the fix: `constructor.prototype` pollution survives them, so the safe target and the key guard above remain the primary control.

### Unsafe deserialization and parser reviver abuse

`JSON.parse` with a `reviver`, or any library that revives typed objects from untrusted JSON, can run attacker-influenced logic during parsing or rebuild a dangerous object. Treat a reviver that touches prototypes or instantiates classes from the payload as a finding.

### Loose-equality and coercion bypass

`==` and implicit coercion let crafted input satisfy a check it should fail (for example `0 == '0e...'`, array-to-string coercion, or `Number`/`parseInt` accepting trailing garbage). A security decision (an auth comparison, a token check, an amount validation) riding on a loose comparison or a coerced value can be gamed.

Safer shape: use `===`, compare validated and normalized values, and bound-check parsed numbers.

### Event-loop blocking and unbounded resource use (Node)

Node runs application code on a single thread, so any synchronous CPU-bound work, a synchronous crypto call, a `JSON.parse` of a huge body, a catastrophic regex (see the `regex` sub-skill for ReDoS), blocks every other request until it finishes. An attacker who can trigger that work, or simply send an unbounded request body, turns one request into a process-wide denial of service: an oversized body can exhaust memory or disk before parsing it even begins to block.

Safer shape: cap request body size (and validate the real content type, since an attacker can lie in the `Content-Type` header to slip past a per-type limit), keep heavy work off the event loop (asynchronous APIs, worker threads, a queue), and shed load when the loop falls behind (return `503` past a latency threshold) rather than letting it stall.

### Asynchronous ordering and callback races (Node)

Mixing synchronous calls with asynchronous ones lets code run before the callback it depends on completes. The classic shape is a synchronous `fs.unlinkSync` (or any sync step) that fires before an async `fs.readFile` callback finishes, so the file is gone before it is read. When the ordering carries a security meaning, an authorization decided inside a callback while the guarded action runs synchronously outside it, the action can execute before the check resolves.

Safer shape: chain dependent steps so each runs only after the previous resolves, with `async`/`await` or a flat promise chain, never a sync call racing an async one. Keep operations that must happen in order inside the same continuation, and let errors propagate through `.catch`/`try` rather than dropping them.

### Node runtime hardening

How the Node process is launched and how it handles failure are controls in their own right, set in startup config and error handlers rather than in business logic.

Safer shapes, applied where they fit:

- On `uncaughtException` (and an `EventEmitter` `'error'` with no listener), clean up resources, log server-side, and exit rather than resume: resuming leaves the process in an unknown state. Show the user a generic message, never the stack trace that discloses internals.
- Run with least privilege using Node's permission model (`node --permission`, scoping `--allow-fs-read`/`--allow-fs-write` to the directories actually needed, and `--allow-child-process` only when required), so a single file-path or `child_process` bug cannot reach the whole machine. Symlinks are followed even outside allowed paths, so keep relative symlinks out of allowed directories.
- Enable strict mode so silent legacy footguns become real errors, and keep dependencies patched (`npm audit`, OWASP Dependency-Check, RetireJS), since a vulnerable package is your vulnerability.

## How to act on the result

- **In detect (detection):** each pattern you confirm is a finding. Describe it in plain language: what it is (the JavaScript behavior being abused), why it matters (the concrete impact, for example process-wide pollution, arbitrary code execution, a path that escapes its directory, a single request that stalls the whole process, or a callback race that runs an action before its check), and the evidence (the function or area where it lives). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the unsafe pattern is gone or properly guarded by the safer shape for its risk. If the dangerous pattern still reaches untrusted input, the risk is not closed: record it as such and point back to harden.
