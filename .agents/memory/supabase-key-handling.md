---
name: Supabase key handling
description: Keep privileged Supabase credentials out of browser bundles.
---

Use only the public anon/publishable key in ScanMyOwner's Vite/browser code. Never place a service-role or secret key in a `VITE_` variable.

**Why:** Vite variables are bundled for visitors to the website; privileged Supabase keys can bypass intended access controls.

**How to apply:** Keep browser initialization on the public key. Add any privileged operation later through a protected server-side path, with the least permissions needed.
