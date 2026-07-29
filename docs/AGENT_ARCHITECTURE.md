# SANTRA Agent Architecture (NeuroX judges)

## Decision graph

```
plan → tool_router → collect → observe → reason → reflect
  → escalate → recommend → human_review → execute → audit
```

| Node | What happens |
|------|----------------|
| **plan** | Plain-language monitor goal, category, severity, keywords |
| **tool_router** | Bright Data / Exa / MCP route (+ prior-run memory) |
| **collect** | Live web evidence with automatic tool recovery |
| **observe** | Snapshot diffs + **noise filter** (footer/cookie/nav ignored) |
| **reason** | LLM executive synthesis |
| **reflect** | Independent **risk / confidence / importance** scores |
| **escalate** | Low evidence quality routes to HITL |
| **recommend** | Named verdict + GTM action plan |
| **human_review** | Edit → approve → dismiss (hard gate) |
| **execute** | Webhook / Slack / CRM **only** after approval |
| **audit** | Timeline + approval history persisted |

## Scoring formulas (risk ≠ confidence ≠ importance)

**Risk** (exposure):
`0.72·peakSeverity + 0.28·meanSeverity + breadthBonus(≤9) + changeBonus(≤8)`

**Confidence** (evidence quality):
`0.42·claimQuality + 0.23·sourceQuality + 0.17·citationCoverage + 0.18·modelConfidence`
(capped by provider: bright-data 94 · exa 90 · openai 76 · demo 60)

**Importance** (action priority):
`0.30·relevance + 0.20·magnitude + 0.15·urgency + 0.15·reliability + 0.10·overlap + 0.10·corroboration`
Bands: High ≥ 75 · Medium ≥ 45 · Low < 45

## HITL enforcement

- `/api/automation/webhook` requires `pendingActionId` with status `approved`
- `/api/alerts/webhook` requires the same approval gate
- Email watch notifies humans; it does **not** write CRM without approval

## Dual-model fact-check

After synthesis, a **verifier** model re-scores each claim against evidence excerpts (preferring the alternate provider when both AIML + Featherless are configured). Contested/unsupported claims are demoted before HITL and webhook delivery. Report field: `factCheck`.

## Webhook payload v2 (`santra.webhook.v2`)

Generic / Slack / Discord deliveries include a `santra` envelope with:
risk · confidence · importance · detectedChanges · evidence · verifiedClaims · factCheck · `deepLink` to `/reports`.

## Noise filter

Cosmetic churn dropped before HITL queue:
- Copyright / footer year changes
- Cookie banners, privacy/terms chrome
- Nav / menu / powered-by text
- Sub-2% price wobbles on non-pricing fields

## Live product

Production: https://santra-ai-neurox.vercel.app  
Demo path: `/alerts` → Check now → Decision trail → `/reports` → Approval inbox → Strategy Desk voice
