# Deploy SANTRA AI to Cloudflare Workers (GitHub CI)

This repo deploys to **Cloudflare Workers** via [OpenNext](https://opennext.js.org/cloudflare) on every push to `main`.

## One-time setup

### 1. Cloudflare API token

1. Open [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. **Create Token** → use template **Edit Cloudflare Workers**
3. Copy the token

### 2. GitHub repository secrets

In **GitHub → Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | Token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | `303166617afd86d1fdf690d4b3964d57` |

### 3. Worker environment variables

In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → `santra-ai-neurox` → **Settings** → **Variables**, add production env vars (minimum):

| Variable | Notes |
|----------|--------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | `santra` |
| `SENTRA_APP_URL` | `https://santra-ai-neurox.<account>.workers.dev` (update after first deploy) |
| `NEXT_PUBLIC_APP_URL` | Same as `SENTRA_APP_URL` |
| `CRON_SECRET` | Long random string for `/api/cron/monitors` |
| `EXA_API_KEY` | Exa fallback search |
| `AIML_API_KEY` | LLM provider (or Featherless/OpenAI) |

Optional: Bright Data, Band.io, Speechmatics — see `.env.example`.

Or set secrets via CLI (from repo root, after first deploy):

```bash
npx wrangler secret put MONGODB_URI
npx wrangler secret put CRON_SECRET
# repeat for other secrets
```

### 4. Cron (scheduled monitors)

Add a Cron Trigger in the Worker settings, or extend `wrangler.jsonc`:

```jsonc
"triggers": {
  "crons": ["*/30 * * * *"]
}
```

Then route cron to `GET /api/cron/monitors` with `Authorization: Bearer <CRON_SECRET>`.

## Manual deploy (local)

```bash
npm install
npm run deploy:cf
```

Requires `npx wrangler login` on your machine.

## Connect GitHub in Cloudflare (alternative)

Instead of GitHub Actions, you can use **Workers Builds**:

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. **Connect to Git** → select `AhamedAAHA/Santra_AI_NeuroX`
3. Build command: `npm run deploy:cf`
4. Add environment variables in the dashboard

## Smoke test

1. Open `https://santra-ai-neurox.<subdomain>.workers.dev`
2. **Settings** → integrations show Ready
3. **Alerts** → create monitor → **Check now**
4. **Action Queue** → approve/reject flow works

## Notes

- Netlify config (`netlify.toml`) remains for optional dual-host; primary CI path is Cloudflare.
- Long API routes (`maxDuration` up to 300s on Netlify) may hit Cloudflare Worker CPU limits — monitor batch size if cron fails.
