# C / C++-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: MITRE CWE-134 ("Use of Externally-Controlled Format String") and CWE-120/CWE-787 ("Buffer Copy without Checking Size of Input" / "Out-of-bounds Write"), CERT C rule FIO30-C ("Exclude user input from format strings"), the GCC manual (`-Wformat-security`, `-Wformat=2`, `_FORTIFY_SOURCE`), and OWASP, <https://owasp.org/www-community/attacks/>.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

### Uncontrolled format string (`printf(user_input)`, CWE-134)

A `printf`-family function decides how many arguments to consume, and of what type, purely from the specifiers in its format string. When that string is attacker-controlled instead of a fixed literal, the attacker dictates the call's reads and writes. The dangerous pattern passes untrusted data as the format argument itself, with no fixed literal in front of it:

```c
printf(userName);            // VULNERABLE: userName is the format string
printf("%s", userName);      // SAFE: fixed literal, userName is just an argument
```

Why it matters, by specifier:

- `%x`, `%p`, and `%s` read arguments that were never passed, walking adjacent stack memory and leaking it (stack contents, addresses that defeat ASLR, secrets).
- `%n` _writes_: it stores the number of characters printed so far to the address its argument points at, giving a write-what-where primitive that turns a logging bug into arbitrary code execution.

Audit the whole variadic-formatter family wherever the format argument is non-literal, not only `printf`: `fprintf`, `sprintf`, `snprintf`, `vprintf`/`vfprintf`/`vsnprintf`, `syslog` (its message argument is a format string), `err`/`warn` (`errx`/`warnx`), and the wide-character `wprintf` variants. In C++, `std::printf` and friends carry it identically, while `std::format`/`std::print` (C++20/23) require a compile-time-checked format string, which removes the class when the format is a literal.

Safer shapes, applied where they fit:

- **Always pass a fixed format literal**, routing the untrusted value through a `%s` (or the matching specifier) as an _argument_: `printf("%s", user_input)`, never `printf(user_input)`. This is CERT C rule FIO30-C. The same shape applies to `fprintf("%s", ...)`, `syslog(priority, "%s", ...)`, and the rest of the family.
- **Make the compiler reject it.** Build with `-Wformat -Wformat-security` (or the broader `-Wformat=2`) and promote it to an error with `-Werror=format-security`, which flags exactly the `printf(foo)` shape: a format string that is not a string literal with no format arguments.
- **Add runtime hardening.** Compile with `-D_FORTIFY_SOURCE=2` (or `3`) at `-O1` or higher. glibc's fortified `printf` family refuses a `%n` directive when the format string sits in writable memory, blunting the write-what-where path even if a non-literal format slips through.
- **Avoid `%n` entirely**, and prefer output APIs that do not interpret a runtime-supplied format string at all (in C++, `std::format`/`std::print` with a literal, or `fputs`/`fwrite` for raw text).

### Buffer overflow from unbounded copy (CWE-120 / CWE-787)

A fixed-size buffer is filled from input whose length the call never checks, so a longer input writes past the buffer's end over adjacent stack or heap memory: a saved return address, a function pointer, a length field. The corruption is at minimum a crash (DoS) and at worst arbitrary code execution, the attacker overwriting the return address to jump into injected shellcode. The dangerous functions copy until a terminator with no size bound: `gets`, `strcpy`, `strcat`, `sprintf`, `scanf`/`sscanf` with an unbounded `%s`, and any hand-written loop that copies without checking the destination size. The untrusted length need not arrive as a request body: an **environment variable** read with `getenv` and copied into a fixed buffer with `sprintf` is the same flaw (a 64-byte buffer, a 128-byte `$HOME`, overflow), and any externally influenced value (a file, an argument, a network field) reaching an unchecked copy qualifies.

Safer shapes, applied where they fit:

- **Use the size-bounded equivalent and pass the real destination size**: `fgets` for `gets`, `snprintf` for `sprintf`, `strncpy`/`strncat` (or better, `strlcpy`/`strlcat` where available) for `strcpy`/`strcat`, and a width-limited `%Ns` in `scanf`. Confirm the bound is the _destination's_ size, not the source's, and that the result is still null-terminated (`strncpy` does not guarantee it).
- **Prefer types that carry their own bounds.** In C++, use `std::string` and `std::vector` over raw `char[]`, and `std::span`/`.at()` over pointer arithmetic, so length travels with the buffer.
- **Validate length before the copy.** Where a raw buffer must stay, check the input length against the buffer size and reject or truncate before copying, treating an environment variable or any external value as exactly as untrusted as request input.
- **Add compiler and runtime hardening as backing layers**, not as the fix: `-D_FORTIFY_SOURCE=2`/`3` at `-O1`+ catches many unsafe calls, and `-fstack-protector-strong`, ASLR, and non-executable stacks raise the bar on exploitation. They reduce impact, they do not remove the unchecked copy.

## How to act on the result

- **In detect (detection):** each confirmed call is a finding. Flag a `printf`-family or `syslog`/`err`-family call whose format argument is anything other than a string literal, and an unbounded copy (`gets`, `strcpy`, `strcat`, `sprintf`, an unbounded `%s` in `scanf`, or a hand-written copy loop) filling a fixed-size buffer from input whose length is not checked. Trace the format string or the copied input back to its untrusted source (including an environment variable), and record the impact. It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when, for a format string, every flagged call passes a fixed literal with the untrusted data demoted to an argument (`printf("%s", x)`) or uses an API that does not interpret a runtime format string, and, for a buffer overflow, every unbounded copy is replaced by a size-bounded equivalent passed the destination's real size (still null-terminated) or a length-carrying type, with input length validated before any remaining raw copy. Compiler enforcement (`-Werror=format-security` / `-Wformat=2`) and runtime hardening (`-D_FORTIFY_SOURCE`, `-fstack-protector-strong`, ASLR) building clean is supporting evidence, not proof on its own, since they cover only the calls and paths they can see. If any reachable call still takes a non-literal, attacker-influenced format string, or copies untrusted input into a fixed buffer without a size bound, the risk is not closed: record it as such and point back to harden.
