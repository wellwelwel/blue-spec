# Rust-specific vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: the Rust Reference (undefined behavior, `transmute`, `MaybeUninit`, unwinding across FFI), RFC 0560 (integer overflow), and the RustSec advisory database (`unsoundness`/`memory-corruption`).

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

Rust's safety guarantee is conditional: only `unsafe` code can cause undefined behavior.

### Unsound public APIs (`unsafe` internals that break their invariants)

A library is unsound when a safe public API is implemented with `unsafe` internals that do not uphold their invariants, so a safe caller can trigger UB. The dangerous shapes live inside the `unsafe` block behind a safe wrapper: creating multiple mutable aliases through raw pointers, returning a reference with a fabricated lifetime, reading uninitialized memory, or assuming an invariant the safe caller can violate. The impact is memory corruption, use-after-free, or type confusion in a caller who never opted into `unsafe`. A related signature-level defect: a function that can be misused to cause UB must be declared `unsafe fn`, so an `unsafe`-capable operation behind a safe signature is itself unsound.

Safer shapes, applied where they fit:

- Minimize `unsafe` and isolate it in small, audited modules, with a `// SAFETY:` comment that proves each invariant holds on every path.
- Run **Miri** (the UB interpreter) in CI to catch aliasing and UB violations, `cargo-geiger` to inventory `unsafe`, and `cargo-audit`/`cargo-deny` against the RustSec database.
- Give any UB-capable function an `unsafe fn` signature, and validate every value crossing an FFI boundary.
- Consider `#![forbid(unsafe_code)]` in crates that do not need `unsafe` at all.

### `std::mem::transmute` misuse

`transmute<T, U>` reinterprets the bits of one type as another, bypassing the type system. It requires the two types to share a size (a mismatch is a compile error) but checks nothing else: transmuting to an incompatible layout, producing an invalid value (a `bool` that is not 0 or 1, an out-of-range `char`, a dangling or misaligned reference), or changing a lifetime is immediate undefined behavior.

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

Multiple RustSec advisories trace to this exact pattern: an `unsafe impl Send`/`Sync` missing the `T: Send`/`T: Sync` bound, which lets safe code race a non-atomic `Rc`/`Cell` across threads and crash.

Safer shapes, applied where they fit:

- Prefer letting the compiler auto-derive `Send`/`Sync`. If you must implement them by hand, propagate the correct bounds (`T: Send`, `T: Sync`) and justify them with a `// SAFETY:` note.
- Use `PhantomData` to carry the right auto-trait behavior instead of hand-writing impls.
- Run Miri and thread sanitizers, and review every `unsafe impl Send`/`Sync` in audits.

### Integer overflow: debug panics vs. release wraps

Per RFC 0560, arithmetic overflow on the built-in integer operators (`+`, `-`, `*`) panics when overflow checking is enabled and two's-complement wraps when it is disabled. Overflow checking is tied by default to `debug_assertions`, so debug builds panic on overflow while release builds silently wrap. A length, price, or index calculation that appears to catch overflow in debug wraps silently in production: a `price * quantity` that wraps to a tiny value lets an attacker buy expensive items for pennies, and a wrapped length feeding an allocation or a bounds calculation becomes a memory-safety bug downstream.

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

If an initialization path can be skipped (an early return or an error path) before `assume_init()`, the code reads uninitialized memory: UB, an information leak, or a crash.

Safer shapes, applied where they fit:

- Use `MaybeUninit<T>`, never the deprecated `mem::uninitialized`, and call `assume_init()` only after proving full initialization on every path.
- Prefer safe initialization (`[0u8; N]` arrays, `Vec::with_capacity` plus `resize`, or collecting from an iterator) over a manual uninitialized buffer.

### Panic / unwinding across FFI boundaries

Unwinding with the wrong ABI is undefined behavior: a foreign exception unwinding into Rust through a non-unwinding ABI, or a Rust `extern` function that unwinds being called from code that does not support unwinding.

On a current toolchain, a Rust `panic!` that reaches an `extern "C"` boundary aborts the process rather than unwinding into C, so that direction is no longer silent UB. The inverse, a foreign (C++) exception unwinding into Rust, and any misuse of the `"C-unwind"` ABI remain UB, and can corrupt the stack or violate an `unsafe` invariant.

Safer shapes, applied where they fit:

- Wrap Rust code called from C in `std::panic::catch_unwind` at the boundary and convert a panic into an error code, so no panic escapes an `extern "C"` function.
- Use the `extern "C-unwind"` ABI only when you intend unwinding to cross the boundary and both sides support it. Otherwise use plain `extern "C"`, which aborts on panic.
- Note `catch_unwind` only catches an unwinding panic, not `panic=abort`. Design for the panic strategy the build actually uses.

## How to act on the result

- **In detect (detection):** each pattern you confirm is a finding. Describe what it is (the Rust behavior being abused, see the risk blocks above), why it matters, and the evidence (the `unsafe` block, the impl, or the FFI function where it lives). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** the control holds only when each unsafe pattern from the body is gone or properly guarded. Closed conditions: the `unsafe` block upholds its invariant on every path with a `// SAFETY:` note, a UB-capable function carries an `unsafe fn` signature, `Send`/`Sync` impls propagate the correct bounds, security-sensitive arithmetic uses `checked_*`/`saturating_*` (or release `overflow-checks` is on), `assume_init()` runs only after full initialization, and no panic escapes an `extern "C"` boundary. Miri passing on the relevant tests is strong supporting evidence, not a proof on its own, since it only checks the paths it executes. If the dangerous pattern can still be driven to UB from safe code, record it as not closed and point back to harden.
