# Deploy SANTRA AI on Vercel

## Live project

- **Project:** `santra-ai-neurox`
- **GitHub:** [AhamedAAHA/Santra_AI_NeuroX](https://github.com/AhamedAAHA/Santra_AI_NeuroX) (connected)
- **Production URL:** https://santra-ai-neurox.vercel.app

## Manual deploy

```bash
cd Santra_AI_NeuroX
vercel link --yes --project santra-ai-neurox
vercel deploy --prod --yes
```

## Required production env vars

Set in Vercel → Project → Settings → Environment Variables:

| Variable | Notes |
|----------|--------|
| `MONGODB_URI` | MongoDB Atlas SRV URI |
| `MONGODB_URI_DIRECT` | Optional direct URI if SRV DNS fails |
| `MONGODB_DB_NAME` | `santra` |
| `SENTRA_APP_URL` | `https://santra-ai-neurox.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Same as above |
| `CRON_SECRET` | Random string for `/api/cron/monitors` |
| `EXA_API_KEY` | Exa fallback search |
| `SENTRA_ALLOW_DEMO_FALLBACK` | `true` if no LLM key yet |
| `BAND_*` | Optional HITL notifications |
| `GITHUB_OAUTH_CLIENT_ID` | GitHub OAuth (see `docs/MONGODB_OAUTH.md`) |
| `GITHUB_OAUTH_CLIENT_SECRET` | GitHub OAuth secret |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth secret |
| `AIML_API_KEY` | Live LLM chat + monitor synthesis ([aimlapi.com](https://aimlapi.com)) |
| `FEATHERLESS_API_KEY` | Optional alternate LLM provider |

## Cron (Hobby plan)

`vercel.json` runs monitor checks **once daily** at 06:00 UTC (`0 6 * * *`).  
Hobby accounts cannot use `*/30 * * * *`. Upgrade to Pro for 30-minute schedules, or trigger checks manually from `/alerts`.

## MongoDB Atlas

Atlas → **Network Access** → allow `0.0.0.0/0` (or Vercel IP ranges) so serverless functions can connect.

## Smoke test

1. https://santra-ai-neurox.vercel.app/sign-in — create account (MongoDB-backed)
2. `/alerts` → create monitor → **Check now**
3. `/chat` — competitor question (demo LLM if no AIML key)
