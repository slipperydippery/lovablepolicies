

# Policy Onboarding: Full Demo Flow with Database Integration

## Overview
Transform the onboarding from a static mock into a full demo-ready flow that:
1. Starts with an empty policies table (add a "Reset" button)
2. Simulates AI analysis of uploaded documents
3. Shows ~8 extracted policies: 5 ready + 3 with conflicts
4. On "Activate", inserts all resolved policies into the database
5. Includes downloadable sample documents to upload during the demo

## Sample Documents

Create 3 simple text-based PDFs (as HTML pages in `public/` that can be printed to PDF, or just provide `.txt` files the user renames). Since the analysis is simulated, the file contents are just for show -- but they should look credible if someone opens them:

- **Employee_Handbook_2024.pdf** -- general purchasing rules, travel, catering
- **Finance_Guidelines_2025.pdf** -- updated limits, approval thresholds
- **Care_Procurement_Policy.pdf** -- healthcare-specific: medical supplies, pharmacy, incontinence

These will be placed as downloadable `.txt` files in `public/demo-documents/` with realistic-looking policy text. The user can download and re-upload them during the demo.

## Extracted Policies (Simulated Results)

### Ready to Activate (5 policies -- green, no conflicts)

| ID | Name | Category | Max Amount | Friction | AFAS |
|---|---|---|---|---|---|
| POL-2026-041 | Emergency Ward Supplies | Recreation | EUR 50,00 per transaction | Low | 4340 |
| POL-2024-05 | Incontinence Material (ABENA) | Incontinence Materials | EUR 2.10 per client per day | High | 4310 |
| POL-2025-18 | Residential Group Daily Groceries | Nutrition (Groceries) | EUR 15,00 per transaction | Medium | 4210 |
| POL-2025-33 | Temporary Staff / Agency (AB-Zorg) | Temporary Staff | No per-transaction limit | High | 4600 |
| POL-2026-092 | Urgent Pharmacy Runs | Pharmaceuticals | EUR 150,00 per transaction | Low | 4320 |

### Conflicts (3 policies -- orange, need resolution)

| ID | Name | Conflict | Source A | Source B | Benchmark |
|---|---|---|---|---|---|
| POL-2026-088 | Resident Birthday Allowances | Max spend | Employee Handbook: EUR 15 | Finance Guidelines: EUR 25 | Sector avg: EUR 20 |
| POL-2022-12 | Travel Reimbursement | Rate per km | Employee Handbook: EUR 0,23/km | Finance Guidelines: EUR 0,21/km | Tax authority: EUR 0,23/km |
| POL-2026-104 | Office Supplies Mandate (Lyreco) | Approval threshold | Care Policy: EUR 100 per order | Finance Guidelines: EUR 250 per order | Sector avg: EUR 150 |

## Changes to OnboardingView.tsx

### New features
- **Define all 8 policies as a typed array** with their full database fields, conflict details, and resolution options
- **Multiple conflict cards** instead of just one -- each with its own quick-pick buttons, custom input, and benchmark hint
- **Track resolution state per conflict** using a `Record<string, number | null>` instead of a single `resolvedValue`
- **On "Activate"**: call `supabase.from("policies").upsert(...)` to insert all 8 policies into the database, with resolved values applied to conflicting ones
- **Success toast** shows the count of policies activated
- **"Reset Database" button** on the upload phase -- deletes all rows from the policies table so the demo can start fresh
- **Download demo documents link** on the upload phase so presenters can grab the sample files

### Flow
1. Upload phase: shows file uploader + "Reset Database" button + download links
2. Processing phase: same animated steps (unchanged)
3. Results phase: 5 green cards + 3 orange conflict cards, each independently resolvable
4. "Activate" button enabled only when all 3 conflicts are resolved
5. On activate: upsert to DB, toast, redirect to Policy Hub

## Files to create/modify

| File | Action |
|---|---|
| `public/demo-documents/Employee_Handbook_2024.txt` | Create -- sample policy document text |
| `public/demo-documents/Finance_Guidelines_2025.txt` | Create -- sample finance document text |
| `public/demo-documents/Care_Procurement_Policy.txt` | Create -- sample care procurement text |
| `src/pages/app/admin/OnboardingView.tsx` | Rewrite -- full demo flow with DB integration |

## Technical Details

- Uses `supabase.from("policies").upsert(policies, { onConflict: "id" })` so re-running the demo overwrites previous entries
- The "Reset Database" button calls `supabase.from("policies").delete().neq("id", "")` to clear all rows
- Each conflict tracks its own resolved value in `resolvedConflicts: Record<string, number | null>`
- The `handleActivate` function maps the defined policies array into database rows with snake_case columns
- No edge function needed -- this is all client-side simulation with direct DB writes

