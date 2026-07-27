# Architecture

QelomaLens is a single Vite/Express codebase split into a thin REST gateway,
a normalizer/capability pipeline, and a React reference client. This document
describes how the pieces fit together and the decisions behind them.

## Request flow

```
 Browser (React)
   │  fetch('/v1/...', { headers: { 'X-API-Key', 'Authorization' } })
   ▼
 Express app (src/app.ts)
   │  CORS, JSON/urlencoded body parsing, /health
   ▼
 v1Router (src/gateway/v1.router.ts)
   │  resolves tenant from X-API-Key, user from Authorization bearer token
   ▼
 IngestionService (src/ingestion/ingestion.service.ts)
   │  normalizes PDF/DOCX/image/text → InputEnvelope, persists it
   ▼
 OrchestratorService (src/orchestrator/orchestrator.service.ts)
   │  runs a CapabilityPlugin: Gemini first, confidence-gated
   ▼
 GeminiProvider ──(low confidence / error)──▶ RuleBasedProvider
   (src/ai/gemini.provider.ts)                (src/ai/rule-based.provider.ts)
```

Every capability (`SUMMARIZE`, `EXTRACT_FACTS`, `VERDICT`, `COMPARE`,
`BREAKDOWN`, `NEXT_ACTIONS`, `GENERATE`) is a self-describing plugin
(`src/capabilities/*/*.capability.ts`) registered in
`CapabilityRegistry`. The orchestrator never lets a capability hard-fail:
if Gemini errors, times out, or returns a result below the plugin's
`confidenceGate`, it falls back to that plugin's deterministic rule-based
implementation instead.

## Two "never hard-fail" fallback layers

This is the core design principle carried through the whole stack — every
external dependency has a deterministic fallback:

| Layer | Primary | Fallback | Controlled by |
|---|---|---|---|
| Capability execution | Gemini 2.5 Flash | Rule-based plugin logic | `AI_ENABLED`, `GEMINI_API_KEY` |
| Input envelope persistence | Supabase Postgres | In-process `Map` | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` |

The persistence fallback is new: `IngestionService` (in
`src/ingestion/ingestion.service.ts`) writes every `InputEnvelope` to Supabase
when configured, and to an in-memory `Map` otherwise. **The in-memory path is
for local development only** — it does not survive across separate
serverless function invocations, so a Vercel deployment without Supabase
configured would silently lose the document between the "upload" and "run
capability" requests. Configuring Supabase is what makes the
upload → analyze → chat flow actually work once deployed (see
[DEPLOYMENT.md](./DEPLOYMENT.md)).

## Auth & tenancy

Two independent identity concepts travel on two separate headers:

- **`X-API-Key`** — the tenant/workspace key (`TenancyService`,
  `src/tenancy/tenancy.service.ts`). In `SINGLE_TENANT_MODE` (the default)
  every request resolves to the same demo workspace regardless of key value.
  This is a coarse-grained "which workspace" concept, not user identity.
- **`Authorization: Bearer <token>`** — the end user's Supabase session
  access token, verified server-side via `supabase.auth.getUser(token)`
  (`src/lib/supabase.server.ts`). This resolves a `userId` used purely to
  scope `input_envelopes` rows: a row with a `user_id` can only be read back
  by that same user; anonymous rows (`user_id IS NULL`, i.e. someone tried
  the app without signing in) stay open, matching the product's
  try-before-you-sign-up flow.

Row Level Security enforces this at the database layer for defense in depth
(see `supabase/migrations/20260727120000_init_schema.sql`): the
`input_envelopes` table has RLS enabled with **no** policies for
`anon`/`authenticated`, so it's reachable only via the backend's
`service_role` key — never directly from the browser, even if the table were
ever exposed through Supabase's Data API.

## Frontend

- `src/hooks/useAuth.tsx` wraps `@supabase/supabase-js` auth (email/password
  + magic link) behind a React context, exposed app-wide via `AuthProvider`
  in `src/main.tsx`.
- `src/api/client.ts` attaches both the demo `X-API-Key` and, when signed in,
  the current Supabase access token as `Authorization: Bearer`.
- `src/App.tsx` is a single-page state machine (`empty` → `ingesting` →
  `ready` → `conversation`) rendered through three interchangeable "shells"
  (full-page workspace, docked side panel, floating widget) — a demonstration
  of embedding the same reference client in different host contexts.

## Deployment topology

```
              ┌─────────────────────────────┐
Browser  ───▶ │ Vercel                      │
              │  • dist/  (static, Vite)    │
              │  • api/index.ts (Node fn)   │──▶ Google Gemini API
              └─────────────────────────────┘
                          │
                          ▼
              ┌─────────────────────────────┐
              │ Supabase (free tier)        │
              │  • Auth (users, sessions)   │
              │  • Postgres (profiles,      │
              │    input_envelopes)         │
              └─────────────────────────────┘
```

`vercel.json` rewrites `/health` and `/v1/:path*` to the single serverless
function in `api/index.ts`, which re-exports the same Express app used by
`server.ts` for local dev (`src/app.ts` is the shared factory) — there is
exactly one implementation of the gateway, not a fork per environment.
