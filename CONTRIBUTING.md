# Contributing

Thanks for considering a contribution to QelomaLens.

## Setup

```bash
npm install   # or: bun install
cp .env.example .env   # fill in GEMINI_API_KEY at minimum
npm run dev
```

## Before opening a PR

```bash
npm run lint   # tsc --noEmit — this repo has no separate test suite yet
```

- Keep new capability plugins self-contained under
  `src/capabilities/<name>/`, following the existing `CapabilityPlugin`
  interface (`src/capabilities/capability.interface.ts`) — every capability
  needs both a Gemini prompt template and a deterministic `fallback()`.
- Don't remove a fallback path. The one rule that shapes this whole codebase
  is that a missing API key, a low-confidence AI response, or a missing
  Supabase config should degrade gracefully, never throw a 500.
- No real names, emails, or documents in fixtures or examples — use
  `Jane Doe / jane@mailinator.com` style placeholders.
- Match the existing design tokens in `src/index.css`
  (`--ol-brand`, `--ol-accent`, etc.) rather than hardcoding colors.

## Reporting issues

Open a GitHub issue with steps to reproduce. For security issues, please
avoid filing a public issue — see below.

## Security

If you find a security vulnerability, please report it privately rather than
opening a public issue (see the repository's Security tab for a private
advisory). Never include real API keys, tokens, or credentials in an issue
or PR.
