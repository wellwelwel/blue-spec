# Go-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: the Go Memory Model, the Go 1.22 release notes ("Changes to the language"), and the Go blog "Fixing For Loops in Go 1.22" (loopvar), which documents the loop-variable bug and the Let's Encrypt production incident.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

Go's safety comes from a small set of design choices, an interface as a (type, value) pair, goroutines over shared memory, and the language-exclusive risks below are the ways those choices turn into silent logic and concurrency bugs. None of them is a syntax error, the code compiles and often passes a casual test, then misbehaves where a security decision or a concurrent path depends on it.

### Typed-nil interface comparison (`nil != nil`)

A Go interface value is a (type, value) pair, and it equals `nil` only when both halves are nil. Assigning a typed nil pointer (`var p *T = nil`) to an interface produces a non-nil interface (type `*T`, value nil), so a comparison that looks correct silently goes the wrong way. This is unique to Go's interface representation.

The classic instance is an `error` return: a function returns a `*MyError` that is nil, but the caller's `if err != nil` is true anyway, so error handling misfires. The impact is incorrect control flow, a nil-receiver panic (DoS), or a failed operation treated as successful, a security-relevant logic error on an auth, validation, or payment path.

```go
func do() error {
    var e *MyError = nil
    return e            // interface is (*MyError, nil), NOT nil
}

if do() != nil { /* always taken */ }
```

Safer shapes, applied where they fit:

- When a function returns an interface, return literal `nil` on success, not a typed nil pointer:

  ```go
  func do() error {
      if somethingFailed {
          return &MyError{ /* ... */ }
      }
      return nil // explicit untyped nil
  }
  ```

- Do not store a concrete pointer type in an interface variable when you intend to compare it to nil. When a check is unavoidable, use a type assertion or `reflect.ValueOf(i).IsNil()`.
- Enable `go vet` and the `nilness` analyzer (`golang.org/x/tools/go/analysis/passes/nilness`), which flags nil-pointer dereferences and degenerate nil comparisons, and the `nilerr` linter (via `golangci-lint`), which flags returning `nil` after an `err != nil` check.

### Data races from goroutines sharing memory (incl. pre-1.22 loop-variable capture)

Go encourages many goroutines over shared memory, and its memory model permits a data race to produce an arbitrary result, including memory corruption for multiword values (interfaces, slices, maps, strings) where a torn (pointer, len) or (pointer, type) pair can be observed. A concurrent map write is explicitly fatal. The well-known instance was the per-loop, not per-iteration, loop variable: every goroutine closed over the same `i`/`v`.

Pre-Go 1.22, `for _, v := range items { go func(){ use(v) }() }` had all goroutines observe the final `v`. The Go blog's example "usually print 'c', 'c', 'c', instead of printing 'a', 'b', and 'c' in some order," and notes it "has caused production problems at many companies, including a publicly documented issue at Let's Encrypt." The impact is wrong results feeding logic or security decisions, and shared map or slice writes that corrupt memory or crash (DoS).

Safer shapes, applied where they fit:

- Run tests under the race detector (`go test -race`, `go run -race`) on realistic, load, and integration tests. It is the canonical tool, and it only reports races on the paths it actually executes, so coverage matters.
- Protect shared state with `sync.Mutex`/`sync.RWMutex`, or confine each variable to a single goroutine and communicate over channels ("share memory by communicating"). Use `sync/atomic` for counters.
- For the loop-variable bug before 1.22, pass the variable as a parameter (`go func(v T){ /* ... */ }(v)`) or rebind it (`v := v`). Go 1.22 (February 2024) made loop variables per-iteration: per the release notes, "Previously, the variables declared by a 'for' loop were created once and updated by each iteration. In Go 1.22, each iteration of the loop creates new variables, to avoid accidental sharing bugs." This applies only to code in modules that declare `go 1.22` or later, and it does not fix general shared-memory races.

## How to act on the result

- **In detect (detection):** each pattern you confirm is a finding. Describe it in plain language: what it is (the Go behavior being abused, a typed nil reaching an interface comparison, or shared memory touched by concurrent goroutines without synchronization), why it matters (the concrete impact, for example an `err != nil` that is always true on a success path, a nil-receiver panic, or a data race feeding an auth decision), and the evidence (the function, the return, or the goroutine where it lives). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the unsafe pattern is gone or properly guarded: an interface-returning function returns literal `nil` on success (or guards the comparison with a type assertion / `reflect` nil check), and shared state crossing goroutines is protected by a mutex, confined to one goroutine and reached over channels, or made atomic, with the loop-variable case fixed by per-parameter passing or a `go 1.22`+ module. The race detector passing on the exercised paths is strong supporting evidence, not a proof on its own, since it only sees the paths it runs. If a typed nil can still reach a nil comparison, or shared memory can still be raced, record it as not closed and point back to harden.
