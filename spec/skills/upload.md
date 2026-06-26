# File upload vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

This terrain is **a feature that accepts a file from the user**: an avatar, a CV, a document, a video, an import. The file is attacker-controlled in full, its bytes, declared type, name, and size, so every property the application trusts is one the attacker chose. No single check secures an upload, the defense is layered: validate what the file **is**, neutralize what it **contains**, control what its **name and location** become, and gate **who** may upload and retrieve. A weakness in any one layer is the finding. The path mechanics a filename triggers (traversal, null-byte truncation, overwrite, hidden streams) are the `path` surface, so this terrain points there for the name and keeps its own controls for the rest. What the stored file then does when served or parsed lands elsewhere (`interpreter`/`browser` for executable or active content, `xml` for a parser bomb, `http-request` for the upload's CSRF), named here as handoffs.

### Unrestricted upload of a dangerous type

The sharpest risk is a file the server later **executes or serves as active content**: a `.php`, `.jsp`, `.asp`, or `.aspx` written under a path the web server runs, an `.html` or `.svg` served inline (stored XSS against whoever opens it), an `.exe` or script offered for download. An unconstrained type turns an upload into a remote-code-execution or cross-site-scripting primitive. Each weak guard has a known bypass:

- **Trusting the `Content-Type` header.** Client-supplied and trivially spoofed, so `image/png` on a PHP script proves nothing. A convenience check at most, never the security control.
- **A blocklist of bad extensions.** Always incomplete (a forgotten `.phtml`, `.php5`, `.pht`, `.shtml`, `.cgi`), and bypassed by case (`.PhP`), by a trailing dot or space the OS trims (`shell.php.`), or by an alternate handler-mapped extension.
- **A naive extension regex.** A `\.jpg` check passes `shell.php.jpg` or `shell.jpg.php` (double extension), and on a server that picks the wrong segment the script wins. A null byte truncates the name so `shell.php%00.jpg` validates as `.jpg` but writes as `.php` (the `path` skill's null-byte block covers this mechanic).

Safer shapes, applied where they fit:

- **Allowlist the extension**, only the few the business needs (a CV is `.pdf` and `.docx`, an avatar is one agreed image type), and reject the rest. Decode the filename first, then validate the extension against its canonical form.
- **Verify the bytes match the claimed type** by the file's **magic-number signature**, not the header or the name. Signature checks alone are bypassable, so pair them with the allowlist and the content handling below.
- **Make the storage location non-executable regardless.** Even a correctly-typed upload should land where the server never runs it (see "Dangerous filename and where the file lands"), so a type-check miss does not become code execution.

### Malicious or active file content

A file with an allowed type and a clean name can still be dangerous in its **content**. A library parses the image, document, or archive, and a crafted file exploits that parser (ImageTragick/ImageMagick, a malformed media file, an XXE-laden document, the `xml` surface). A polyglot file is a valid image **and** a valid script at once, passing a type check yet executing where served. An office document carries a macro. Active markup served back to other users delivers stored XSS.

Safer shapes, applied where they fit:

- **Rewrite, don't just accept.** Re-encode images through an image library (re-rendering destroys injected payloads and polyglot tails), and run documents through Content Disarm and Reconstruction where the type allows it.
- **Scan untrusted files** through antivirus or a sandbox before they are stored or shared, as one layer, not the whole defense.
- **Keep parsers current and configured safely**, disabling external-entity resolution for any XML-bearing format (the `xml` surface) and keeping upload libraries patched.
- **Serve downloads inertly:** force `Content-Disposition: attachment` with a correct, code-set `Content-Type` and `X-Content-Type-Options: nosniff` so the browser never renders a stored file as active content (the `browser` surface owns the rendering side).

### Dangerous filename and where the file lands

A user-supplied filename and the directory it is stored in decide where the file lands and whether it can be served or run. A name carrying separators or traversal sequences writes outside the intended folder or overwrites another file, and a storage location inside the web root lets the upload be requested back and executed. The filename's path mechanics belong to the `path` surface. This block owns where the file is stored and under what name.

Safer shapes, applied where they fit:

- **Generate the stored name yourself.** Use a random, code-side identifier (a UUID) for the on-disk name and keep the user's name only as a display label in metadata, never as the path. This removes traversal, overwrite, and hidden-file tricks in one move.
- **If a user name must be kept, validate it as a leaf, not a path:** bound its length, allowlist a safe character subset (alphanumerics, hyphen, period, space), and reject leading periods, sequential periods, leading hyphens, and any separator or null byte. This is the `path` skill's "supply only a leaf" rule.
- **Store outside the web root**, on a separate host or storage service when possible, so an upload is never served or executed by path. When public access is needed, serve through a handler that maps an internal ID to the file (`id → file.ext`), never a direct filesystem path.
- **Set least-privilege permissions** on the upload directory: not executable, writable only by the storing account, readable only by those who must.

### Resource exhaustion and abuse

An upload (and the download that serves it back) consumes storage, memory, CPU, and bandwidth at the attacker's discretion. A very large file, or many files, fills the disk and takes the service down. A **decompression bomb** (a ZIP or XML "billion laughs" expanding from kilobytes to gigabytes) exhausts memory or disk when the server extracts or parses it. A publicly retrievable upload is a bandwidth amplifier: a small request draws a large response.

Safer shapes, applied where they fit:

- **Enforce a size limit** on the request, and a separate limit on the **decompressed** size for any archive, computed safely (cap entries and total output, never trust the archive's declared size). The `xml` surface owns the entity-expansion side of XML bombs.
- **Rate-limit and quota** uploads per user, and rate-limit the download endpoint to blunt amplification (the `credential-endpoint` surface covers reusable anti-automation patterns).
- **Account for post-processing cost**, applying limits after decompression or transformation, not only on the raw upload.

### Missing access control on upload and retrieval

An upload feature reachable without authentication, or by a user without the right permission, lets anyone plant files, and a retrieval endpoint with no authorization lets anyone read another user's uploads or enumerate stored files. As a state-changing request, the upload is also a CSRF target. The full controls live in `access-control` (authn/authz) and `http-request` (CSRF), but the upload feature must apply them.

Safer shapes: require authentication to upload, authorize both the upload and every retrieval against the acting user (so one user cannot read or overwrite another's files, the IDOR case in `access-control`), and protect the upload request from CSRF (the `http-request` surface).

## How to act on the result

- **In detect (detection):** each upload (or the endpoint serving uploads back) missing one of the layers is a finding. Record what it is (the weak or absent control, one of the risk blocks above), why it matters, and the evidence (the handler, the validation code, the storage location). The filename's path mechanics are confirmed by the `path` surface's procedure. Cite a concrete bypass of the code's own check (a double extension, a spoofed header, a null byte, an unbounded archive) before claiming one. It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the layers hold together: the type is allowlisted on the decoded name and confirmed against the file's signature, content is rewritten or scanned and served inertly, the stored name is code-generated (or validated as a bounded leaf) and the file lands outside any executable, web-served path, size and decompressed-size limits are enforced, and upload and retrieval are authenticated, authorized per user, and CSRF-protected. If a crafted file can still be stored under a dangerous type, executed or rendered as active content, escape or overwrite via its name, exhaust resources, or be planted or read without authorization, the risk is not closed: record it and point back to harden.
