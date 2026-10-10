---
name: Supabase key handling
description: Keep privileged Supabase credentials out of browser bundles and verify table grants separately.
---

Use only the public anon/publishable key in ScanMyOwner's Vite/browser code. Never place a service-role or secret key in a `VITE_` variable.

**Why:** Vite variables are bundled for visitors to the website; privileged Supabase keys can bypass intended access controls.

**How to apply:** Keep browser initialization on the public key. Add any privileged operation later through a protected server-side path, with the least permissions needed.

Supabase API-key acceptance and table privileges are separate checks. A successful REST schema-root request does not prove that the role can read individual tables; `42501` on a table request indicates a missing PostgreSQL object grant, even when the key is server-side.

**Why:** Secret keys bypass row-level security, but Postgres table grants are still evaluated.

**How to apply:** Probe each existing table with a zero-row read and distinguish gateway authentication from table permissions. Do not create tables or change grants without the user's authorization.

A Supabase service-role key used through PostgREST is not a SQL migration connection and cannot install database functions or other DDL.

**Why:** API access and schema-administration access are separate capabilities; treating a working REST key as migration access can leave code dependent on a function that was never installed.

**How to apply:** Keep schema changes in reviewed SQL migrations and apply them through an authorized Supabase SQL/migration connection. If that connection is unavailable, report the migration as unapplied and make the API fail closed until it exists.
