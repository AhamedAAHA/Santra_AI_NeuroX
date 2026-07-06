# SANTRA AI — NeuroX 1.0 Phase 1 Video Script (7 minutes)

**Format:** Screen recording + voiceover  
**Length:** ~7:00 (420 seconds)  
**Tag on upload:** Hackathon Hub (per NeuroX guidelines)  
**Devpost:** https://neurox1-0.devpost.com/

---

## Pre-recording checklist

- [ ] Dev server or deploy running at `/alerts`
- [ ] At least one monitor pre-created (or create live on camera)
- [ ] `EXA_API_KEY` set (fallback if Bright Data credits low)
- [ ] Supabase migration `006_pending_actions` applied
- [ ] Browser zoom 100%, hide personal bookmarks
- [ ] Optional: second tab on landing page for opening shot

---

## Script (word-for-word)

### 0:00 – 0:45 | Hook + problem

**[VISUAL: Landing page hero — SANTRA AI, B2B GTM headline. Slow scroll.]**

**VOICEOVER:**

> Hi — I'm [Name] from [Team]. This is **SANTRA AI**, our submission for **NeuroX 1.0**.
>
> Here's the problem we're solving. B2B revenue and competitive intelligence teams spend fifteen to thirty hours a week manually checking rival pricing pages, job boards, and search results. Signals get missed. Battlecards go stale. And when teams try to automate, leadership pushes back — because nobody wants a CRM workflow firing on unverified intelligence.
>
> SANTRA is an **autonomous GTM intelligence agent**. It monitors competitors, collects live web evidence, writes executive briefs, and queues CRM automation — but only after a human approves.

---

### 0:45 – 2:15 | Architecture + agent loop

**[VISUAL: Simple architecture slide OR whiteboard diagram. Then cut to `/dashboard` briefly, navigate to `/alerts`.]**

**VOICEOVER:**

> Let me show how the agent thinks — not just how the UI looks.
>
> Step one: **goal intake**. A RevOps user describes what they care about in plain language — for example, "alert me when this competitor changes enterprise pricing."
>
> Step two: **intent reasoning**. SANTRA infers category, severity, keywords, and whether there's a target URL.
>
> Step three: **dynamic tool routing**. Our router picks the right collection path — Bright Data SERP, Web Unlocker, or MCP. If Bright Data is unavailable or credits are exhausted, we automatically fall back to **Exa** web search. Every stage is logged so you can audit what the agent did.
>
> Step four: **evidence collection and change detection**. We diff this run against the last one — pricing text, page titles, hiring signals — and score severity.
>
> Step five: **executive synthesis**. An LLM — via AIML or Featherless — turns evidence into a verdict, risks, opportunities, and a recommended action plan. The analysis is grounded in what we actually collected, not generic chat fluff.
>
> Step six — and this is critical for NeuroX — **human-in-the-loop**. The agent proposes a CRM or webhook action. It does **not** execute until someone clicks Approve.

**[VISUAL: Point at Agent Activity Log labels on `/alerts` if visible empty state, or scroll monitor list.]**

---

### 2:15 – 4:30 | Live demo — monitors + agent run

**[VISUAL: `/alerts` — GTM Monitors page. Full screen.]**

**VOICEOVER:**

> Let's run it live.
>
> I'm on **GTM Monitors**. I'll create a monitor in plain language.

**[ACTION: Click create monitor. Type requirement, e.g.: "Monitor ApexAnalytics pricing page for tier or packaging changes." Add competitor URL if field exists. Save.]**

> I described the goal in natural language and attached the pricing URL. SANTRA doesn't need a rigid schema — the agent figures out how to collect.
>
> Now I'll hit **Check now**.

**[ACTION: Click Check now. Wait for agent activity log to populate.]**

> Watch the **Agent Activity Log**. You can see each stage: goal received, tool route planned, evidence collected — or fallback to Exa if needed — then synthesis.
>
> Here's the **executive report**.

**[ACTION: Open report panel — scroll verdict, risks, evidence preview.]**

> Verdict at the top. Risk and opportunity sections. And an evidence preview tied to live collection — so the team can trust what they're acting on.
>
> If the monitor rules match — for example, a material pricing change — SANTRA doesn't silently push to Salesforce. It creates a **pending action** in the approval queue.

**[VISUAL: Action Queue panel with pending item, or explain if demo mode.]**

---

### 4:30 – 5:30 | HITL approval + webhook

**[VISUAL: Action Queue — select pending action.]**

**VOICEOVER:**

> This is our human-in-the-loop design.
>
> The proposed action says exactly what would happen if approved — for example, "Review and approve CRM automation trigger" plus the headline from the report. I can read the report snapshot that was frozen at queue time.
>
> If I'm not ready to act, I reject. If I agree, I click **Approve**.

**[ACTION: Click Approve.]**

> Only now can I **Trigger workflow**.

**[ACTION: Click Trigger workflow. Show network tab or toast success briefly.]**

> That hits our gated webhook endpoint. Unapproved actions get blocked at the API layer — not just hidden in the UI. We also support optional **Band.io** notifications when something lands in the queue, so approvers don't have to live inside the dashboard.
>
> This is bounded autonomy: the agent does the research and drafting; humans own execution.

---

### 5:30 – 6:15 | Secondary surfaces (quick)

**[VISUAL: Quick cuts — `/chat`, `/analyst`, `/reports` — 10–15 seconds each.]**

**VOICEOVER:**

> Two more surfaces, quickly.
>
> **GTM Advisor chat** — ask for a battlecard or competitor breakdown; SANTRA collects evidence for URLs in your question.
>
> **Competitor IQ** in the analyst workspace — deeper investigations with the same evidence stack.
>
> **Reports** keeps monitor runs and briefings in one history — so audits don't live in Slack threads.

---

### 6:15 – 7:00 | Phase 2 + close

**[VISUAL: Back to landing or team slide with NeuroX + Devpost URL.]**

**VOICEOVER:**

> Phase two for us: editable approval payloads before execute, agent memory across monitor runs, Slack-native approve buttons, and deeper HubSpot and Salesforce field mapping.
>
> SANTRA AI — autonomous B2B GTM intelligence with human approval built in.
>
> Built for **NeuroX 1.0**. Links, repo, and PDF report are on our Devpost. Thanks for watching.

**[VISUAL: End card — SANTRA AI logo, devpost URL, GitHub link, team names.]**

---

## Timing guide

| Segment | Duration | Cumulative |
|---------|----------|------------|
| Hook + problem | 0:45 | 0:45 |
| Architecture | 1:30 | 2:15 |
| Live demo | 2:15 | 4:30 |
| HITL + webhook | 1:00 | 5:30 |
| Secondary surfaces | 0:45 | 6:15 |
| Phase 2 + close | 0:45 | 7:00 |

---

## B-roll shot list (optional)

1. Landing hero — ticker showing "GTM Monitors", "HITL", "Exa Web Evidence"
2. Agent activity log scrolling through stages
3. Approve button click + webhook success
4. Mobile-responsive `/alerts` (if time)

---

## YouTube description (paste)

```
SANTRA AI — Autonomous B2B GTM Intelligence Agent | NeuroX 1.0 Phase 1

SANTRA monitors competitors, collects live web evidence (Bright Data + Exa fallback), synthesizes executive briefs, and queues CRM/webhook automation with human-in-the-loop approval.

NeuroX 1.0 Devpost: https://neurox1-0.devpost.com/
#HackathonHub #NeuroX #B2B #GTM #AIAgents
```

---

## Teleprompter version (continuous narration, ~950 words)

Use the voiceover blocks above concatenated in order. Read at ~135 words/minute for a 7-minute take. Practice the live demo segment once with a pre-seeded monitor to avoid dead air during API calls.

---

*End of video script.*
