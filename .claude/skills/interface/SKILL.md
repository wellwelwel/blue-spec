---
name: interface
description: Design engineering principles for making interfaces feel polished. Use when building UI, reviewing frontend code, or working on any visual detail, from animations, hover states, shadows, borders, and typography to optical alignment and tabular numbers.
user-invocable: true
metadata:
  internal: true
---

# Details that make interfaces feel better

Great interfaces rarely come from a single thing. It's usually a collection of small details that compound into a great experience. Apply these principles when building or reviewing UI code.

## Quick Reference

| Category                      | When to Use                                                       |
| ----------------------------- | ----------------------------------------------------------------- |
| [Typography](typography.md)   | Text wrapping, font smoothing, tabular numbers                    |
| [Surfaces](surfaces.md)       | Border radius, optical alignment, shadows, hit areas              |
| [Animations](animations.md)   | Interruptible animations, enter/exit transitions, icon animations |
| [Performance](performance.md) | Transition specificity, `will-change` usage                       |

## Core Principles

### 1. Concentric Border Radius

Outer radius = inner radius + padding. Mismatched radii on nested elements is the most common thing that makes interfaces feel off.

### 2. Optical Over Geometric Alignment

When geometric centering looks off, align optically. Buttons with icons, play triangles, and asymmetric icons all need manual adjustment.

### 3. Shadows Over Borders

Layer multiple transparent `box-shadow` values for natural depth. Shadows adapt to any background; solid borders don't.

### 4. Interruptible Animations

Use CSS transitions for interactive state changes — they can be interrupted mid-animation. Reserve keyframes for staged sequences that run once.

### 5. Split and Stagger Enter Animations

Don't animate a single container. Break content into semantic chunks and stagger each with ~100ms delay.

### 6. Subtle Exit Animations

Use a small fixed `translateY` instead of full height. Exits should be softer than enters.

### 7. Contextual Icon Animations

Animate icons with `opacity`, `scale`, and `blur` instead of toggling visibility. Use exactly these values: scale from `0.25` to `1`, opacity from `0` to `1`, blur from `4px` to `0px`. If the project has `motion` or `framer-motion` in `package.json`, use `transition: { type: "spring", duration: 0.3, bounce: 0 }` — bounce must always be `0`. If no motion library is installed, keep both icons in the DOM (one absolute-positioned) and cross-fade with CSS transitions using `cubic-bezier(0.2, 0, 0, 1)` — this gives both enter and exit animations without any dependency.

### 8. Font Smoothing

Apply `-webkit-font-smoothing: antialiased` to the root layout on macOS for crisper text.

### 9. Tabular Numbers

Use `font-variant-numeric: tabular-nums` for any dynamically updating numbers to prevent layout shift.

### 10. Text Wrapping

Use `text-wrap: balance` on headings. Use `text-wrap: pretty` for body text to avoid orphans.

### 11. Skip Animation on Page Load

Use `initial={false}` on `AnimatePresence` to prevent enter animations on first render. Verify it doesn't break intentional entrance animations.

### 12. Never Use `transition: all`

Always specify exact properties: `transition-property: scale, opacity`. Tailwind's `transition-transform` covers `transform, translate, scale, rotate`.

### 13. Use `will-change` Sparingly

Only for `transform`, `opacity`, `filter` — properties the GPU can composite. Never use `will-change: all`. Only add when you notice first-frame stutter.

### 14. Minimum Hit Area

Interactive elements need at least 40×40px hit area. Extend with a pseudo-element if the visible element is smaller. Never let hit areas of two elements overlap.

### 15. No Layout Shift

Content must never reflow after it appears. Reserve space up front for anything that loads or changes: fix dimensions on images and media (`width`/`height` or `aspect-ratio`), give async content a placeholder or skeleton of the same size, and keep dynamic numbers on `tabular-nums`. Toggling state (loading, error, expanded) must not resize the surrounding layout, and late-loading fonts must not shift text. Animate only compositor properties (`transform`, `opacity`), never geometry like `width`, `height`, `top`, or `margin`.

### 16. Canonical Tailwind Classes

Prefer a scale class over an arbitrary value when one exists: `size-8.5` over `size-[34px]`, `duration-220` over `duration-[220ms]`. Every `px` on the spacing scale maps by `N / 4`. Reserve `[...]` for values with no canonical form (breakpoints, `color-mix`, `cubic-bezier`, `rounded-[…]`).

## Common Mistakes

| Mistake                                  | Fix                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------- |
| Same border radius on parent and child   | Calculate `outerRadius = innerRadius + padding`                     |
| Icons look off-center                    | Adjust optically with padding or fix SVG directly                   |
| Hard borders between sections            | Use layered `box-shadow` with transparency                          |
| Jarring enter/exit animations            | Split, stagger, and keep exits subtle                               |
| Numbers cause layout shift               | Apply `tabular-nums`                                                |
| Heavy text on macOS                      | Apply `antialiased` to root                                         |
| Animation plays on page load             | Add `initial={false}` to `AnimatePresence`                          |
| `transition: all` on elements            | Specify exact properties                                            |
| First-frame animation stutter            | Add `will-change: transform` (sparingly)                            |
| Tiny hit areas on small controls         | Extend with pseudo-element to 40×40px                               |
| Content reflows after load or on toggle  | Reserve space up front (fixed dimensions, `aspect-ratio`, skeleton) |
| Arbitrary value where a scale class fits | Use the canonical class (`size-8.5`, not `size-[34px]`)             |

## Verifying the rendered result

Verify by measuring, not by eyeballing. For any spacing or alignment claim, measure the rendered DOM (`getBoundingClientRect` between an element and its container's edges) and report the numbers. A screenshot that looks aligned is not evidence.

For complex visual changes, or whenever seeing the rendered result matters, drive the running page through Chrome's built-in DevTools Protocol (CDP) to inspect the DOM, computed styles, and layout, and to capture screenshots. It works against any URL, whatever app or domain is serving it. The `tools/cdp.ts` helper does exactly this:

```sh
npx tsx tools/cdp.ts --out ./temp/shots --shot 'label|<url>'
```

Pass an optional `--measure` snippet to read geometry off the rendered DOM. Put any query params the page supports (a forced theme, a route, a flag) straight in the URL. Reach for it when a change is hard to verify from the source alone: layout, spacing, alignment, overflow, theme tokens, or anything that only shows up once rendered. Skip it for simple, self-evident edits (for example, adding a shadow) where the result is obvious from the diff.

## Review Output Format

Always present changes as a markdown table with **Before** and **After** columns. Include every change you made — not just a subset. Never list findings as separate "Before:" / "After:" lines outside of a table. Group changes by principle using a heading above each table, and keep each row focused on a single diff so the reader can scan the whole list quickly.

### Example

#### Concentric border radius

| Before                                                      | After                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------- |
| `rounded-xl` on card + `rounded-xl` on inner button (`p-2`) | `rounded-2xl` on card (`12 + 8`), `rounded-lg` on inner button |
| `border-radius: 16px` on both nested surfaces               | Outer `24px`, inner `16px` with `8px` padding                  |

#### Tabular numbers

| Before                                     | After                                              |
| ------------------------------------------ | -------------------------------------------------- |
| `<span>{count}</span>` on animated counter | `<span className="tabular-nums">{count}</span>`    |
| Default numerals on timer                  | Added `font-variant-numeric: tabular-nums` to root |

Rows should cite the specific file and the specific property that changed when it isn't obvious from the snippet. If a principle was reviewed but nothing needed to change, omit that table entirely — empty tables add noise.

## Review Checklist

- [ ] Nested rounded elements use concentric border radius
- [ ] Icons are optically centered, not just geometrically
- [ ] Shadows used instead of borders where appropriate
- [ ] Enter animations are split and staggered
- [ ] Exit animations are subtle
- [ ] Dynamic numbers use tabular-nums
- [ ] Font smoothing is applied
- [ ] Headings use text-wrap: balance
- [ ] AnimatePresence uses `initial={false}` for default-state elements
- [ ] No `transition: all` — only specific properties
- [ ] `will-change` only on transform/opacity/filter, never `all`
- [ ] Interactive elements have at least 40×40px hit area
- [ ] No layout shift: space is reserved for loading/async/media content, toggles don't resize the layout
- [ ] Scale classes used over arbitrary values where a canonical form exists

## Reference Files

- [typography.md](typography.md) — Text wrapping, font smoothing, tabular numbers
- [surfaces.md](surfaces.md) — Border radius, optical alignment, shadows
- [animations.md](animations.md) — Interruptible animations, enter/exit transitions, icon animations
- [performance.md](performance.md) — Transition specificity, `will-change` usage

## Credits

Adapted from [make-interfaces-feel-better](https://github.com/jakubkrehel/make-interfaces-feel-better/tree/384562064fcdd99778fcbafd8729626fe6aab02f) by [Jakub Krehel](https://github.com/jakubkrehel).
