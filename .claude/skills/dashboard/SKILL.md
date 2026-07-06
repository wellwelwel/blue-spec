---
name: dashboard
description: Authoritative reference for the Blue Spec dashboard, a live view of a project's .bluespec/ chain with a locked-down local action surface. Use before changing anything under src/dashboard/ or src/types/dashboard/.
user-invocable: true
metadata:
  internal: true
---

# Blue Spec dashboard

A live view of a project's `.bluespec/` chain: charter, findings, hardening, verification, and the applied sub-skills. It parses the real memory artifacts and tracking map on every request and pushes a browser reload whenever anything under `.bluespec/` changes. Viewing is read-only. The one write path is the Settings action surface, which runs the CLI's own core in-process behind the guards described under Actions.

Authored in strict TypeScript with Node APIs, runtime-agnostic across Node, Bun, and Deno. It ships as a self-contained static client plus a zero-dependency server, both bundled into `lib/` at build time. `src/` is never published.

The product mission and workflow philosophy live in [CLAUDE.md](../../../CLAUDE.md). The toolchain, code conventions, and build path live in the [engineering](../engineering/SKILL.md) skill, the repository layout in the [architecture](../architecture/SKILL.md) skill, and design-engineering principles, including how to verify rendered output, in the [/interface](../interface/SKILL.md) skill.

## Consistency

The client follows one visual system. Same-styled elements never carry their own local variants, and when two of them disagree on a value, standardize on the smallest one already in use. New kinds of visual consistency belong here as subsections, never as new top-level sections.

For general guidelines on the user interface, CDP, screenshots, etc., see: [/interface](../interface/SKILL.md)

### Spacing

- **One card inset:** content inside any surface card sits `p-4.5` (18px) from every edge, all four sides. The metric cards, finding cards, charter cards, rail blocks, and detail cards all share it.
- **List cards put every padding on the row:** the container is only `overflow-hidden rounded-lg bg-surface shadow-card`, with no padding of its own. Each row owns `px-4.5 py-3`, and the first and last rows close the card edge with `first:pt-4.5` and `last:pb-4.5` (in the findings table, the header is the first row: `pt-4.5 pb-3`). This keeps row hover and dividers spanning the full card width, and keeps every spacing readable on the element itself. Never assemble an inset from a parent padding plus a child padding: a hidden contribution on the parent is exactly the inconsistency this rule exists to prevent.
- **Fixed rhythm:** rows use `py-3` with `gap-3`, card grids use `gap-4`, sections end with `mb-6`, and section heads sit `mb-3` above their content.

### Tiles and icons

Icon tiles in rows are `size-8.5` with `text-[1.05rem]` glyphs, circular arrow affordances are `size-8.5 rounded-full text-[0.95rem]`, and large tiles are `size-11 rounded-md text-[1.25rem]`.

### Typography

Micro labels (uppercase group titles, table headers, card labels) come from `MICRO_LABEL` in `client/styles/classes.ts`, badges from `BADGE`, group heads from `GROUP_HEAD`. Reuse the token instead of retyping a near-copy. Card titles are `text-[0.9rem] font-bold tracking-[-0.01em]`, with extrabold reserved for page and section headings.

## Run

End users run it against their own project, with no install:

```sh
npx blue-spec dashboard
```

That serves the built client and opens the browser on the workspace's `.bluespec/`.

Local development in this repo:

```sh
npm run dashboard:dev      # Vite dev server with HMR, proxying data to the node server
npm run dashboard:build    # build the client into lib/dashboard
npm run typecheck
```

The server prints its URL. By default it binds port `0`, so the OS hands back a free port that never conflicts (set `PORT` to pin one, where it climbs on conflict). In `npm run dashboard:dev`, the browser opens on the Vite URL: client edits hot-swap modules in place (state survives), while the node server, pinned on port `3001` behind Vite's proxy, keeps watching `.bluespec/` and reloads the page on any edit there. Nothing is written to disk in dev, Vite serves the client from memory.

## How it fits together

- **Server** (`server/`): a `node:http` server, runtime-agnostic across Node, Bun, and Deno.
  - `start.ts` is the reusable entry: it resolves the paths, listens (port `0` by default, climbing only when `PORT` pins a busy one), opens the browser, and stays up until `SIGINT`. The `dashboard` CLI command and the dev entry (`tools/dashboard-serve.ts`) both call it.
  - `data/` parses the Markdown memories, `tracking.json`, and `manifest.json` into one typed `DashboardData` object, served at `GET /api/data`. Understanding markdown is deliberately not our code: the `markdown/` module asks `mdast-util-from-markdown` (micromark, the same CommonMark engine behind the website's Docusaurus, bundled at build time so the published package still needs zero runtime installs) which lines are code and which spans are HTML comments. Code of any kind (fenced, indented, diffs, mermaid diagrams) is never structure, and comments are stripped before any parsing without ever touching code or inline code. Only the domain mapping is manual: which heading opens a section, which `- **Field:**` line is a field, what goes where. An h1 ends any section, and h4 to h6 stay inside the block they annotate, out of the extracted prose. Field lines are read by a staged grammar (`fieldValue`) whose canonical shape is the template's and whose fallbacks absorb common LLM punctuation drift: any list marker (`-`, `*`, `+`), optional bold (`**` or `__`), case-insensitive field name, then a required separator (colon canonically, em or en dash, or a spaced hyphen). The separator is what keeps prose from matching, and the value is never rewritten. Never hand-roll markdown lexing here (fence pairing, comment masking): extend the mapping over the tree instead.
  - `live-reload.ts` watches `.bluespec/`, streaming a reload over `GET /events` (SSE).
  - `static-files.ts` serves the built client, guarded against path traversal.
  - The server reads `.bluespec/` from the invoking working directory and the client from the packaged location, never from `src/`.
  - **Actions** (`actions.ts`, `guards.ts`, `session.ts`): the Settings route runs real commands (Install, Pull, Update, Specialize) through `POST /api/actions/*`, in-process via the CLI's own pure-fs core. Every change must preserve these invariants:
    - **No shell, eval, or subprocess, ever.** Nothing from a request reaches one. The core writes only a fixed code-defined set under `.bluespec/` and the agent command dirs, never an arbitrary path or content.
    - **Fail-closed payloads.** Dispatch is a code-defined `Map` keyed by pathname, never a lookup on a request value. Any key beyond the action's declared fields is rejected (so `__proto__`, `constructor`, `prototype` never pass), values pass only by exact `Set` membership against `AGENT_SPECS` / `SKILL_GROUPS`, are checked with plain types (no regex), and are rebuilt into a fresh object, never spread or merged.
    - **`Host` first, every route.** A request must carry a loopback `Host` (or a dev host from `tools/dashboard-serve.ts`), checked before anything else, so a rebound domain reaches nothing.
    - **Cross-origin locked out.** `GET /api/session`, `GET /api/data`, and every action reject a `Sec-Fetch-Site` that is present and not `same-origin`, so a cross-origin page is never handed the token or data (page script cannot forge that header). No response carries a CORS header and `OPTIONS` is never answered, so preflights fail closed.
    - **Token.** A 256-bit value regenerated per start, written to a `0600` file in the OS temp dir (`session-<pid>.token`) so it is never world-readable at rest. Actions additionally require it in `x-bluespec-token` (compared with `timingSafeEqual`) and an exact loopback or dev `Origin`.
    - **Bounded input, serialized writes.** Bodies are `application/json`, ≤16KB, `JSON.parse`d, and cut off by a 5s read timeout so a slow-loris body cannot pin the single-flight lock. One action runs at a time (409 when busy).
    - **Hardened responses.** Every response sends `nosniff`, and HTML adds `frame-ancestors 'none'` and `x-frame-options: DENY` against clickjacking. Errors are generic to the browser, detailed only in the terminal with newlines neutralized. Success needs no refetch: the `.bluespec/` write triggers the SSE reload.
    - **Residual.** The boundary is loopback plus token, not UID isolation: on loopback TCP another local process can still reach the surface. The dashboard targets a single-user workstation. Closing this would need a Unix-domain socket (`0600`), deferred until a multi-user need is real.
- **Client** (`client/`): a Preact single-page app.
  - `components/` and `routes/` are Preact components; `main.tsx` owns the render root and `app.tsx` the routing, with signals for state, search, filters, and theme. A route with several parts keeps them under a `components/<route>/` folder (see `components/settings/`). Blocks that display artifact prose render through `components/admonition.tsx`, the dashboard's equivalent of the website's docs admonitions: `note`, `info`, `tip`, `warning`, and `danger`. Each kind sets one accent (`--adm`) and the `admonition` utility in `styles/index.css` derives every internal color from it (surface, border, heading, body, inline code, text selection), the same mechanism as the website's `docs.css`. Reuse it, picking the kind by what the text means, instead of hand-tinting a card.
  - `styles/` is a token-driven design system (light and dark), imported by `main.tsx` and bundled by the Tailwind Vite plugin. Typography matches the website's docs and loads from Google Fonts in `index.html` (nothing shipped in the package). The layout must stay responsive down to a minimum resolution of 1024x768px.
  - Below 1280px, prefer vertical alignments and single-column layouts. At 1280px and above, prefer grid layouts and horizontal alignments.
- **Shared** (`shared/`): runtime metadata both sides import (skill labels and group badges, severity ordering). It derives from the core's own data, never duplicates it: the agent list comes from `src/providers/specs.ts`, the specialization categories from `src/hooks/skills/groups.ts`, and the skill-to-group mapping from `src/hooks/skills/catalog.ts`. Those core modules stay import-safe for the browser (pure data, type-only imports).
- **Types**: the shared data contract and the server/client-internal types live in `src/types/dashboard/`, the single source of truth both sides import.
- **Build** (`src/dashboard/vite.config.ts`): Vite with `@preact/preset-vite` and `@tailwindcss/vite`, entered through `client/index.html`, always emitting to `lib/dashboard` with hashed bundle names. `client/public/assets/` (icons and images, referenced as `/assets/...`) is copied verbatim. There is no dev output directory, `vite dev` serves everything from memory.

## Security context

Read all, one at a time:

- [spec/skills/javascript.md](../../../spec/skills/javascript.md)
- [spec/skills/network.md](../../../spec/skills/network.md)
- [spec/skills/http-request.md](../../../spec/skills/http-request.md)
- [spec/skills/access-control.md](../../../spec/skills/access-control.md)
- [spec/skills/crypto.md](../../../spec/skills/crypto.md)
- [spec/skills/interpreter.md](../../../spec/skills/interpreter.md)
- [spec/skills/path.md](../../../spec/skills/path.md)
- [spec/skills/browser.md](../../../spec/skills/browser.md)
- [spec/skills/regex.md](../../../spec/skills/regex.md)

## Routes

`#/` overview · `#/findings` and `#/findings/:id` · `#/sidequests` · `#/charter` · `#/skills` · `#/settings`.

Add `?theme=dark` to the URL to force a theme.
