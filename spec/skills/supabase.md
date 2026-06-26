# Supabase backend vulnerabilities

> - This knowledge extends your judgment. Apply what fits the project and keep reasoning beyond the list.
> - Source: Supabase Docs, "Understanding API keys", "Securing Edge Functions", and "Row Level Security", plus CVE-2025-48757 (missing RLS on auto-exposed tables).

## Rules

- This skill audits and explains.
- By default, it never rewrites your code.

## What to look for

This terrain is the **Supabase backend a client talks to directly**: the Postgres database auto-published as a REST API (PostgREST), the two-tier key model (`anon`/publishable vs `service_role`/secret), and the Row-Level Security that is the only wall between them. The browser holds the project URL and a key and reaches the database directly, so every access decision must hold **in the database**, never in the UI that called it. This is where AI generators (Lovable and similar) ship insecure by default: a generator cannot infer your access rules, and Supabase leaves a table open until someone writes them. The general authorization mechanics live in `access-control`, key handling in `crypto`, the function layer in `serverless`, client-side key exposure in `browser`. Here they become Supabase-specific: a missing policy is world-readable data, a leaked `service_role` key is total bypass.

### RLS disabled on auto-exposed tables

Supabase publishes every `public`-schema table through an auto-generated REST API. A table created by raw SQL or a migration (the path generators use) ships with Row-Level Security **off**, while the dashboard Table Editor enables it by default. With RLS off the table is readable, usually writable, by anyone who lifts the URL and `anon` key from the bundle and calls the REST endpoint directly. This is the root cause of CVE-2025-48757, where hundreds of endpoints across scaffolded apps were queryable with no session at all, exposing emails, payment data, and other API keys. The danger is the migration-created table that works and returns data yet carries no policy:

```sql
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  data jsonb
);
-- RLS off: anyone with the public anon key reads and writes every row.
```

Safer shape: enable RLS on every table in `public`, then attach an explicit per-operation policy scoped to the row owner, since RLS is deny-by-default once on and each operation you intend to allow needs its own policy.

```sql
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own" ON public.projects
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "insert own" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
-- repeat FOR UPDATE (USING + WITH CHECK) and FOR DELETE (USING).
```

Wrap the call as `(select auth.uid())` so Postgres evaluates it once per query, not once per row. Make future tables start protected too, through the dashboard's automatic-RLS setup or a DDL event trigger. Verify from the outside, not by reading code: query the REST endpoint with only the `anon` key and no session, per table, since RLS is per-table. Any rows returned mean the table is exposed.

### Overly-permissive or AI-misgenerated RLS policies

Enabling RLS is necessary but not sufficient. A policy whose predicate is always true, or one that checks only that the caller is authenticated and never that they own the row, re-opens the table while the dashboard still shows RLS "on", and nothing warns you it is too broad. Such a policy passes for the developer's own account yet serves everyone else's data.

```sql
-- Dangerous: predicate is always true, every row goes to every caller.
CREATE POLICY "all access" ON public.profiles FOR SELECT USING (true);
```

Safer shape: make every policy ownership-scoped, comparing `(select auth.uid())` against the row's owner column, and reserve a deliberate `USING (true)` for a table that is genuinely public-read and holds no user data. Audit policies through `pg_policies` and Supabase's Security Advisor, and above all **test across user boundaries**: authenticate as user A, request a resource owned by user B, confirm it is denied (the broader cross-tenant and ownership reasoning lives in `access-control`).

### The anon / service_role / secret key model

The **`anon` (publishable) key is meant to be public**: it sits in the browser by design and is safe there **only when RLS is correct**, since it permits exactly what your policies allow. Mistaking it for a secret breeds false comfort ("nobody has the key", so RLS is left off) when the key is in plain sight in the bundle. The **`service_role` key bypasses Row-Level Security entirely** for trusted server use, so shipping it to the browser is total compromise: anyone who opens DevTools reads, modifies, or deletes any row in any table, and correct policies cannot help a privileged caller. Generators have bundled secret keys into client config when the flow did not distinguish public from secret keys.

Safer shape: treat the `anon` key as public (the database's address, not its password) and get RLS right instead of trying to hide it. Keep the `service_role` key and Supabase's newer `secret` keys **only in Edge Functions and server environments**, never in a client file or a `VITE_`/`NEXT_PUBLIC_`-prefixed variable (the bundler inlines those). Secret keys reject browser use, but the legacy JWT `service_role` key has no such guard, so do not rely on the platform to catch it. Search the deployed bundle and git history for `service_role` and for the key value: any secret key that ever reached the client is compromised and must be **rotated**, then moved server-side (key handling lives in `crypto`, the Edge Function that should hold it in `serverless`).

## How to act on the result

- **In detect (detection):** each table exposed without a correct, ownership-scoped policy, and each secret key reachable from the client, is a finding, named by its risk block above. Describe it in plain language: what it is (an RLS-off or always-true table, an `anon` key mistaken for a secret, a `service_role` key in the bundle), why it matters (world-readable or world-writable data, cross-user exposure, total RLS bypass), and the evidence (the `pg_policies` row, the REST probe that returned data, the bundle location of the key). It flows through detect's normal steps and is tracked like any other finding.
- **In verify (proof):** prove each control empirically from outside the app, not by reading the dashboard. The closed conditions: an `anon`-key request with no session returns nothing for every `public` table, a cross-account request (user A for user B's row) is denied, no policy rests on `USING (true)` over user data, and no `service_role` or `secret` key appears in any client file, bundle, or `VITE_`/`NEXT_PUBLIC_` variable (and any that ever did is rotated). If an unauthenticated or cross-account caller can still read or write through the REST API, or a secret key is still reachable from the browser, the risk is not closed: record it as such and point back to harden.
