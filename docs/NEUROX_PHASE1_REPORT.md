# SANTRA AI — NeuroX 1.0 Phase 1 Report (PDF draft)

**Project:** SANTRA AI  
**Track:** NeuroX 1.0 — Autonomous B2B GTM Intelligence Agent  
**Devpost:** https://neurox1-0.devpost.com/  
**Submission deadline:** July 12, 2026  
**Team:** [Your team name]  
**Contact:** [Your email]

---

> Copy each section below into your PDF template. Headings map 1:1 to NeuroX Phase 1 judging criteria.

---

## 1. Executive summary

SANTRA AI is an autonomous B2B go-to-market (GTM) intelligence agent for revenue operations, competitive intelligence, and strategy teams.

Instead of analysts manually checking competitor pricing pages, job boards, and SERP results every week, SANTRA accepts a plain-language monitor goal, reasons about intent, routes to the right web-evidence tools, detects material changes, synthesizes an executive brief, and queues CRM or webhook automation for **human approval** before anything executes.

**One-line pitch:**  
*SANTRA AI monitors competitors, collects live web evidence, drafts executive briefs, and routes approved actions to your revenue stack.*

**Phase 1 deliverable:** Working agent loop with GTM Monitors, live evidence collection (Bright Data + Exa fallback), executive reports, human-in-the-loop approval queue, and gated webhook execution.

---

## 2. Problem statement

B2B GTM and competitive intelligence teams face a recurring operational bottleneck:

- **Fragmented research:** Pricing pages, hiring pages, product changelogs, and SERP rankings live across dozens of URLs with no single system of record.
- **Slow reaction time:** A rival’s pricing tier change or enterprise sales hiring surge may sit unnoticed for days while reps and leadership operate on stale battlecards.
- **Manual synthesis:** Analysts spend 15–30+ hours per week copying snippets into slides, Slack threads, and CRM notes — work that does not scale with portfolio breadth.
- **Automation without guardrails:** Teams want CRM updates and workflow triggers, but blind automation on unverified intelligence creates compliance and reputational risk.

**Who feels this pain:** RevOps leaders, competitive intelligence analysts, product marketing, and GTM strategy teams at B2B SaaS companies monitoring 5–50 named rivals.

**Cost of inaction:** Missed pricing moves, delayed counter-positioning, inconsistent field messaging, and low-trust automation that leadership refuses to adopt.

---

## 3. Value proposition

SANTRA AI compresses the competitive monitoring loop from days to minutes while keeping humans in control of outbound actions.

| Before SANTRA | With SANTRA |
|---------------|-------------|
| Manual URL checks and spreadsheet trackers | Autonomous monitors with scheduled and on-demand checks |
| Ad-hoc Google searches and stale screenshots | Routed collection via Bright Data SERP/Unlocker/MCP, with **Exa** fallback when primary APIs fail |
| Analyst-written briefs after the fact | AI synthesis: verdict, risks, opportunities, recommended actions |
| Zapier flows firing on unverified signals | **HITL approval queue** — CRM/webhook runs only after explicit approve |
| Siloed chat tools with no audit trail | Workspace history, agent activity log, and report snapshots |

**Measurable outcomes (target):**
- 70%+ reduction in time from signal detection to executive-ready brief
- Single workspace for monitors, evidence, reports, and approved automations
- Audit-friendly trail: what was proposed, who approved, what executed

---

## 4. Target users and use cases

**Primary users**
1. **Competitive intelligence analyst** — maintains battlecards and pricing matrices
2. **RevOps / GTM ops** — wires approved signals into HubSpot, Salesforce, or internal webhooks
3. **Product marketing** — tracks positioning and launch moves
4. **Sales leadership** — consumes executive briefs before QBRs and deal strategy sessions

**Representative monitors (plain-language goals)**
- “Alert me when ApexAnalytics changes enterprise pricing tiers”
- “Track competitor hiring in enterprise sales roles”
- “Monitor SERP rankings for ‘AI revenue intelligence’ keywords”
- “Detect new security/compliance pages on rival sites”

---

## 5. Agentic loop (core product behavior)

SANTRA implements a closed-loop autonomous agent with explicit stages logged in the UI:

```
1. Goal intake        → User describes monitor in natural language
2. Intent reasoning   → Category, severity, keywords, target URL inferred
3. Tool routing       → Dynamic plan: SERP API, Web Unlocker, MCP, or Exa
4. Evidence collection→ Live web snippets, structured change candidates
5. Change detection   → Diff against prior run; severity scoring
6. Executive synthesis→ Verdict, risks, opportunities, action plan
7. HITL gate          → Pending action queued; Band.io optional notify
8. Approved execution → Webhook/CRM trigger only after human approve
```

**Why this is agentic (not a chatbot):**
- The system **plans** which tools to call based on query shape and configuration.
- It **acts** autonomously on schedule or “Check now” without re-prompting.
- It **proposes** downstream automation but **waits** for approval — bounded autonomy aligned with enterprise GTM workflows.

---

## 6. System architecture

### 6.1 High-level diagram (describe in PDF)

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│  GTM User   │────▶│  Next.js App     │────▶│  SANTRA Agent Core      │
│  (RevOps)   │     │  /alerts /chat   │     │  gtm-agent.ts           │
└─────────────┘     └────────┬─────────┘     └───────────┬─────────────┘
                             │                             │
                    ┌────────▼────────┐          ┌─────────▼──────────┐
                    │  Supabase       │          │  Tool layer          │
                    │  auth, monitors │          │  Bright Data SERP    │
                    │  reports,       │          │  Web Unlocker / MCP  │
                    │  pending_actions│          │  Exa (fallback)      │
                    └────────┬────────┘          └─────────┬────────────┘
                             │                             │
                    ┌────────▼────────┐          ┌─────────▼──────────┐
                    │  HITL Queue UI  │          │  LLM analysis        │
                    │  Approve/Reject │          │  AIML / Featherless  │
                    └────────┬────────┘          └──────────────────────┘
                             │ approve
                    ┌────────▼────────┐
                    │  Webhook / CRM  │
                    │  automation API │
                    └─────────────────┘
```

### 6.2 Key modules (implemented)

| Module | Route / file | Responsibility |
|--------|----------------|----------------|
| GTM Monitors | `/alerts`, `monitor-check.ts` | Orchestrates full agent loop per monitor |
| Agent core | `gtm-agent.ts` | Intent, routing, collection, stage logging |
| Evidence router | `bright-data/router.ts` | Plans SERP vs unlocker vs MCP steps |
| Exa fallback | `exa-search.ts` | Secondary web evidence when Bright Data unavailable |
| Analysis | `openai.ts` | Enterprise synthesis grounded in evidence |
| Change detection | `change-detection.ts` | Field-level diffs vs previous run |
| HITL queue | `pending_actions` table, `/api/pending-actions` | Stores proposed CRM/webhook actions |
| Automation gate | `/api/automation/webhook` | Executes only on approved actions |
| Notifications | `band-agent.ts` | Band.io mesh alert when action queued |
| GTM Advisor | `/chat` | Interactive competitor Q&A with evidence collection |
| Competitor IQ | `/analyst` | Deep-dive analyst workspace |
| History | `/reports` | Monitor reports and GTM briefings |

### 6.3 Data model (HITL)

Migration `006_pending_actions.sql` defines:

- `proposed_action` — human-readable summary (e.g. “Review and approve CRM trigger: Pricing tier change detected”)
- `proposed_event` — event type for webhook payload
- `report_snapshot` — frozen executive report at queue time
- `status` — `pending` → `approved` / `rejected` → execution

This design ensures automation never runs on stale or unreviewed intelligence.

---

## 7. Human-in-the-loop (HITL) design

**Principle:** Collect and synthesize autonomously; **execute** only with explicit human consent.

**Flow:**
1. Monitor check completes → executive report generated
2. If signals match monitor rules → `createPendingAction()` inserts row in Supabase
3. UI **Action Queue** panel shows proposed action + report snapshot
4. User clicks **Approve** → status updated → **Trigger workflow** calls gated webhook
5. User clicks **Reject** → action archived; no outbound automation

**Optional notification layer:** Band.io agent receives a lightweight event when a new action is queued (requires configured chat room).

**Judging alignment (15% HITL criterion):** Autonomy is deliberately bounded — the agent proposes, humans dispose. This matches how real GTM teams adopt AI without losing compliance control.

---

## 8. External tools and integrations (3+ required)

| Tool | Role in SANTRA |
|------|----------------|
| **Bright Data** | Primary SERP, Web Unlocker, MCP evidence collection |
| **Exa** | Automatic fallback web search when Bright Data fails or credits exhausted |
| **Supabase** | Auth, monitors, reports, `pending_actions`, secrets vault |
| **AIML API / Featherless** | OpenAI-compatible LLM for analysis and chat |
| **Band.io** | Agent mesh notifications for HITL queue events |
| **OpenAI** (optional) | Alternate inference provider |

**Provider verification:**
```bash
node scripts/test-providers.mjs
```

---

## 9. Demo walkthrough (evaluator script)

1. Open **https://[your-deploy]/alerts** (or `localhost:3001/alerts`)
2. **Create monitor:** “Monitor [Competitor] pricing page for tier changes” + target URL
3. Click **Check now** → watch **Agent Activity Log** (intake → routing → collection → synthesis)
4. Open generated **executive report** — verdict, risks, evidence preview
5. In **Action Queue**, review proposed CRM/webhook action
6. Click **Approve** → **Trigger workflow** → show webhook payload (or CRM export)
7. Optional: `/chat` — “Draft a battlecard vs [rival]” with live evidence

---

## 10. Reasoning and tool-routing design (30% criterion)

**Intent parsing:** Monitor requirement text is enriched with workspace context (company, ICP, tracked rivals).

**Dynamic routing (`planGtmCollection`):**
- URL-heavy goals → Web Unlocker / scraper path
- Keyword/SERP goals → Bright Data SERP API
- Complex multi-step → MCP orchestration when enabled

**Resilience:**
- Reverse step order retry if first Bright Data pass returns demo/empty
- **Exa fallback** if Bright Data still unavailable
- Stage log surfaces every decision for demo transparency

**Grounded synthesis:** `generateEnterpriseAnalysis` receives collected evidence — reduces hallucinated competitor claims.

---

## 11. B2B impact (35% criterion)

SANTRA targets a high-friction enterprise workflow — competitive intelligence — not consumer novelty.

- **Revenue relevance:** Pricing and positioning shifts directly affect win rates and pipeline quality.
- **Team scalability:** One analyst can monitor many rivals without linear headcount growth.
- **Adoption path:** HITL + CRM/webhook integration fits existing RevOps stacks instead of replacing them.

---

## 12. Architecture quality (20% criterion)

- **Modular services:** Agent, research, analysis, change detection, and persistence are separated
- **Type-safe TypeScript** across API routes and UI
- **Supabase RLS** on user-scoped data
- **Graceful degradation:** Demo mode when keys missing; Exa when Bright Data exhausted
- **Test coverage:** API route tests under `src/app/api/**/__tests__`

---

## 13. Limitations and honest scope (Phase 1)

- Band.io notifications require an active agent chat room
- Bright Data credits may require Exa fallback during heavy demo usage
- CRM field mapping is webhook-generic; deep Salesforce object mapping is Phase 2
- Idea Validation Scanner on dashboard is a **secondary** module; primary NeuroX story is GTM Monitors

---

## 14. Phase 2 roadmap

1. **Richer approval UI** — edit proposed action text and CRM payload before execute
2. **Agent memory** — cross-run context (“rival raised prices twice in 90 days”)
3. **Slack-native approval cards** — approve/reject in-channel
4. **Deeper CRM mapping** — HubSpot/Salesforce field templates per monitor type
5. **Multi-monitor correlation** — “three rivals shifted enterprise positioning this month”

---

## 15. Team

| Name | Role | Contribution |
|------|------|--------------|
| [Name] | [Role] | Agent architecture, backend |
| [Name] | [Role] | Frontend, GTM Monitors UI |
| [Name] | [Role] | Integrations, demo, documentation |

**Built for:** NeuroX 1.0 — https://neurox1-0.devpost.com/

---

## 16. Appendix — repository and setup

```bash
git clone [your-repo]
cd Santra-Live
npm install
cp .env.example .env.local
# Add EXA_API_KEY, BAND_*, Supabase keys
npm run secrets:sync   # AIML from vault
npm run dev            # http://localhost:3001
```

**Key env vars:** `EXA_API_KEY`, `BAND_AGENT_ID`, `BAND_API_KEY`, Supabase URL/anon key, Bright Data tokens (optional), AIML/FEATHERLESS for LLM.

**Apply migration:** `supabase/migrations/006_pending_actions.sql`

---

*End of Phase 1 report draft — paste sections into PDF and add screenshots from `/alerts` demo path.*
