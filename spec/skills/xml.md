# XML parsing vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://cheatsheetseries.owasp.org/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

This terrain is **parsing untrusted XML with a weakly configured parser**. A document's type definition (DTD) lets it declare _entities_ the parser expands while reading, and some reach out to the filesystem or the network, so a parser left at its permissive default lets an attacker's document drive what the parser reads or fetches. Any feature that accepts XML is in scope: a SOAP or SAML message, an `.xlsx`/`.docx` (zipped XML), an SVG upload. The impacts (file disclosure, SSRF, DoS) overlap other terrains, but the cause and the fix live at the parser configuration.

### XML external entity injection (XXE, CWE-611)

A DTD can declare an external entity naming a URL or file path that a default parser resolves when the entity is referenced: an entity declared `SYSTEM "file:///etc/passwd"` makes the parser read a local file into the document, and `SYSTEM "http://169.254.169.254/..."` or any internal URL makes it fetch it. So XXE is at once **local file disclosure** (the app's own config, private keys, `/etc/passwd`) and **SSRF**: the parser becomes the fetch client, reaching internal services and cloud metadata exactly as the `network` sub-skill describes, only the request is driven by an entity instead of a URL field. A **parameter entity** (`%e;`) and an external DTD reach the same outcome while bypassing a guard that blocked only general entities, and a **blind** variant exfiltrates over an out-of-band channel when the expanded value never appears in the response. `XInclude` is a second door to the same file-read and SSRF even when entities are locked down.

Safer shape: disable the DTD entirely, the one move that closes the whole class. Set the parser's "disallow DOCTYPE" feature (for example `disallow-doctype-decl` on a Java/Xerces factory, `XML_PARSE_NOENT`/`XML_PARSE_DTDLOAD` left _unset_ on libxml2, `defusedxml` in Python, `resolve_entities: false` in Nokogiri). Where a DTD genuinely cannot be dropped, disable external general entities, external parameter entities, and external DTD loading specifically, and disable `XInclude`. When the impact is a fetch reaching inside, the `network` sub-skill's destination controls are the second barrier behind the parser fix.

### Entity expansion denial of service (billion laughs)

A DTD can define an entity in terms of other entities, so a small document declaring a nested chain balloons to gigabytes in memory as the parser expands it, exhausting CPU and RAM and taking the service down. This needs no external fetch, only entity definitions the parser honors, so it survives a fix that blocked only _external_ entities while still expanding _internal_ ones. A "quadratic blowup" variant achieves the same with one large entity referenced many times.

Safer shape: disabling the DTD (the XXE fix above) also closes this, since no entities are defined. Where the DTD stays, enable the parser's secure-processing mode and cap entity expansion: limit the expansion count, the nesting depth, and the total expanded size, and reject a document that exceeds them rather than expanding it.

### Schema or validation that fetches external resources

Validation can itself reach out: a schema reference (`schemaLocation`, an external XSD), an XSLT `document()` call, or a DTD fetched for validation makes the parser issue an outbound request while "just validating", a silent SSRF triggered by the act of checking the document. The same applies to any processing step (transformation, signature validation) that resolves a URL out of the document.

Safer shape: validate against a **local, code-defined** schema you ship, never one the document names, and disable external schema/DTD fetching during validation. Treat any URL the parser would resolve from untrusted XML as the same destination problem the `network` sub-skill governs.

## How to act on the result

- **In detect (detection):** find each XML parser, validator, or transformer reached by untrusted input, then check its construction against the safer shapes above. Record what it is (the parser call and the untrusted XML source), why it matters (the impact for that risk block), and the evidence (the parser construction and its options). Any parser left at a permissive default, or guarded for general entities but not parameter entities, external DTDs, `XInclude`, or internal expansion, is a finding. It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the parser cannot be steered by the document: the DTD is disabled (or external general entities, external parameter entities, external DTD loading, and `XInclude` are each disabled), entity expansion is bounded by secure-processing limits, and validation uses a local schema with no external fetching. Prove it at every XML entry point, not just the obvious one. Where SSRF or file read was the impact, the `network` and `path` sub-skills' controls must also hold as the second barrier. If an attacker's XML can still read a file, drive an outbound request, or exhaust memory through the parser, the risk is not closed: record it and point back to harden.
