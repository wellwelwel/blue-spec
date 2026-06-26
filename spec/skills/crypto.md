# Cryptography vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

This terrain is the **cryptography itself**: the algorithm that protects a secret, the randomness it draws on, and the key it depends on. The weakness shows only in the code, never at runtime. This terrain covers data **at rest** and the keys that protect it. Data **in transit** is `transport` (TLS), and **password** storage is `access-control` (a password hash like Argon2/bcrypt, never the reversible encryption discussed here).

### Weak or homegrown algorithms

The code protects data with a cipher an attacker can break. The clearest tell is a **custom or homegrown algorithm**: a scheme that never survived public cryptanalysis. Beyond that, named-but-broken primitives are the common finding:

- **Broken or obsolete primitives:** DES/3DES, RC4, Blowfish for new work, or MD5/SHA-1 used where collision or preimage resistance matters. For symmetric encryption prefer **AES** (key ≥ 128-bit, ideally 256), for asymmetric prefer elliptic curve (**Curve25519**) or RSA with a key ≥ 2048-bit.
- **Insecure cipher mode:** **ECB** leaks structure (identical plaintext blocks produce identical ciphertext). Prefer an **authenticated mode (GCM or CCM)**, which guarantees integrity and authenticity alongside confidentiality. An unauthenticated mode (CTR, CBC) must be paired with a separate MAC using Encrypt-then-MAC, never left to provide confidentiality alone.
- **RSA without random padding:** RSA encryption must enable **OAEP** padding. Textbook (no-padding) RSA is deterministic and falls to known-plaintext attacks.
- **Undersized keys** for the data's lifetime, or a key derived from a password without a proper key-derivation function.

A subtler variant is correct primitives **applied wrong**: a fixed or reused initialization vector, a nonce repeated under the same key, one key used for everything. The library should generate IVs and handle mode details, so code that sets them by hand is itself a smell.

Safer shape: use a vetted crypto library and let it choose modes and IVs, pick a current standard algorithm sized for how long the data must stay secret, never hand-roll a cipher or a mode, and encrypt as few fields as possible (the safest sensitive field is the one not stored).

### Predictable randomness

A security-sensitive value, an encryption key, an IV, a session ID, a CSRF or password-reset token, a nonce, is generated with a general-purpose (non-cryptographic) random source, so an attacker who guesses the generator's state can predict it. The unsafe call is the default in most languages and produces identical-looking output, so only the call site reveals it. Match the call against the language:

| Language             | Unsafe (do not use for security)                         | Cryptographically secure                                            |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| JavaScript / Node.js | `Math.random()`                                          | `crypto.randomBytes()`, `crypto.randomInt()`, `crypto.randomUUID()` |
| Python               | `random()`                                               | `secrets` module                                                    |
| Java                 | `java.util.Random`, `Math.random()`, `ThreadLocalRandom` | `java.security.SecureRandom`, `UUID.randomUUID()`                   |
| PHP                  | `rand()`, `mt_rand()`, `uniqid()`, `lcg_value()`         | `random_bytes()`, `random_int()`                                    |
| Ruby                 | `rand()`, `Random`                                       | `SecureRandom`                                                      |
| Go                   | `math/rand`                                              | `crypto/rand`                                                       |
| Rust                 | `XorShiftRng`                                            | `ChaChaRng` and the other `rand` CSPRNGs                            |
| .NET / C#            | `Random()`                                               | `RandomNumberGenerator`                                             |
| C                    | `rand()`, `random()`                                     | `getrandom(2)`                                                      |

One more trap: a **version-1 UUID** is not random (it encodes a timestamp and the host MAC address), and even a version-4 UUID is only as good as the generator behind it. Do not rely on a UUID as a secret unless it is drawn from a CSPRNG.

Safer shape: generate every security value from the language's cryptographically secure generator (CSPRNG) in the table, and reserve the fast non-secure generator for cosmetic uses (UI ordering, jitter).

### Exposed or unmanaged keys

The cryptography can be flawless and still worthless when the key is reachable: the key, not the algorithm, is the real secret. The recurring findings are where the key lives and how the code handles it:

- **Hardcoded or committed keys:** a key literal in the source, or checked into version control, is exposed to everyone with repo access and lives forever in history. Keys also should not sit in environment variables, which leak through diagnostic endpoints (`phpinfo()`) and `/proc/self/environ`.
- **No separation of keys from data:** when the key sits next to the data it protects (same database, same directory), one breach (an SQL injection, a directory traversal) takes both. Store keys apart from the data, ideally on a different system.
- **Plaintext key storage:** keys should be stored encrypted under a separate **key-encrypting key (KEK)**, with the data-encrypting key (DEK) protected by a KEK held elsewhere (envelope encryption). A KEK derived from a user passphrase via a KDF lets the passphrase change without re-encrypting the data.
- **One key for everything:** a single key reused across purposes (encryption, signing, authentication) widens the blast radius of any one compromise and can weaken the primitives. Give each purpose its own key and keep keys independent.

Safer shape: keep keys out of source, config, and version control, and store them in a dedicated facility, an HSM, a cloud KMS, or a secrets vault. Apply the handling above: separate keys from their data, encrypt stored keys under a KEK, and scope each key to one purpose.

## How to act on the result

- **In detect (detection):** each weak or misused construction from the risk blocks above (for example, a security value drawn from a non-cryptographic random source) is a finding. Record what it is (the construction being abused), why it matters (the data it protects can be recovered, the token predicted, or the key stolen), and the evidence (the call, the algorithm, the key's location). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when every axis above is sound at once: sound algorithm and mode, CSPRNG-sourced security values, and managed keys. Proving one axis is not closure: strong AES with a key committed to git is still open, and a perfectly stored key behind `Math.random()` tokens is still open. If an attacker can break the algorithm, predict a security value, or reach a key, the risk is not closed: record it and point back to harden.
