# Java-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, "Deserialization Cheat Sheet" (`resolveClass` allowlist, `transient`, the `readObject`-that-throws pattern), JEP 290, "Filter Incoming Serialization Data" (`ObjectInputFilter`, `jdk.serialFilter`), and the `ysoserial` gadget-chain research tool.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### Insecure native deserialization (`ObjectInputStream.readObject`) gadget chains

Java's built-in serialization reconstructs any class implementing `Serializable`, and it invokes that class's custom `readObject` during reconstruction. `ObjectInputStream.readObject()` therefore deserializes _any_ serializable class on the classpath, before any application validation runs. Attackers chain "gadget" classes (Apache Commons Collections, Groovy, and others) whose `readObject`/`hashCode`/`equals`/comparator side-effects culminate in `Runtime.exec`, the classic Java-specific remote code execution. The dangerous pattern is a single line:

```java
Object obj = new ObjectInputStream(untrusted).readObject();
```

Reaching it with attacker-controlled bytes yields RCE, demonstrated by tools like `ysoserial`. The danger is often not an obvious user upload but a trusted-looking component: an RMI endpoint, a JMX channel, a cache, a session store, or a message body. Anything that injects attacker-influenced bytes into a stream that ends at `readObject()` is the risk. Treat the byte source, not just a literal `readObject` call, as the thing to trace: `readUnshared`, and library wrappers that deserialize internally, carry the same risk.

This is distinct from text formats. JSON, Protobuf, and XML parsers that build only plain data structures do not invoke arbitrary classes' code on load. The risk here is specific to Java's object-graph serialization reconstructing live objects.

Safer shapes, applied where they fit:

- **Prefer not to use Java native serialization for untrusted data at all.** Use JSON, Protobuf, or XML with a safe, data-only parser. The cleanest fix is to delete `readObject`/`writeObject` usage entirely and stop accepting serialized object graphs.
- Where native serialization must remain, set a **JEP 290 deserialization filter** (`ObjectInputFilter`) with a strict **allowlist** of expected classes. Apply it process-wide via the `jdk.serialFilter` system property, or per-stream via `ObjectInputStream.setObjectInputFilter`. An allowlist (accept only known-good classes) is the control. A blocklist of known gadget classes is weaker: new gadget chains appear, so it is defense-in-depth, not a fix.
- Where a filter does not fit, implement a **`LookAheadObjectInputStream`** that overrides `resolveClass` to reject any class outside the expected set:

  ```java
  @Override
  protected Class<?> resolveClass(ObjectStreamClass desc)
      throws IOException, ClassNotFoundException {
    if (!ALLOWED.contains(desc.getName())) {
      throw new InvalidClassException(desc.getName(), "Unauthorized deserialization attempt");
    }
    return super.resolveClass(desc);
  }
  ```

  `resolveClass` runs before the object is reconstructed, so the rejection lands before any gadget `readObject` fires. Whitelist beats blacklist here too.

- **Keep dependencies patched** (OWASP Dependency-Check) to remove libraries with known gadget chains, so a present allowlist is not the only line of defense. Apache Commons IO's `ValidatingObjectInputStream` and SerialKiller offer allowlist-enforcing streams. Where deserialization of untrusted data is unavoidable, run it in a sandboxed, low-privilege service.
- For a class that must never be deserialized at all, declare a `private void readObject(ObjectInputStream in)` that throws `java.io.InvalidClassException`, and mark sensitive fields `private transient` so they are neither restored from nor exposed in the stream. Annotate serialization hooks with `@Serial`, and keep `readObject`/`writeObject` `private` so they are real serialization hooks, not ordinary overridable methods.

## How to act on the result

- **In detect (detection):** each pattern you confirm is a finding. Describe it in plain language: what it is (untrusted bytes reaching Java native deserialization), why it matters (the concrete impact, remote code execution via a gadget chain that ends in `Runtime.exec`), and the evidence (the call and the stream's byte source, the function or area where it lives). Trace the source to the sink: a `readObject`/`readUnshared` whose input is attacker-influenced, even through a trusted-looking component, is the finding. It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the unsafe path is gone or properly guarded: native serialization replaced by a data-only format, or a strict allowlist enforced by a JEP 290 `ObjectInputFilter` or a `resolveClass` look-ahead stream that rejects unexpected classes before reconstruction. A blocklist of known gadgets, or an unpatched dependency with a live gadget chain, does not close the risk on its own. If untrusted bytes still reach `readObject` unfiltered, record it as not closed and point back to harden.
