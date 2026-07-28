# SANTRA AI Architecture

## High-level flow

1. Browser (Next.js app)
2. API routes (`src/app/api/*`)
3. Intelligence + persistence services
4. Supabase (auth, database, vault)
5. External providers (OpenAI-compatible LLM, optional data/voice providers)

## Main runtime path

- `Client UI` -> `Next.js API route`
- API route validates auth/session and rate limit
- Route calls service layer (`src/services/*`)
- Service may call LLM/data providers and normalize outputs
- Results are persisted to Supabase and returned to the client

## Core domains

- Auth: Supabase auth + OAuth callbacks
- Startup intelligence: scanner, reports, scores, plans
- Watchlist: monitor intent, checks, alerts, timeline
- Advisor: chat + thread persistence
- History: unified workspace reports
