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
- **Database**: SQLite via better-sqlite3 (file: `server/data/botchie.db`), accessed through a repository pattern (`IPolicyRepository` interface)
- **API layer**: `src/lib/api.ts` — all frontend DB operations go through REST API calls to the Express server
- **Chat backend**: Express server (`server/index.ts`) → Anthropic SDK → Claude Sonnet
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
│   └── use-policies.ts      # React Query hook: fetch/update policies via REST API
├── i18n/                    # Translations (nl.json, en.json) + i18next config
├── lib/
│   └── api.ts               # Frontend API client — all DB ops go through here
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
├── index.ts                 # Express API: REST endpoints + /api/chat (SSE) + /api/extract-policies
├── db.ts                    # SQLite init + schema (creates tables on startup)
├── repo.ts                  # IPolicyRepository interface (swap storage by implementing this)
├── repo-sqlite.ts           # SQLite implementation of IPolicyRepository
└── data/                    # SQLite database file (gitignored)
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

## Database (SQLite)

The database uses a **repository pattern** for easy backend swapping. To use a different DB, implement `IPolicyRepository` from `server/repo.ts` and change one import in `server/index.ts`.

### `policies` table
Core table. Columns: `id` (text PK, e.g. "POL-2026-041"), `name`, `category`, `status` (active/draft/conflict/deprecated), `max_amount` (text, e.g. "EUR 50,00 per transaction"), `limit_amount` (integer, cents), `friction` (Low/Medium/High), `intent` (text description), `afas_code` (integer, maps to sub-ledger), `ledger`, `benchmark_score`, `benchmark_warning`, `start_date`, `end_date`, `allowed_categories`, `source_document` (text, nullable — comma-separated filename(s) of the document(s) the policy was extracted from; null = manually created), `created_at`, `updated_at`.

### REST API endpoints
| Method | Path | Purpose |
|--------|------|─────────|
| GET | `/api/policies` | List all policies |
| GET | `/api/policies/:id` | Single policy |
| PUT | `/api/policies/:id` | Update one policy |
| POST | `/api/policies/upsert` | Bulk upsert (onboarding) |
| DELETE | `/api/policies` | Delete all policies |
| POST | `/api/policies/benchmarks` | Batch benchmark update |
| POST | `/api/chat` | AI chat (SSE streaming) |
| POST | `/api/extract-policies` | PDF/TXT → Claude → JSON |

Note: `ledger_categories` and `sub_ledgers` are currently hardcoded mock data in the frontend and server. Only `policies` is persisted.

## Key Concepts

- **Friction**: Low/Medium/High — determines how much approval friction a policy adds. Low = auto-approve, High = manual review.
- **AFAS code**: Maps policies to accounting ledger codes (Dutch ERP system AFAS).
- **Chat markers**: The AI chat uses hidden markers in responses:
  - `[REGISTER:15.00]` → renders a "Register Purchase" button in the UI
  - `[POLICIES:POL-2026-041,POL-2024-05]` → shows referenced policy cards with expandable details
- **Onboarding flow**: Two modes via tab toggle in the modal:
  - **Demo mode**: Fake animated extraction → hardcoded 9 ready + 1 conflict policies (great for demos)
  - **AI Extraction mode**: Uploads real .pdf/.txt files to `POST /api/extract-policies` → Claude reads documents, extracts atomic policies as structured JSON, detects conflicts → results shown in the same review/conflict-resolution UI → bulk upsert to SQLite via REST API.
- **Cross-language matching**: Policies are stored in English. The AI system prompt instructs semantic matching regardless of user language (e.g. Dutch "luiers" matches "Incontinence Material").

## Environment Variables

### Frontend (Vite — `VITE_` prefix)
- `VITE_API_URL` — Express server URL (default: `http://localhost:3001`)
- `VITE_CHAT_API_URL` — (optional) Override chat endpoint; defaults to `VITE_API_URL/api/chat`

### Server (`server/`)
- `ANTHROPIC_API_KEY` — For Claude chat + policy extraction
- `PORT` — Server port (default 3001)

## Conventions

- **Design system**: Always read `tokens.json` + `ui-manifest.json` before creating UI. Use `sp-` spacing tokens, semantic color classes, Font Awesome icons only. See `Guidelines.md` for full rules.
- **i18n**: All user-visible strings use `t("dotted.key")`. Add keys to both `nl.json` and `en.json`. Flat dot-notation, no nesting.
- **DB field mapping**: SQLite uses `snake_case`, frontend uses `camelCase`. The `use-policies.ts` hook handles mapping via `rowToPolicy()` and a `fieldMap` in the mutation.
- **Repository pattern**: All DB access goes through `IPolicyRepository` (defined in `server/repo.ts`). To swap storage backends, implement the interface and change one import in `server/index.ts`.
- **No authentication**: The app currently has no auth. TODO for future.
- **Mock data**: Locations, ledger, and suppliers use hardcoded mock data (`src/data/`). Policies are persisted in SQLite. Validation and purchases views use local mock data.

## Current Limitations

- No user authentication or multi-tenancy
- Profile page is a placeholder
- Validation and Purchases views use hardcoded mock data (not connected to DB)
- Ledger/supplier data is duplicated between frontend mocks and server-side constants
- Budget view uses mock data with random variance for monthly figures
