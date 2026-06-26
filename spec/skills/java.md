# Java-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/> and <https://owasp.org/www-community/attacks/>, with JEP 290 ("Filter Incoming Serialization Data") and the `ysoserial` gadget-chain research tool.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### Insecure native deserialization (`ObjectInputStream.readObject`) gadget chains

Java's built-in serialization reconstructs any `Serializable` class on the classpath and runs that class's custom `readObject` during reconstruction, before any application validation. Attackers chain "gadget" classes (Apache Commons Collections, Groovy, and others) whose `readObject`/`hashCode`/`equals`/comparator side effects culminate in `Runtime.exec`, the classic Java remote code execution. The dangerous pattern is a single line:

```java
Object obj = new ObjectInputStream(untrusted).readObject();
```

Attacker-controlled bytes reaching it yield RCE, as `ysoserial` demonstrates. The source is often not an obvious user upload but a trusted-looking component: an RMI endpoint, a JMX channel, a cache, a session store, a message body. Trace the byte source, not just a literal `readObject` call: `readUnshared` and library wrappers that deserialize internally carry the same risk. This is specific to Java's object-graph serialization rebuilding live objects, JSON, Protobuf, and XML parsers that build only plain data structures do not run arbitrary classes' code on load.

Safer shapes, applied where they fit:

- **Do not use Java native serialization for untrusted data.** Delete `readObject`/`writeObject` usage and accept JSON, Protobuf, or XML through a data-only parser instead.
- Where native serialization must remain, set a **JEP 290 deserialization filter** (`ObjectInputFilter`) with a strict **allowlist** of expected classes, process-wide via the `jdk.serialFilter` system property or per-stream via `ObjectInputStream.setObjectInputFilter`. A blocklist of known gadgets is weaker, since new chains appear: defense in depth, not a fix.
- Where a filter does not fit, override `resolveClass` in a look-ahead stream (a `LookAheadObjectInputStream`) to reject any class outside the expected set:

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

  `resolveClass` runs before reconstruction, so the rejection lands before any gadget `readObject` fires. Apache Commons IO's `ValidatingObjectInputStream` and SerialKiller enforce the same allowlist.

- **Keep dependencies patched** (OWASP Dependency-Check) so the allowlist is not the only line against a known gadget chain. Where untrusted deserialization is unavoidable, run it in a sandboxed, low-privilege service.
- For a class that must never be deserialized, declare a `private void readObject(ObjectInputStream in)` that throws `java.io.InvalidClassException`, and mark sensitive fields `private transient` so they are neither restored nor exposed in the stream. Annotate hooks with `@Serial` and keep `readObject`/`writeObject` `private`, so they stay real serialization hooks rather than overridable methods.

### Unsafe mobile code: mutable shared state and constructor-bypassing extension

When a class shares a JVM with code an attacker can influence (a plugin, an agent, any class loaded into the runtime), the language's own visibility and extensibility rules become an attack surface. Unlike the deserialization risk above, no untrusted bytes are required, only a class whose design leaves its state mutable or its construction bypassable. Two patterns recur.

A **non-final public field** (CWE-493) is mutable state any reachable code can overwrite. A `public URL server_addr` left non-`final` can be repointed by another class in the same runtime, redirecting the application after construction.

Safer shape: declare fields holding trusted configuration or security-relevant references `final`, with the narrowest visibility (`private` plus accessors) over `public`. A value that must not change after construction must be `final` so no other code can reassign it.

An **object hijack** (CWE-491) abuses a construction path that skips the constructor's validation. A `public`, non-`final`, `Cloneable` class with a `public clone()` can be subclassed, and the subclass mints instances through any path that produces an object without running the constructor (`clone()`, deserialization, reflection), so an attacker substitutes a manipulated instance for a legitimate one.

Safer shape: make sensitive classes `final` so they cannot be subclassed, and do not expose a `public clone()` on a class that holds invariants. Where a class must stay extensible, enforce its invariants on every construction path, not only the constructor, and guard `clone()` or remove `Cloneable`. Treat any object produced without its constructor as untrusted until its invariants are re-checked.

### Injection through string-built commands and queries

Injection is a cross-language surface (the `interpreter` sub-skill covers SQL, OS command, XPath, NoSQL, LDAP, and log injection generically), but Java has its own safe idioms and one Java-specific variant: **JPA / JPQL injection**, concatenating untrusted input into a string passed to `EntityManager.createQuery`, the JPQL equivalent of SQL injection with the same impact. The rule across all of these: never build the command or query by string concatenation, use the API the stack already provides.

Safer shape: parameterize. Use `PreparedStatement` with `?` placeholders for SQL, named parameters with `setParameter` for JPQL, an `XPathVariableResolver` for XPath, and the driver's expression builder (MongoDB's `Bson` filters) for NoSQL. For system actions, prefer the Java API over shelling out: `InetAddress.isReachable` instead of `ping`, file APIs instead of `Runtime.exec`. When untrusted data must reach HTML, encode with the OWASP Java Encoder and sanitize allowed markup with the OWASP Java HTML Sanitizer. Trace each finding through the `interpreter` surface, this block only names the Java APIs that close it.

### Log injection through the logging API

Building a log line by concatenating untrusted input lets an attacker inject CR/LF and forge or split log entries (CWE-93).

Safer shape: use parameterized logging with a compile-time-constant message pattern, `logger.warn("Login failed for user {}.", username)`, never `logger.warn("... " + username)`, so the framework, not the attacker, controls structure. Prefer a structured layout (Log4j2 JSON Template Layout, Logback `JsonEncoder`) and cap field size (`maxStringLength`) so one field cannot smuggle line breaks or unbounded data. Apply the usual XSS encoding when logs are later rendered in a browser.

### Weak or hand-rolled cryptography (JCA/JCE)

The raw JCA/JCE primitives make the common mistakes easy: a default or ECB cipher mode, a reused or predictable nonce/IV, a non-cryptographic random source, a hard-coded or poorly stored key, a home-grown algorithm. Any of these silently weakens encryption that looks correct.

Safer shapes, applied where they fit:

- **Never write your own cryptographic primitive**, and avoid hand-using JCA/JCE. Prefer a vetted high-level library (Google Tink) or your platform's managed crypto service.
- When JCA/JCE is unavoidable, use an authenticated mode (`AES/GCM/NoPadding`), generate a **unique nonce per encryption** with `SecureRandom` (never reuse a nonce under the same key), and use a strong key size (AES-256). Have the design and code reviewed by someone with cryptography expertise.
- Draw all keys, nonces, IVs, and salts from `SecureRandom`, never `java.util.Random` or `Math.random`. Store keys outside the code (a secret manager or platform keystore), and keep the design agile so an algorithm can be rotated later. Follow the OWASP Cryptographic Storage guidance for algorithm choices.

## How to act on the result

- **In detect (detection):** each pattern in the body that you confirm is a finding. Describe it in plain language: what it is (for example, untrusted bytes reaching Java native deserialization), why it matters (the concrete impact, such as remote code execution via a gadget chain ending in `Runtime.exec`), and the evidence (the call and its untrusted input, or the field/class declaration, and the area where it lives). Trace the source to the sink, and track an injection finding through the `interpreter` surface. It flows through detect's normal steps like any other finding.
- **In verify (proof):** the control holds only when the unsafe path is gone or properly guarded, per the Safer shapes in the body: native serialization replaced or allowlist-filtered before reconstruction, a security-relevant field made `final`, a sensitive class made `final` or its `clone()` guarded, a query/command/log line parameterized, and crypto on a vetted library or an authenticated mode with a unique `SecureRandom` nonce. A blocklist of known gadgets, an unpatched dependency with a live gadget chain, a field still mutable from outside, a still-concatenated query or log line, or a reused nonce, does not close the risk on its own. If any unsafe path still reaches untrusted input, record it as not closed and point back to harden.
