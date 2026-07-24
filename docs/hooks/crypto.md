# crypto hook: Detect weak cryptography

> Sweep a codebase for weak cryptographic primitives, or score a single snippet, from the command line.

Canonical: https://lagune.ai/docs/hooks/crypto
Last updated: 2026-07-24

The `crypto` hook flags **weak cryptographic primitives** at the call site: a deprecated cipher, an insecure mode, or a broken digest. It is **language-aware**, reading each file by its own rules so a Python construct is never flagged on a Rust file, and it is the deterministic engine behind the [`crypto` sub-skill](https://lagune.ai/docs/commands/skills), which you can run yourself in **scan** or **check** mode.

## Run it

**Scan the codebase**

```bash
node ./.lagune/hooks/crypto.mjs           # scans the whole project
node ./.lagune/hooks/crypto.mjs -d src    # scans a directory
node ./.lagune/hooks/crypto.mjs -f hash.ts # scans a single file
```

**Check a snippet**

```bash
node ./.lagune/hooks/crypto.mjs -l javascript -p 'createCipher("aes-256-cbc", k)' # => weak
node ./.lagune/hooks/crypto.mjs -l python -p 'hashlib.md5(data)'                   # => review
node ./.lagune/hooks/crypto.mjs -l go -p 'sha256.Sum256(data)'                     # => safe
```

The scan prints up to two sections. **Weak cryptography found** is the finding set (DES/3DES/RC4/Blowfish/RC2, ECB mode): each is a broken cipher primitive, so the hook exits non-zero. **Cryptography to review manually** is a lead set it cannot judge alone: an MD5/SHA-1 digest (broken for security use, but legitimate as a plain checksum, so intent decides), a non-cryptographic RNG in a security context, or a timing-unsafe comparison. A clean run prints `no weak cryptography found`.

## How to read the verdict

| Verdict   | Meaning                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `weak`    | The snippet uses a broken cipher primitive (DES/3DES, RC4, Blowfish, RC2, or ECB mode).               |
| `review`  | An intent-dependent primitive: an MD5/SHA-1 digest, or a non-cryptographic RNG in a security context. |
| `safe`    | The snippet uses crypto, and no weak primitive was found.                                             |
| `invalid` | The snippet contains no recognizable cryptographic construct to judge.                                |

### CLI options

| Option      | Alias | Value          | Description                                                                                       |
| ----------- | ----- | -------------- | ------------------------------------------------------------------------------------------------- |
| `--pattern` | `-p`  | a code snippet | Check one snippet. Repeat to check several, one verdict per line.                                 |
| `--lang`    | `-l`  | a language     | Required with `-p`: one of javascript, python, go, java, kotlin, php, ruby, rust, csharp, c, cpp. |
| `--dir`     | `-d`  | a directory    | Scope a scan to a directory. Repeats and combines with `-f`.                                      |
| `--file`    | `-f`  | a file         | Scope a scan to a single file. Repeats and combines with `-d`.                                    |

With no option it scans the whole project. `-p` needs `-l` and cannot be combined with `-d` or `-f`.

### Supported languages

The scan reads these languages, keyed by file extension, each checked against its own cryptographic APIs.

| Language                    | Weak ciphers (finding) & digests/RNG (review)                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **JavaScript / TypeScript** | `createCipher`, `CryptoJS.DES/RC4`, quoted `*-ecb`; MD5/SHA-1 `createHash`/`subtle.digest`; `Math.random()` |
| **Python**                  | pycryptodome `DES/ARC4/Blowfish.new`, `algorithms.TripleDES`, `MODE_ECB`; `hashlib.md5/sha1`; `random.*`    |
| **Go**                      | `des.NewCipher`, `rc4.NewCipher`, `blowfish.NewCipher`, `NewECBEncrypter`; `md5/sha1.Sum`; `math/rand`      |
| **Java / Kotlin**           | `Cipher.getInstance("DES"/…/ECB")`; `MessageDigest.getInstance("MD5")`, `HmacMD5`; `java.util.Random`       |
| **PHP**                     | `openssl_encrypt("des-…"/`…`-ecb")`, `mcrypt_*`; `md5()`/`sha1()`, `hash("md5", …)`; `rand()`/`mt_rand()`   |
| **Ruby**                    | `OpenSSL::Cipher.new("des-…")`, `:ECB`; `Digest::MD5/SHA1`; `rand()`/`Random`                               |
| **Rust**                    | `Rc4::`, `Blowfish::`, `des::`, `ecb::`; `Md5::`, `Sha1::`, `Hmac<Md5>`; `SmallRng`/`XorShiftRng`           |
| **C#**                      | `DES/TripleDES/RC2.Create`, `CipherMode.ECB`; `MD5/SHA1.Create`, `HMACMD5`; `new Random()`                  |
| **C / C++**                 | OpenSSL `DES_*`/`RC4`/`EVP_des_*`, `EVP_*_ecb`; `MD5()`/`SHA1()`, `EVP_md5`; `rand()`/`random()`            |

**Best-effort, not exhaustive**

It reads source as text, so a primitive assembled at runtime, hidden behind an alias, or written in a form it does not recognize can slip past. Treat the table as a strong starting point, not a complete inventory.

**Tip**

The hook guarantees the floor (these constructs exist): key management, IV reuse, and RSA padding are judgment the [`crypto` sub-skill](https://lagune.ai/docs/commands/skills) still covers.

## Frequently Asked Questions

### How do I scan a codebase for weak cryptography?

Run the crypto hook with no flag. Broken ciphers and ECB mode are findings that exit non-zero. An MD5/SHA-1 digest is a review lead, since it is broken for security use but legitimate as a plain checksum.

### Does the crypto hook flag Math.random()?

Only as a review lead in a security context, never as an automatic finding, since randomness is legitimate for jitter or UI ordering.
