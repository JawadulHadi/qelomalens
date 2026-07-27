# Deployment (zero-cost: Supabase Free + Vercel Hobby)

This deploys QelomaLens's frontend and API to Vercel, and its auth/database
to Supabase — both free tiers, no credit card charge.

## 1. Create the Supabase project

1. Sign in at [supabase.com/dashboard](https://supabase.com/dashboard) and
   create a new project (Free tier). Pick a region close to your users —
   Vercel's default function region is `iad1` (US East), so a nearby Supabase
   region minimizes latency.
2. Install the CLI and link it to the project:
   ```bash
   npm i -g supabase
   supabase login
   supabase link --project-ref <your-project-ref>
   ```
3. Push the schema in `supabase/migrations/`:
   ```bash
   supabase db push
   ```
   This creates the `profiles` and `input_envelopes` tables, their RLS
   policies, and the auto-profile-on-signup trigger. See
   [ARCHITECTURE.md](./ARCHITECTURE.md#auth--tenancy) for what each table is
   for.
4. In **Project Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (server-only — never
     put this in a `VITE_*` variable, it would ship to the browser)
5. In **Authentication → URL Configuration**, once you have a Vercel URL
   (step 2 below), set **Site URL** to it and add it to **Redirect URLs**.
   This is required for magic-link emails to redirect back to the right
   place — until it's set, magic links will point at `localhost`.

Email/password sign-in works immediately with Supabase's default settings.
Email confirmation is off by default in the local `supabase/config.toml`
(`enable_confirmations = false`); the hosted project defaults to requiring
confirmation — toggle it in **Authentication → Providers → Email** if you
want instant sign-in without a confirmation email during a demo.

## 2. Deploy to Vercel

1. Push this repo to GitHub (see the main [README](./README.md#deploying-your-own-copy)
   if you haven't already), then import it at
   [vercel.com/new](https://vercel.com/new). Vercel auto-detects the Vite
   framework preset; `vercel.json` in this repo supplies the build command,
   output directory, and the `/v1` + `/health` API rewrites.
2. Add environment variables in **Project Settings → Environment Variables**:

   | Variable | Value | Notes |
   |---|---|---|
   | `GEMINI_API_KEY` | your Gemini API key | from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
   | `SUPABASE_URL` | from step 1.4 | server-only |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 1.4 | server-only, keep secret |
   | `VITE_SUPABASE_URL` | from step 1.4 | same value as `SUPABASE_URL`, but must be duplicated under the `VITE_` name so Vite inlines it client-side |
   | `VITE_SUPABASE_ANON_KEY` | from step 1.4 | safe to expose — RLS is the real gate |
   | `MAX_FILE_SIZE_MB` | `4` | **important** — see the size-limit note below |
   | `SINGLE_TENANT_MODE` | `true` | keep the demo tenant behavior |
   | `AI_ENABLED` | `true` | |

3. Deploy. Once live, go back and set Supabase's **Site URL** /
   **Redirect URLs** (step 1.5) to the Vercel URL.

### Request size limit on Vercel

Vercel Functions hard-cap request/response bodies at **4.5 MB**, on every
plan, and this is not configurable. This repo's default
`MAX_FILE_SIZE_MB=25` (fine for local dev or a non-Vercel host) will not
help on Vercel — files larger than ~4 MB will fail with `413
FUNCTION_PAYLOAD_TOO_LARGE` before the app's own limit is ever checked. Set
`MAX_FILE_SIZE_MB=4` in your Vercel project's env vars. If you need larger
uploads in production, the two realistic options are: (a) host the API on a
platform without this ceiling (Render, Fly.io, a VM) while keeping the
frontend on Vercel, or (b) upload directly to Supabase Storage from the
browser with a signed URL and have the function fetch from there instead of
receiving the raw multipart body — neither is implemented here, both are
reasonable follow-ups.

### Max function duration

Vercel Functions on Hobby default to a 300-second (5 minute) max duration
with Fluid Compute (the current default), which is set explicitly to 60s for
`api/index.ts` in `vercel.json` — comfortably above what a Gemini call plus
document parsing needs, while still bounding a runaway request.

## 3. Verify

```bash
curl -s https://<your-app>.vercel.app/health
curl -s https://<your-app>.vercel.app/v1/capabilities
```

`health` should report `"persistence":"supabase"` — if it still says
`"in-memory"`, double check `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are
set on the Vercel project and redeploy (env var changes require a new
deployment to take effect).

## Local development

Local dev never touches Vercel or requires Supabase to be configured — the
app degrades to an in-memory store and a "Sign in not configured" notice in
place of the auth dialog. Copy `.env.example` to `.env` and fill in at least
`GEMINI_API_KEY` to exercise the real AI path; everything else has a sane
default.

```bash
npm install   # or: bun install
npm run dev
```
