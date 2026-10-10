# ScanMyOwner

A vehicle QR contact tag demo with an API-backed card lookup and activation flow.

## Run & Operate

- Start `artifacts/scanmyowner: web` in Replit Workflows — runs the website at `/`.
- Start `artifacts/api-server: API Server` — runs the API at `/api`.
- These managed workflows supply `PORT` and `BASE_PATH`; do not run the frontend dev command without them.
- The imported Canvas workflow is optional and is not needed to run the website.
- `pnpm install --frozen-lockfile` — install the existing workspace dependencies.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-server test` — API activation tests using a mocked Supabase service; no customer records are touched.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `curl http://localhost:80/api/healthz` — API health check; expected response: `{"status":"ok"}`.
- The marketing site can run without Supabase. QR lookup and activation require `SUPABASE_SERVICE_ROLE_KEY` in Replit Secrets and `VITE_SUPABASE_URL` for the API.
- QR activation also requires the server-only `QR_ACTIVATION_HMAC_KEY` secret (exactly 64 hexadecimal characters representing 32 random bytes). The activation API fails closed if it is missing or malformed. Never put this key in a `VITE_` variable, logs, or generated package files.
- Generate private package claim-code inserts from one QR code per input line with `pnpm --filter @workspace/api-server run generate:claim-codes < private-qr-codes.txt`. The generated CSV is written under ignored `generated-artifacts/`; keep it private, use it only to prepare matching sealed package inserts, and remove it after fulfillment.
- Every shipped QR tag needs its matching private claim code inside its package. The activation form requires that code before the existing atomic RPC is called. No database schema change or external OTP/payment service is used.
- Deploy the API update before applying `supabase/migrations/20261010000000_atomic_qr_activation.sql` to the existing Supabase database. Activation fails closed until the restricted transaction function is installed, avoiding the old multi-request write path during that gap.
- Supabase requests use the service-role key only on the API server. Public QR responses expose only card state; activation requires a matching private package claim code, stores owner and vehicle details in `registrations`, and never returns the owner's phone number or claim code.
- If an imported workflow reports `vite: not found` or missing `esbuild`, restore dependencies with `pnpm install --frozen-lockfile`, then restart the managed workflows.
- The unused database library requires `DATABASE_URL` if database-backed features are added later. No database was provisioned or migrated during import setup.

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19, Vite 7, Tailwind CSS 4, Wouter
- API: Express 5
- DB library: PostgreSQL + Drizzle ORM (not used by the current app)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/scanmyowner/` — website; pages in `src/App.tsx`, styles in `src/index.css`, brand images in `public/brand/`.
- `artifacts/api-server/` — Express server; exposes `/api/healthz` and QR lookup/activation endpoints. Activation delegates both database writes to one transaction RPC.
- `artifacts/mockup-sandbox/` — imported optional canvas component previews.
- `lib/api-spec/`, `lib/api-client-react/`, `lib/api-zod/` — shared API contract and generated clients/validation.
- `lib/db/` — unused database library.
- Each artifact's `.replit-artifact/artifact.toml` defines managed services and proxy routing.

## Architecture decisions

- Import setup preserves the existing structure and stack. Keep the Supabase service-role key server-side; do not add it to browser variables or responses.
- The API and frontend use Replit's shared path-based proxy; no additional Vite proxy is needed.

## Product

- Marketing homepage, pricing, how-it-works, FAQ, and contact pages.
- Vehicle/tag customization and a sample tag page at `/t/demo123`.
- Login and checkout remain frontend previews; they do not authenticate users or charge buyers. Owner-contact requests are also a preview and do not send messages.

## Gotchas

- Run the app through its managed workflows so the required port and base-path configuration is supplied.
- Do not provision a database just to launch the frontend demo.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
