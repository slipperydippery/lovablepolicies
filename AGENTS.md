# AGENTS.md — Botchie Project Context

> This file is the single source of truth for LLM/AI agents working on this codebase.
> **Update this file whenever you add/change routes, data models, conventions, or architecture.**

## Purpose

Botchie is a **procurement policy management and AI-assisted purchasing tool** for Dutch healthcare organizations (VVT/GGZ sector). It lets care workers ask an AI chatbot whether a purchase is allowed, and gives admins a dashboard to manage policies, validate expenses, monitor budgets, and gain insights.

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui (Radix primitives)
- **Design system**: BEAN — tokens in `tokens.json`, component definitions in `ui-manifest.json`, rules in `Guidelines.md`
- **State**: React Query (`@tanstack/react-query`) for server state, React context for active location
- **i18n**: react-i18next — Dutch (default) + English. Config in `src/i18n/index.ts`, translations in `src/i18n/nl.json` and `src/i18n/en.json` (flat dot-notation keys)
- **Database**: Supabase (Postgres) — tables: `policies`, `ledger_categories`, `sub_ledgers`
- **Chat backend (2 alternatives)**:
  - Supabase Edge Function (`supabase/functions/policy-chat/`) → Lovable AI gateway → Gemini
  - Express server (`server/index.ts`) → Anthropic SDK → Claude Sonnet
- **Routing**: react-router-dom v6, lazy-loaded pages

## Directory Structure

```
src/
├── App.tsx                  # Routes & providers
├── components/
│   ├── ui/                  # BEAN design system components (shadcn/ui based)
│   ├── theme/               # ThemeProvider (dark/light)
│   ├── OnboardingModal.tsx   # Policy document upload → AI extraction → conflict resolution → activate
│   └── LanguageSwitcher.tsx  # NL | EN toggle
├── contexts/
│   └── ActiveLocationContext.tsx  # Selected care location (defaults to "De VeldKeur")
├── data/
│   ├── mock-locations.ts    # 3 Dutch healthcare sites (VlietStad, De VeldKeur, 't Hoge Hof)
│   ├── mock-ledger.ts       # Budget categories & sub-ledgers (Food/Kitchen, Care/Treatment)
│   ├── mock-suppliers.ts    # 4 approved suppliers (ABENA, Lyreco, Mediq, Technische Unie)
│   └── onboarding-policies.ts  # 9 ready + 1 conflict policy definitions, DB upsert/reset helpers
├── hooks/
│   └── use-policies.ts      # React Query hook: fetch/update policies from Supabase
├── i18n/                    # Translations (nl.json, en.json) + i18next config
├── integrations/supabase/   # Auto-generated Supabase client + types
├── pages/app/
│   ├── RoleSwitcher.tsx     # Landing: choose Care Worker or Admin persona
│   ├── mobile/              # Care worker mobile UI (max-width 430px)
│   │   ├── MobileLayout.tsx # Header + bottom tab bar (Ask, Deliveries, Profile)
│   │   ├── ChatView.tsx     # AI procurement chat with streaming, voice input, policy cards, receipt upload
│   │   ├── PurchasesView.tsx# Pending deliveries + purchase history
│   │   └── ProfileView.tsx  # Placeholder
│   └── admin/               # Admin desktop UI (sidebar layout)
│       ├── AdminLayout.tsx  # Sidebar nav: Policy Hub, Validation, Budget, Insights
│       ├── PolicyHubView.tsx# Policy CRUD table, onboarding trigger, benchmarking, AFAS mapping
│       ├── ValidationView.tsx# Expense review: approve/reject AI-approved & manual-review items
│       ├── BudgetView.tsx   # Per-location budget with ledger drill-down, period toggles, interventions
│       └── InsightsView.tsx # KPIs (STP, hours reclaimed), friction heatmap, shadow orders
server/
└── index.ts                 # Express API: /api/chat endpoint (Anthropic Claude, SSE streaming)
supabase/
├── functions/policy-chat/   # Deno edge function: same chat logic using Lovable AI gateway
└── migrations/              # Postgres: policies, ledger_categories, sub_ledgers tables
public/
└── demo-documents/          # Sample .txt policy docs for onboarding demo
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | → `/app` | Redirect |
| `/app` | `RoleSwitcher` | Choose Care Worker or Admin |
| `/app/mobile` | `MobileLayout` | → `/app/mobile/chat` |
| `/app/mobile/chat` | `ChatView` | AI procurement assistant |
| `/app/mobile/purchases` | `PurchasesView` | Deliveries & history |
| `/app/mobile/profile` | `ProfileView` | Placeholder |
| `/app/admin` | `AdminLayout` | → `/app/admin/policy-hub` |
| `/app/admin/policy-hub` | `PolicyHubView` | Policy management |
| `/app/admin/validation` | `ValidationView` | Expense review |
| `/app/admin/budget` | `BudgetView` | Budget monitoring |
| `/app/admin/insights` | `InsightsView` | Analytics dashboard |

## Database Schema (Supabase)

### `policies`
Core table. Each policy has: `id` (text PK, e.g. "POL-2026-041"), `name`, `category`, `status` (active/draft/conflict/deprecated), `max_amount` (text, e.g. "EUR 50,00 per transaction"), `limit_amount` (integer, cents), `friction` (Low/Medium/High), `intent` (text description), `afas_code` (integer, maps to sub-ledger), `ledger`, `benchmark_score`, `benchmark_warning`, `start_date`, `end_date`, `allowed_categories`. No auth/RLS enforcement yet.

### `ledger_categories`
Budget categories per location: `id`, `code`, `name`, `total_budget`, `location_id`.

### `sub_ledgers`
Sub-ledger line items: `id`, `category_id` (FK), `code` (e.g. 4310), `name`, `budget`, `spent`.

## Key Concepts

- **Friction**: Low/Medium/High — determines how much approval friction a policy adds. Low = auto-approve, High = manual review.
- **AFAS code**: Maps policies to accounting ledger codes (Dutch ERP system AFAS).
- **Chat markers**: The AI chat uses hidden markers in responses:
  - `[REGISTER:15.00]` → renders a "Register Purchase" button in the UI
  - `[POLICIES:POL-2026-041,POL-2024-05]` → shows referenced policy cards with expandable details
- **Onboarding flow**: Upload policy documents → simulated AI extraction → show ready policies + conflicts → resolve conflicts (pick Source A, B, benchmark, or custom) → bulk upsert to Supabase.
- **Cross-language matching**: Policies are stored in English. The AI system prompt instructs semantic matching regardless of user language (e.g. Dutch "luiers" matches "Incontinence Material").

## Environment Variables

### Frontend (Vite — `VITE_` prefix)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key
- `VITE_CHAT_API_URL` — (optional) Override chat endpoint; defaults to Supabase edge function

### Server (`server/`)
- `SUPABASE_URL` / `VITE_SUPABASE_URL` — Supabase URL (tries both)
- `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key
- `ANTHROPIC_API_KEY` — For Claude chat
- `PORT` — Server port (default 3001)

### Supabase Edge Function
- `LOVABLE_API_KEY` — Lovable AI gateway key (set in Supabase dashboard)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Auto-injected by Supabase

## Conventions

- **Design system**: Always read `tokens.json` + `ui-manifest.json` before creating UI. Use `sp-` spacing tokens, semantic color classes, Font Awesome icons only. See `Guidelines.md` for full rules.
- **i18n**: All user-visible strings use `t("dotted.key")`. Add keys to both `nl.json` and `en.json`. Flat dot-notation, no nesting.
- **DB field mapping**: Supabase uses `snake_case`, frontend uses `camelCase`. The `use-policies.ts` hook handles mapping via `rowToPolicy()` and a `fieldMap` in the mutation.
- **No authentication**: The app currently has no auth. RLS is enabled but allows all access. TODO for future.
- **Mock data**: Locations, ledger, and suppliers use hardcoded mock data (`src/data/`). Policies are live in Supabase. Validation and purchases views use local mock data.

## Current Limitations

- No user authentication or multi-tenancy
- Profile page is a placeholder
- Validation and Purchases views use hardcoded mock data (not connected to DB)
- Ledger/supplier data is duplicated between frontend mocks and server-side constants
- Budget view uses mock data with random variance for monthly figures
