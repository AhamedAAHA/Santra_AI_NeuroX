# NeuroX 1.0 — Phase 1 submission guide (SANTRA AI)

**Devpost:** https://neurox1-0.devpost.com/  
**Deadline:** July 12, 2026

## One-line pitch

SANTRA AI is an autonomous B2B GTM intelligence agent: it monitors competitors, collects live web evidence, detects material changes, drafts executive briefs, and queues CRM automation for human approval.

## Demo path (7-minute video)

| Time | Content |
|------|---------|
| 0:00–1:00 | B2B problem: manual competitive monitoring across SERPs and pricing pages |
| 1:00–2:30 | Agent architecture: intent → tool routing → evidence → analysis → HITL |
| 2:30–4:30 | Live demo: GTM Monitors → create monitor → Check now → agent activity log → report |
| 4:30–5:30 | Action approval queue → Approve → Trigger workflow (webhook) |
| 5:30–7:00 | Phase 2 plan + NeuroX / team intro |

## PDF report sections

1. **Problem statement** — GTM teams spend 15–30+ hrs/week on fragmented competitive research
2. **Value proposition** — faster response to pricing/hiring/launch moves; fewer missed signals
3. **Agentic loop** — see README agent loop section
4. **Architecture** — User → SANTRA Agent → Bright Data / AIML / Supabase → HITL queue → Webhooks
5. **HITL design** — pending_actions queue; approve before `/api/automation/webhook` executes

## External tools (3+)

- Bright Data SERP API (primary when configured)
- **Exa** web search (automatic fallback when Bright Data fails or credits exhausted)
- Bright Data Web Unlocker / MCP
- AI/ML API or Featherless (analysis)
- **Band.io** agent mesh (HITL notifications)
- Supabase (persistence + approval queue)

## Provider check

```bash
node scripts/test-providers.mjs
```

Restart `npm run dev` after updating `.env.local`.

## Judging alignment

| Criterion | SANTRA angle |
|-----------|--------------|
| B2B impact (35%) | Competitive intelligence for SaaS / revops teams |
| Reasoning design (30%) | Dynamic tool routing, intent parsing, change detection |
| Architecture (20%) | Modular agent services + cron + webhooks |
| HITL (15%) | Action approval queue before automation |

## Key routes

- `/alerts` — GTM monitors + agent activity + approval queue
- `/analyst` — Competitor IQ
- `/chat` — GTM advisor (collects Bright Data evidence for competitor URLs)

## Phase 2 build plan

- Richer approval UI (edit proposed action before execute)
- Agent memory across monitor runs
- Slack-native approval cards
- Deeper CRM field mapping
