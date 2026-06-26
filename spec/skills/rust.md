# Rust-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: the Rust Reference (behavior considered undefined, `transmute`, `MaybeUninit`, unwinding across FFI), RFC 0560 (integer overflow), the RustSec advisory database (`unsoundness`/`memory-corruption` categories), and the research projects `cve-rs` and `totally-safe-transmute`.

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

Rust's safety guarantee is conditional: safe code cannot cause undefined behavior, only `unsafe` code may. The language-exclusive risks below are all about the ways that contract gets broken, where a flaw inside an `unsafe` block reaches a caller who wrote no `unsafe` at all.

### Unsound public APIs (`unsafe` internals that break their invariants)

Rust makes a formal promise, the soundness property: a sound library cannot be driven to undefined behavior by any safe caller, no matter how devious. When a safe public API is implemented with `unsafe` internals that do not actually uphold their invariants, the API is unsound, and a safe caller can trigger UB. RustSec maintains a dedicated `unsoundness`/`memory-corruption` advisory category for exactly this, and the research projects `cve-rs` and `totally-safe-transmute` demonstrate UB reached from 100% safe code.

The dangerous shapes live inside the `unsafe` block of a crate that exposes a safe wrapper: creating multiple mutable aliases through raw pointers, returning a reference with a fabricated lifetime, reading uninitialized memory, or assuming an invariant the safe caller can violate. The impact is memory corruption, use-after-free, or type confusion in a caller who never opted into `unsafe`. A related signature-level risk: a function that can be misused to cause UB must be declared `unsafe fn`. An `unsafe`-capable operation exposed behind a safe signature is itself the soundness defect.

Safer shapes, applied where they fit:

- Minimize `unsafe` and isolate it in small, audited modules, with a `// SAFETY:` comment that proves each invariant holds on every path.
- Run **Miri** (the UB interpreter) in CI to catch aliasing and UB violations, `cargo-geiger` to inventory `unsafe`, and `cargo-audit`/`cargo-deny` against the RustSec database.
- Give any UB-capable function an `unsafe fn` signature, and validate every value crossing an FFI boundary.
- Consider `#![forbid(unsafe_code)]` in crates that do not need `unsafe` at all.

### `std::mem::transmute` misuse

`transmute<T, U>` reinterprets the bits of one type as another, bypassing the type system entirely. It is the most dangerous function in the language.

`transmute` requires the two types to have the same size (a size mismatch is a compile error), but it checks nothing else: transmuting to an incompatible layout, producing an invalid value (a `bool` that is not 0 or 1, an out-of-range `char`, a dangling or misaligned reference), or changing a lifetime is immediate undefined behavior. The `totally-safe-transmute` advisory shows the extreme case, transmuting any type to any other type.

Safer shapes, applied where they fit:

- Avoid `transmute` almost always. Use safe conversions: `as` casts for numbers, `T::from`/`TryFrom`, `f32::to_bits`/`from_bits` for float bit patterns, and `slice::from_raw_parts` only with care.
- For pointer casts use `ptr as *const U`. For byte reinterpretation use `bytemuck`, whose `Pod`/`Zeroable` bounds are checked at compile time, instead of a raw `transmute`.
- Never use `transmute` to extend a lifetime.

### Incorrect manual `Send`/`Sync` implementations

`Send` and `Sync` are `unsafe` auto-traits that encode thread-safety in the type system. The compiler derives them automatically, but a type holding a raw pointer requires a manual `unsafe impl`. An impl with the wrong bound (for example an unconditional `unsafe impl<T> Send`) lets non-thread-safe data cross threads, producing a data race from safe code, which is UB in Rust.

```rust
// UNSOUND: no bound on T
unsafe impl<T> Send for Wrapper<T> {}
// SOUND:
unsafe impl<T: Send> Send for Wrapper<T> {}
unsafe impl<T: Sync> Sync for Wrapper<T> {}
```

Real RustSec advisories show the pattern: `futures`' `MappedMutexGuard`, the `v9` crate's `SyncRef`, and `buttplug`'s `ButtplugFutureStateShared` each shipped an `unsafe impl Send`/`Sync` without the proper `T: Send`/`T: Sync` bound, letting safe code race a non-atomic `Rc`/`Cell` across threads and crash.

Safer shapes, applied where they fit:

- Prefer letting the compiler auto-derive `Send`/`Sync`. If you must implement them by hand, propagate the correct bounds (`T: Send`, `T: Sync`) and justify them with a `// SAFETY:` note.
- Use `PhantomData` to carry the right auto-trait behavior instead of hand-writing impls.
- Run Miri and thread sanitizers, and review every `unsafe impl Send`/`Sync` in audits.

### Integer overflow: debug panics vs. release wraps

Per RFC 0560, arithmetic overflow on the built-in integer operators behaves differently by build profile. As the RFC states: "The operations +, -, \*, can underflow and overflow. When checking is enabled this will panic. When checking is disabled this will two's complement wrap." Overflow checking is tied by default to `debug_assertions`, so debug builds panic on overflow while release builds silently wrap. This debug/release divergence is unique to Rust's design. It is not memory-unsafe by itself, but it is a logic and security footgun.

A length, price, or index calculation tested in debug appears to catch overflow by panicking, then silently wraps in production. A `price * quantity` that wraps to a tiny value lets an attacker buy expensive items for pennies, and a wrapped length feeding an allocation or a bounds calculation can become a memory-safety bug downstream. CVE-2018-1000810 in the standard library is a cited real overflow bug.

Safer shapes, applied where they fit:

- Use explicit arithmetic methods in security-sensitive code: `checked_add`/`checked_mul` (return `Option`, `None` on overflow), `saturating_*` (clamp to the bound), or `wrapping_*`/`overflowing_*` only when wrapping is genuinely intended.
- Enable overflow checks in release builds via `Cargo.toml`:

  ```toml
  [profile.release]
  overflow-checks = true
  ```

- Turn on the Clippy lints `clippy::arithmetic_side_effects`, `cast_possible_truncation`, and `cast_sign_loss`.

### `MaybeUninit` / `mem::uninitialized` misuse

Reading uninitialized memory is instant undefined behavior in Rust, because the compiler assumes every value of a type is valid. `mem::uninitialized` (deprecated) and `MaybeUninit::assume_init` both assert that memory is initialized.

If an initialization path can be skipped (an early return or an error path) before `assume_init()`, the code reads uninitialized memory: UB, an information leak, or a crash. RustSec lists multiple uninitialized-memory-exposure advisories.

Safer shapes, applied where they fit:

- Use `MaybeUninit<T>`, never the deprecated `mem::uninitialized`, and call `assume_init()` only after proving full initialization on every path.
- Prefer safe initialization (`[0u8; N]` arrays, `Vec::with_capacity` plus `resize`, or collecting from an iterator) over a manual uninitialized buffer.

### Panic / unwinding across FFI boundaries

Rust's unwinding semantics meet C's ABI at the FFI boundary. The Rust Reference states it plainly: unwinding with the wrong ABI is undefined behavior. That covers a foreign exception unwinding into Rust through a non-unwinding ABI, and a Rust `extern` function that unwinds being called from code that does not support unwinding.

On a current Rust toolchain, a Rust `panic!` that reaches an `extern "C"` boundary aborts the process rather than unwinding into C, so that direction is no longer silent UB. The inverse, a foreign (C++) exception unwinding into Rust, and any misuse of the `"C-unwind"` ABI, remain UB and can corrupt the stack or violate an `unsafe` invariant.

Safer shapes, applied where they fit:

- Wrap Rust code called from C in `std::panic::catch_unwind` at the boundary and convert a panic into an error code, so no panic escapes an `extern "C"` function.
- Use the `extern "C-unwind"` ABI only when you intend unwinding to cross the boundary and both sides support it. Otherwise use plain `extern "C"`, which aborts on panic.
- Note `catch_unwind` only catches an unwinding panic, not `panic=abort`. Design for the panic strategy the build actually uses.

## How to act on the result

- **In detect (detection):** each pattern you confirm is a finding. Describe it in plain language: what it is (the Rust behavior being abused), why it matters (the concrete impact, for example a use-after-free reachable from safe code, a data race from a wrong `Send` bound, or a release-only integer wrap feeding an allocation), and the evidence (the `unsafe` block, the impl, or the FFI function where it lives). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when the unsafe pattern is gone or properly guarded: the `unsafe` block upholds its documented invariant on every path with a `// SAFETY:` note, a UB-capable function carries an `unsafe fn` signature, `Send`/`Sync` impls propagate the correct bounds, security-sensitive arithmetic uses `checked_*`/`saturating_*` (or release `overflow-checks` is on), `assume_init()` runs only after full initialization, and no panic escapes an `extern "C"` boundary. Miri passing on the relevant tests is strong supporting evidence, not a proof on its own, since it only checks the paths it executes. If the dangerous pattern can still be driven to UB from safe code, record it as not closed and point back to harden.
