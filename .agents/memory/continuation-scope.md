---
name: Existing ScanMyOwner continuation scope
description: User constraints for continuing the imported project and verifying activation.
---

Continue the existing ScanMyOwner project without rebuilding or redesigning the website. Use the existing setup and dependencies, make only essential fixes, and keep credit usage to an absolute minimum.

**Why:** The user explicitly requested preservation of the imported project and minimal Agent actions.

**How to apply:** Inspect first, report blockers before substantial changes, and avoid unnecessary installations or builds.

The user says the Render backend is already live and the current goal is connecting the existing frontend to it. Do not invent its public URL or ask for secrets; the user will set `VITE_API_URL` in Cloudflare Pages to their actual Render public URL.

**Why:** The user explicitly limited this work to the frontend API connection, without changes to UI, database/schema, QR logic, payments, or unrelated files.

**How to apply:** Verify existing configuration before duplicating changes. Keep inspections narrow and distinguish build-environment blockers from errors caused by the requested change.

Do not create tables, change the database schema, activate real customer cards, or add OTP, payment, or call-masking features during continuation verification. Never expose owner phone numbers, secret keys, or private data in public API responses.

**Why:** The user explicitly set these scope and privacy restrictions.

**How to apply:** Keep verification mocked or non-mutating unless the user provides new explicit authorization. Check the new account's environment-variable names separately without printing values.
