# SANTRA AI

**Autonomous GTM intelligence for B2B revenue and competitive intel teams.**

SANTRA AI monitors competitors, collects live web evidence, synthesizes executive briefs, and queues CRM automation for human approval before anything executes.

**Live:** [santra-ai-neurox.vercel.app](https://santra-ai-neurox.vercel.app)  
**Repository:** [neurox-1-0/Santra_AI_Prompt_Pirates](https://github.com/neurox-1-0/Santra_AI_Prompt_Pirates)

---

## Product surface

| Module | Purpose |
|--------|---------|
| **Command Center** | Signal overview, risk snapshot, workspace home |
| **Strategy Desk** | Ask / Market chat with optional live voice |
| **GTM Monitors** | Plain-language watches, checks, HITL action queue |
| **Reports** | Executive briefs, evidence, action plans, history |
| **Settings** | Voice, display, privacy, integration health |

---

## Agent loop

1. **Goal intake** — plain-language monitor requirement  
2. **Intent reasoning** — category, severity, search query, target URL  
3. **Tool routing** — Bright Data SERP / Web Unlocker / MCP, Exa  
4. **Evidence + change detection** — snapshot diffs and signal classification  
5. **Executive synthesis** — verdict, risks, opportunities, action plan  
6. **Human-in-the-loop** — approve before webhook / CRM delivery  

---

## Tech stack

- **App:** Next.js 15 · React 19 · TypeScript · Tailwind CSS  
- **Data:** MongoDB Atlas (primary) · optional Supabase legacy  
- **Auth:** Email + GitHub/Google OAuth (Mongo workspace)  
- **LLM:** AIML / Featherless / OpenAI-compatible providers  
- **Voice:** Speechmatics realtime STT + TTS  
- **Evidence:** Bright Data · Exa search  
- **Deploy:** Vercel (primary) · Netlify / Cloudflare optional  

---

## Quick start

**Requirements:** Node.js 20+

```bash
git clone https://github.com/neurox-1-0/Santra_AI_Prompt_Pirates.git
cd Santra_AI_Prompt_Pirates
npm install
cp .env.example .env.local
```

Fill at least:

- `MONGODB_URI` — MongoDB Atlas connection string  
- `AIML_API_KEY` (or another configured LLM key)  
- Optional: `SPEECHMATICS_API_KEY`, Bright Data / Exa keys, OAuth client IDs  

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development (port **3001**) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript validation |
| `npm test` | Vitest unit/integration tests |
| `npm run test:e2e` | Playwright smoke tests |

---

## Environment

See [`.env.example`](.env.example) for the full template. Grouped sections:

- App URLs & timezone  
- MongoDB Atlas  
- OAuth (GitHub / Google)  
- LLM providers (AIML, Featherless, OpenAI)  
- Bright Data / Exa  
- Speechmatics voice  
- Cron / webhook secrets  

**Never commit `.env.local`.**

---

## Project layout

```text
src/
  app/            # App Router pages + API routes
  components/     # UI (dashboard, chat, reports, landing)
  services/       # Monitor check, LLM, voice, Bright Data
  lib/            # Auth, GTM, webhooks, Mongo, voice helpers
  types/          # Shared TypeScript models
docs/             # Deploy, OAuth, architecture guides
```

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md)  
- [Deploy on Vercel](docs/DEPLOY_VERCEL.md)  
- [MongoDB OAuth](docs/MONGODB_OAUTH.md)  
- [User setup](docs/USER_SETUP.md)  
- [Secrets vault](docs/SECRETS_VAULT.md)  
- [Background email alerts](docs/EMAIL_ALERTS.md)  

---

## Testing

- API / unit: `src/**/__tests__` via `npm test`  
- E2E smoke: `e2e/smoke.spec.ts` via `npm run test:e2e`  

---

## Deployment

Production is hosted on **Vercel** as project `santra-ai-neurox`.

```bash
# CLI production deploy (when Git integration is unavailable)
vercel deploy --prod --yes
```

Connect GitHub → Vercel so pushes to `main` auto-deploy:

**GitHub:** `neurox-1-0/Santra_AI_Prompt_Pirates`  
**Vercel:** [santra-ai-neurox deployments](https://vercel.com/hubaibahamedaahadc-2516s-projects/santra-ai-neurox/deployments)

---

## Security notes

- Local browser auth is for development / demo only.  
- Production expects MongoDB workspace auth + HTTPS OAuth callbacks.  
- Keep provider API keys in environment variables or a secrets vault — never in source.

---

## License

Private repository — all rights reserved unless otherwise stated by the `neurox-1-0` organization.
