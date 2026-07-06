# SANTRA AI

SANTRA AI is an autonomous GTM intelligence agent for B2B revenue, competitive intel, and strategy teams.
It monitors competitors, collects live web evidence, synthesizes executive briefs, and queues CRM automation
for human approval before anything executes.

## Core modules

- GTM Competitive Monitors (agent loop + HITL approval queue)
- Competitor Intelligence Center
- GTM Command Center
- AI GTM Advisor
- Executive Reports and workspace history

## Agent loop

1. Goal intake — plain-language monitor requirement
2. Intent reasoning — category, severity, search query, target URL
3. Tool routing — Bright Data SERP, Web Unlocker, MCP
4. Evidence collection and change detection
5. Executive synthesis — risks, opportunities, action plan
6. Human-in-the-loop — approve before CRM/webhook execution

## Tech stack

- Next.js 15 + React 19 + TypeScript
- Supabase (auth, persistence, secrets vault)
- OpenAI-compatible inference providers
- Tailwind CSS + Framer Motion

## Quick start

```bash
npm install
cp .env.example .env.local
npm run env:check
npm run dev
```

Open `http://localhost:3001`.

## Scripts

- `npm run dev` - local development
- `npm run lint` - ESLint
- `npm run type-check` - TypeScript validation
- `npm run build` - production build
- `npm test` - unit/integration tests

## Testing

- Route tests: `src/app/api/**/__tests__`
- E2E smoke: `e2e/smoke.spec.ts`

## Deployment docs

- Netlify + Cloudflare: `docs/DEPLOY_NETLIFY_CLOUDFLARE.md`
- Supabase setup: `docs/SUPABASE_SETUP.md`
- OAuth setup: `docs/OAUTH_SETUP.md`

## Notes

- Local auth mode is development-only; production should use Supabase auth.
