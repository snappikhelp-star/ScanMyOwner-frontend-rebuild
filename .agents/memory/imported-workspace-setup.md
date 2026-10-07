---
name: Imported workspace setup
description: Runtime registration and package-installer limitations encountered when setting up an imported workspace.
---

Imported artifact metadata can exist on disk while the runtime artifact and workflow lists are empty. Do not assume the app is absent or create duplicate scaffold directories.

**Why:** During import setup, existing metadata was present but the runtime lists were empty; validating the existing metadata caused its artifacts and managed services to become available.

**How to apply:** Compare runtime registration with the imported metadata before deciding to scaffold a new app. Preserve the existing structure and use validated metadata updates rather than replacement workflows.

The package-install callback requires a nonempty package list and can fail at a pnpm workspace root because it invokes an add operation without workspace-root opt-in.

**Why:** Both limitations were observed while trying to restore existing imported dependencies.

**How to apply:** Distinguish restoring the lockfile's dependencies from adding a new package; do not add unrelated dependencies merely to trigger installation.
