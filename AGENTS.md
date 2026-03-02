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
│   ├── OnboardingModal.tsx   # Policy document upload → queue (AI mode) or demo fast path
│   └── LanguageSwitcher.tsx  # NL | EN toggle
├── contexts/
│   └── ActiveLocationContext.tsx  # Selected care location (defaults to "De VeldKeur")
├── data/
│   ├── mock-locations.ts    # 3 Dutch healthcare sites (VlietStad, De VeldKeur, 't Hoge Hof)
│   ├── mock-ledger.ts       # Budget categories & sub-ledgers (Food/Kitchen, Care/Treatment)
│   ├── mock-suppliers.ts    # 4 approved suppliers (ABENA, Lyreco, Mediq, Technische Unie)
│   └── onboarding-policies.ts  # 9 ready + 1 conflict policy definitions, DB upsert/reset helpers
├── hooks/
│   ├── use-policies.ts      # React Query hook: fetch/update policies via REST API
│   └── use-document-jobs.ts # React Query hook: poll document processing queue with auto-refresh
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
├── index.ts                 # Express API: REST endpoints + /api/chat (SSE) + document-jobs + background processor
├── db.ts                    # SQLite init + schema (creates all tables on startup)
├── repo.ts                  # Repository interfaces: IPolicyRepository, IDocumentJobRepository, IPolicyConflictRepository, IAuditLogRepository
├── repo-sqlite.ts           # SQLite implementations of all repository interfaces
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
Core table. Columns: `id` (text PK, e.g. "POL-2026-041"), `name`, `category`, `status` (active/pending_review/draft/conflict/deprecated), `max_amount` (text, e.g. "EUR 50,00 per transaction"), `limit_amount` (integer, cents), `friction` (Low/Medium/High), `intent` (text description), `afas_code` (integer, maps to sub-ledger), `ledger`, `benchmark_score`, `benchmark_warning`, `start_date`, `end_date`, `allowed_categories`, `source_document` (text, nullable — filename of the document the policy was extracted from; null = manually created), `extraction_job_id` (text, nullable — links to document_jobs.id), `tags` (text, nullable — JSON array of lowercase hyphenated tags for subject-matter matching), `created_at`, `updated_at`.

### `document_jobs` table
Document processing queue. Columns: `id` (text PK, e.g. "job-uuid"), `filename`, `file_content` (text, extracted text), `status` (queued/processing/done/error/cancelled), `policies_extracted` (integer), `error_message`, `created_at`, `completed_at`.

### `policy_conflicts` table
Conflict links between policies. Columns: `id` (text PK), `policy_a_id`, `policy_b_id`, `conflict_field` (human-readable description), `description`, `resolved` (integer 0/1), `resolved_policy_id`, `created_at`.

### `policy_audit_log` table
Audit trail for all policy mutations. Columns: `id` (integer PK autoincrement), `policy_id`, `action` (created/conflict_detected/updated/etc), `changes_json`, `source` (e.g. "ai_extraction:job-id"), `created_at`.

### REST API endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/policies` | List all policies |
| GET | `/api/policies/:id` | Single policy |
| PUT | `/api/policies/:id` | Update one policy |
| POST | `/api/policies/upsert` | Bulk upsert (onboarding) |
| DELETE | `/api/policies` | Delete all policies |
| POST | `/api/policies/benchmarks` | Batch benchmark update |
| POST | `/api/chat` | AI chat (SSE streaming) |
| POST | `/api/extract-policies` | Legacy: PDF/TXT → Claude → JSON (used by demo mode) |
| POST | `/api/document-jobs` | Upload files → create queued jobs → trigger background processing |
| GET | `/api/document-jobs` | List all document jobs (for polling) |
| POST | `/api/document-jobs/:id/cancel` | Cancel a queued or processing job |
| DELETE | `/api/document-jobs` | Delete all document jobs |
| GET | `/api/policy-conflicts` | List all conflicts |
| POST | `/api/policy-conflicts/:id/resolve` | Resolve a conflict (mark winner, deprecate loser) |
| POST | `/api/policy-conflicts/:id/resolve-both` | Resolve a conflict keeping both policies active |
| DELETE | `/api/policy-conflicts` | Delete all conflicts |

Note: `ledger_categories` and `sub_ledgers` are currently hardcoded mock data in the frontend and server. Only `policies`, `document_jobs`, `policy_conflicts`, and `policy_audit_log` are persisted.

## Key Concepts

- **Friction**: Low/Medium/High — determines how much approval friction a policy adds. Low = auto-approve, High = manual review.
- **AFAS code**: Maps policies to accounting ledger codes (Dutch ERP system AFAS).
- **Chat markers**: The AI chat uses hidden markers in responses:
  - `[REGISTER:15.00]` → renders a "Register Purchase" button in the UI
  - `[POLICIES:POL-2026-041,POL-2024-05]` → shows referenced policy cards with expandable details
- **Onboarding flow**: Two modes via tab toggle in the modal:
  - **Demo mode**: Fake animated extraction → hardcoded 9 ready + 1 conflict policies → review/resolve in modal → bulk upsert (fast path for demos)
  - **AI Extraction mode**: Uploads files to `POST /api/document-jobs` → modal closes immediately → files are queued and processed one-by-one in the background → each document is sent individually to Claude for policy extraction → extracted policies inserted **one-by-one** as `pending_review` status (appear in table in real-time) → conflict detection via **tag overlap** (≥2 shared tags + different limit amounts) → conflicts stored in `policy_conflicts` table with deduplication → all mutations logged to `policy_audit_log`.
- **Tags**: Each policy has 3-5 lowercase hyphenated tags generated by Claude during extraction, in the same language as the source document (e.g. Dutch: `["ergonomisch", "bureaustoel", "kantoormeubilair"]`). Tags are used for conflict detection (tag overlap) and will be used for search/matching in the future. Displayed as badges in the policy detail panel.
- **Conflict detection**: Two policies conflict when they share ≥2 tags AND have different `limit_amount` values. Before creating a conflict, the system checks for existing conflicts between the same pair (either direction) to avoid duplicates. Resolution options: Keep This, Keep Other, or Keep Both (sets both to active).
- **Document processing queue**: Visible on PolicyHubView above the policy table. Shows real-time status per document (queued/processing/done/error/cancelled) with auto-polling every 2 seconds while jobs are active. Each job row has a cancel button. Policies appear in the table in real-time as they are extracted (per-policy insert, not batched).
- **Policy lifecycle**: `pending_review` → (admin reviews) → `active`. If conflicts detected: `conflict` → (admin resolves, picks winner) → winner becomes `active`, loser becomes `deprecated`.
- **Audit log**: Every policy creation and conflict detection is logged with the source job ID. Future: expose audit log in the UI.
- **Cross-language matching**: Policies are stored in their source language (usually Dutch). The AI chat prompt instructs semantic matching regardless of user language (e.g. English "diapers" matches Dutch "Incontinentiemateriaal"). The extraction prompt outputs all fields in the same language as the source document.

## Environment Variables

### Frontend (Vite — `VITE_` prefix)
- `VITE_API_URL` — Express server URL (default: `http://localhost:3001`)
- `VITE_CHAT_API_URL` — (optional) Override chat endpoint; defaults to `VITE_API_URL/api/chat`

### Server (`server/`)
- `ANTHROPIC_API_KEY` — For Claude chat + policy extraction
- `PORT` — Server port (default 3001)

## Deployment

- **Frontend**: Vercel — auto-deploys from Git. SPA rewrites configured in `vercel.json`. Live at `https://lovablepolicies.vercel.app`.
- **Server**: Railway — runs the Express server from `server/`. SQLite DB is stored on Railway's filesystem (ephemeral; resets on redeploy — fine for demos).
- **Env vars (Vercel)**: `VITE_API_URL` → Railway server URL
- **Env vars (Railway)**: `ANTHROPIC_API_KEY`, `PORT`

## Conventions

- **Design system**: Always read `tokens.json` + `ui-manifest.json` before creating UI. Use `sp-` spacing tokens, semantic color classes, Font Awesome icons only. See `Guidelines.md` for full rules.
- **i18n**: All user-visible strings use `t("dotted.key")`. Add keys to both `nl.json` and `en.json`. Flat dot-notation, no nesting.
- **DB field mapping**: SQLite uses `snake_case`, frontend uses `camelCase`. The `use-policies.ts` hook handles mapping via `rowToPolicy()` and a `fieldMap` in the mutation.
- **Repository pattern**: All DB access goes through repository interfaces (`IPolicyRepository`, `IDocumentJobRepository`, `IPolicyConflictRepository`, `IAuditLogRepository` — all defined in `server/repo.ts`). To swap storage backends, implement the interfaces and change imports in `server/index.ts`.
- **No authentication**: The app currently has no auth. TODO for future.
- **Mock data**: Locations, ledger, and suppliers use hardcoded mock data (`src/data/`). Policies are persisted in SQLite. Validation and purchases views use local mock data.

## Current Limitations

- No user authentication or multi-tenancy
- Profile page is a placeholder
- Validation and Purchases views use hardcoded mock data (not connected to DB)
- Ledger/supplier data is duplicated between frontend mocks and server-side constants
- Budget view uses mock data with random variance for monthly figures
