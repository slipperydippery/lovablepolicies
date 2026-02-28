# Architecture & Functional Documentation — Botchie

> Human-readable documentation for developers and stakeholders.
> For LLM/AI agent context, see `AGENTS.md`.

---

## 1. What is Botchie?

Botchie is a **procurement policy management platform** built for Dutch healthcare organizations (VVT/GGZ sector). It solves a common problem: care workers on the floor need to make small purchases (medical supplies, groceries, emergency items) but don't know what's allowed, what the budget limits are, or which suppliers to use.

Botchie provides:
- An **AI chatbot** that care workers can ask in natural language (Dutch or English) whether a purchase is allowed
- An **admin dashboard** where procurement managers can manage policies, review AI-approved expenses, monitor budgets, and gain operational insights

## 2. User Personas & Features

### 2.1 Care Worker (Mobile UI — max 430px width)

**Entry point**: `/app` → choose "Care Worker" → `/app/mobile/chat`

#### AI Chat (`/app/mobile/chat`)
The core feature. A care worker types (or speaks via voice input) a question like *"Mag ik luiers bestellen bij ABENA?"* (Can I order diapers from ABENA?). The AI:

1. Fetches **active policies** from the Supabase `policies` table
2. Semantically matches the question to relevant policies (cross-language: Dutch questions match English policy names)
3. Checks if the supplier is on the **approved list**
4. Checks **budget availability** from ledger data
5. Responds with a brief, friendly answer

**Special behaviors**:
- When the AI approves a purchase, it includes a hidden `[REGISTER:15.00]` marker → the UI renders a **"Register Purchase"** button → opens a bottom sheet where the worker can upload a receipt photo
- The AI also includes `[POLICIES:POL-2026-041]` markers → the UI renders **expandable policy cards** showing the referenced policies with details (category, max amount, friction level, intent)
- **Voice input**: Web Speech API (nl-NL or en-US based on language setting)
- **Streaming**: Responses stream via SSE for real-time display

#### Purchases (`/app/mobile/purchases`)
- **Pending Deliveries** tab: Shows items expected (e.g. a medical supply delivery). Worker can tap "Mark as Received" to confirm delivery.
- **History** tab: List of past purchases with item, vendor, amount, date.
- *Currently uses hardcoded mock data.*

#### Profile (`/app/mobile/profile`)
Placeholder — shows "Coming Soon".

### 2.2 Admin (Desktop sidebar UI)

**Entry point**: `/app` → choose "Admin" → `/app/admin/policy-hub`

#### Policy Hub (`/app/admin/policy-hub`)
The policy management center:

- **Table view** of all policies from Supabase with columns: ID, Name, Category, Status, Max Amount, Friction, Benchmark
- **Filters**: All / Active / Drafts / Conflicts / Needs Review
- **Search**: Free-text filter across policy fields
- **Sortable columns** with click-to-sort
- **Detail sidebar**: Click a row to open an editable panel with: Intent, Max Amount, Start/End Date, AFAS Code mapping (dropdown of ledger codes), Status toggle, Benchmark score
- **Onboarding flow** (triggered via "Add Document" button): Upload policy documents → simulated AI extraction → review extracted policies → resolve conflicts between document sources → bulk activate to database
- **Benchmarking**: One-click button to populate benchmark scores from sector standards
- **Reset**: Delete all policies for demo purposes

#### Validation (`/app/admin/validation`)
Expense review dashboard:

- **Summary cards**: Count of AI-approved, Manual Review, Approved, Rejected items
- **Table**: Each expense shows requester, team, region, item, vendor, amount, status, date
- **Detail modal**: Click a row to see AI reasoning, referenced policies (with approved/exception badges), budget context (code, name, usage bar), and approve/reject actions
- **Policy escalation**: From the detail view, admin can trigger a "Create Policy" flow to formalize a recurring exception
- *Currently uses hardcoded mock data.*

#### Budget (`/app/admin/budget`)
Budget monitoring per care location:

- **Location selector**: Switch between 3 mock locations (VlietStad, De VeldKeur, 't Hoge Hof)
- **Period toggle**: Month / Year-to-Date / Yearly views
- **Summary card**: Total budget, spent, remaining with progress bar
- **Ledger categories**: Expandable accordion showing each category (Food & Kitchen, Care & Treatment) with sub-ledger line items
- **Progress bars**: Color-coded (green ≤70%, yellow ≤90%, red >90%) per sub-ledger
- **Intervention modal**: When a sub-ledger is overspent, click "Intervene" to apply policy changes (e.g. reduce limits, add friction)
- *Uses mock ledger data with random monthly variance for realism.*

#### Insights (`/app/admin/insights`)
Analytics dashboard:

- **KPI cards**: Straight-Through Processing rate (92%), Hours Reclaimed (124h/mo), AI Fallback rate (4%)
- **Friction Heatmap**: Most-questioned policies ranked by query volume with friction badges. Click to review and edit suggested policy text revisions.
- **Shadow Orders**: Detected off-policy purchases. Click to investigate, add vendor to approved list, or create exception policy.
- *All data is mock/illustrative.*

## 3. Architecture

### 3.1 Frontend

```
Vite + React 18 + TypeScript
├── Tailwind CSS (utility-first styling)
├── shadcn/ui (Radix primitives, customized via BEAN design system)
├── React Query (server state for policies)
├── react-router-dom v6 (lazy-loaded routes)
├── react-i18next (NL/EN internationalization)
└── React Context (active location selection)
```

### 3.2 Backend — Chat (two alternatives)

The AI chat has two interchangeable backend implementations:

**Option A: Supabase Edge Function** (default)
```
Frontend → POST /functions/v1/policy-chat
         → Deno edge function
         → Fetches policies from Supabase
         → Calls Lovable AI Gateway (Gemini)
         → Streams SSE response back
```

**Option B: Express Server** (local dev / self-hosted)
```
Frontend → POST /api/chat (set VITE_CHAT_API_URL)
         → Express server (server/index.ts)
         → Fetches policies from Supabase
         → Calls Anthropic API (Claude Sonnet)
         → Streams SSE response back
```

Both backends:
1. Accept `{ messages, locationName, language }` in the request body
2. Fetch active policies from Supabase
3. Build a system prompt with policy context, supplier list, budget data, and response rules
4. Stream the LLM response as SSE in OpenAI-compatible format
5. The frontend parses `data: {choices: [{delta: {content: "..."}}]}` chunks

### 3.3 Database (Supabase / Postgres)

```sql
policies (id text PK, name, category, status, max_amount, limit_amount,
          friction, intent, afas_code, ledger, benchmark_score,
          benchmark_warning, start_date, end_date, allowed_categories,
          created_at, updated_at)

ledger_categories (id text PK, code, name, total_budget, location_id)

sub_ledgers (id text PK, category_id FK, code, name, budget, spent)
```

- RLS is enabled but permissive (no auth yet)
- `updated_at` auto-updates via trigger
- Ledger tables are seeded with data for location "De VeldKeur"

### 3.4 Design System (BEAN)

The UI follows a custom design system defined in:
- `tokens.json` — Color primitives, semantic colors, spacing scale (`sp-4` through `sp-48`), typography, shadows, border radii
- `ui-manifest.json` — Component specs with props, variants, and usage examples
- `Guidelines.md` — Rules for using tokens and components

**Key rules**: Use `sp-` spacing tokens, semantic color classes only, Font Awesome icons only, never hardcode design values.

## 4. Data Flow Diagrams

### 4.1 Chat Flow
```
User types question
  → ChatView.send()
  → POST to chat backend (SSE)
  → Backend fetches active policies from Supabase
  → Backend builds system prompt with policies + suppliers + budgets
  → LLM generates response with [REGISTER:xx] and [POLICIES:xx] markers
  → Frontend parses SSE chunks, streams text to UI
  → On stream end: extract markers, render policy cards + register button
  → User taps "Register Purchase" → receipt upload sheet
```

### 4.2 Onboarding Flow
```
Admin clicks "Add Document" in Policy Hub
  → OnboardingModal opens
  → Upload .pdf/.txt policy documents
  → Click "Process & Generate"
  → Simulated AI extraction (animated steps)
  → Show results: 9 ready policies (green) + 1 conflict (orange)
  → Admin resolves conflict (pick Source A, Source B, benchmark, or custom value)
  → Click "Activate All"
  → upsertPolicies() → Supabase policies table
  → Policy Hub table refreshes via React Query invalidation
```

## 5. Environment Setup

### Required
```env
# Frontend (.env at project root)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Optional: point chat to Express server instead of edge function
VITE_CHAT_API_URL=http://localhost:3001/api/chat
```

### For Express Server (`server/`)
```env
ANTHROPIC_API_KEY=sk-ant-...
# Supabase credentials (tries both naming conventions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
PORT=3001
```

### For Supabase Edge Function
Set in Supabase Dashboard → Edge Functions → Secrets:
- `LOVABLE_API_KEY` — Lovable AI gateway key

## 6. Running Locally

```bash
# Frontend
npm install
npm run dev          # → http://localhost:8080

# Express chat server (optional, in separate terminal)
cd server
npm install
npm run dev          # → http://localhost:3001
```

## 7. Internationalization

- Default language: **Dutch (nl)**
- Fallback: **English (en)**
- Translations: `src/i18n/nl.json` and `src/i18n/en.json`
- Key format: flat dot-notation (e.g. `"chat.welcome"`, `"policyHub.filterAll"`)
- ~175 translated strings across 11 component files
- Language persisted in `localStorage` via `i18next-browser-languagedetector`
- The AI chat backend accepts a `language` parameter and responds in the matching language

## 8. Known Limitations & Future Work

| Area | Status | Notes |
|------|--------|-------|
| Authentication | ❌ Not implemented | No user auth, RLS is permissive |
| Profile page | ❌ Placeholder | Shows "Coming Soon" |
| Validation data | ⚠️ Mock only | Hardcoded expenses, not connected to DB |
| Purchases data | ⚠️ Mock only | Hardcoded deliveries and history |
| Budget data | ⚠️ Partially mock | Ledger in DB but monthly figures use random variance |
| Supplier data | ⚠️ Duplicated | Same list hardcoded in frontend mocks + both backends |
| Ledger data | ⚠️ Duplicated | Same list in frontend mocks + both backends |
| Multi-tenancy | ❌ Not implemented | Single-org, location switching is cosmetic |
| Onboarding AI | ⚠️ Simulated | Document parsing is animated but not real AI extraction |

## 9. Keeping Documentation Updated

This project uses two documentation files:

- **`AGENTS.md`** — Concise, structured context for LLM/AI agents (Cursor, Windsurf, Lovable, Copilot). Optimized for machine reading.
- **`ARCHITECTURE.md`** (this file) — Detailed functional and technical documentation for humans.

**Update rule**: When a change affects any of the following, update both files in the same commit:
- Routes or page components
- Database schema (new tables, columns, migrations)
- API endpoints or chat backend logic
- Data models or type definitions
- Environment variables
- Design system tokens or components
- i18n key structure
- New features or major UI changes
