import { supabase } from "@/integrations/supabase/client";

/* ── Types ── */

export interface ReadyPolicy {
  id: string;
  name: string;
  category: string;
  maxAmount: string;
  friction: "Low" | "Medium" | "High";
  afasCode: number;
  intent: string;
  limitAmount: number;
  benchmarkScore: string;
  benchmarkWarning: boolean;
  startDate: string;
  endDate: string;
}

export interface ConflictPolicy {
  id: string;
  name: string;
  category: string;
  friction: "Low" | "Medium" | "High";
  afasCode: number;
  intent: string;
  conflictField: string;
  sourceA: { label: string; value: number; display: string };
  sourceB: { label: string; value: number; display: string };
  benchmark: { label: string; value: number; display: string };
}

/* ── Ready policies ── */

export const READY_POLICIES: ReadyPolicy[] = [
  {
    id: "POL-2026-041",
    name: "Emergency Ward Supplies",
    category: "Recreation",
    maxAmount: "EUR 50,00 per transaction",
    friction: "Low",
    afasCode: 4340,
    intent: "Allow ward staff to purchase small consumables (gloves, tape, disinfectant) without prior approval.",
    limitAmount: 50,
    benchmarkScore: "Above VVT Standard",
    benchmarkWarning: true,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  },
  {
    id: "POL-2024-05",
    name: "Incontinence Material (ABENA)",
    category: "Incontinence Materials",
    maxAmount: "EUR 2,10 per client per day",
    friction: "High",
    afasCode: 4310,
    intent: "Budget incontinence products under the ABENA framework agreement at a fixed daily rate per client.",
    limitAmount: 2,
    benchmarkScore: "Matches GGZ Standard",
    benchmarkWarning: false,
    startDate: "2024-03-01",
    endDate: "2025-02-28",
  },
  {
    id: "POL-2025-18",
    name: "Residential Group Daily Groceries",
    category: "Nutrition (Groceries)",
    maxAmount: "EUR 15,00 per transaction",
    friction: "Medium",
    afasCode: 4210,
    intent: "Provide each residential group with a daily budget for fresh groceries at approved supermarkets.",
    limitAmount: 15,
    benchmarkScore: "Below VVT Standard",
    benchmarkWarning: true,
    startDate: "2025-06-01",
    endDate: "2026-05-31",
  },
  {
    id: "POL-2025-33",
    name: "Temporary Staff / Agency (AB-Zorg)",
    category: "Temporary Staff",
    maxAmount: "No per-transaction limit",
    friction: "High",
    afasCode: 4600,
    intent: "Engage temporary staff exclusively through AB-Zorg Uitzendbureau with mandatory PO reference.",
    limitAmount: 0,
    benchmarkScore: "Matches VVT Standard",
    benchmarkWarning: false,
    startDate: "2025-01-15",
    endDate: "2025-12-31",
  },
  {
    id: "POL-2026-092",
    name: "Urgent Pharmacy Runs",
    category: "Pharmaceuticals",
    maxAmount: "EUR 150,00 per transaction",
    friction: "Low",
    afasCode: 4320,
    intent: "Authorize on-duty nurses to make urgent pharmacy purchases for medication and first-aid restocking.",
    limitAmount: 150,
    benchmarkScore: "No GGZ Benchmark",
    benchmarkWarning: true,
    startDate: "2026-02-01",
    endDate: "2027-01-31",
  },
];

/* ── Conflict policies ── */

export const CONFLICT_POLICIES: ConflictPolicy[] = [
  {
    id: "POL-2026-088",
    name: "Resident Birthday Allowances",
    category: "Recreation",
    friction: "Medium",
    afasCode: 4340,
    intent: "Set a per-resident birthday budget for cake, decorations, and small gifts.",
    conflictField: "Max spend per birthday",
    sourceA: { label: "Employee Handbook", value: 15, display: "EUR 15" },
    sourceB: { label: "Finance Guidelines", value: 25, display: "EUR 25" },
    benchmark: { label: "Sector avg", value: 20, display: "EUR 20" },
  },
  {
    id: "POL-2022-12",
    name: "Travel Reimbursement",
    category: "Travel & Transport",
    friction: "Low",
    afasCode: 4510,
    intent: "Reimburse employees for business travel by private car at a fixed rate per kilometre.",
    conflictField: "Rate per km",
    sourceA: { label: "Employee Handbook", value: 0.23, display: "EUR 0,23/km" },
    sourceB: { label: "Finance Guidelines", value: 0.21, display: "EUR 0,21/km" },
    benchmark: { label: "Tax authority", value: 0.23, display: "EUR 0,23/km" },
  },
  {
    id: "POL-2026-104",
    name: "Office Supplies Mandate (Lyreco)",
    category: "Office Supplies",
    friction: "Medium",
    afasCode: 4230,
    intent: "Mandate all office supply orders through the Lyreco framework agreement with an approval threshold.",
    conflictField: "Approval threshold",
    sourceA: { label: "Care Policy", value: 100, display: "EUR 100" },
    sourceB: { label: "Finance Guidelines", value: 250, display: "EUR 250" },
    benchmark: { label: "Sector avg", value: 150, display: "EUR 150" },
  },
];

/* ── Demo document links ── */

export const DEMO_DOCUMENTS = [
  { name: "Employee Handbook 2024", file: "/demo-documents/Employee_Handbook_2024.txt" },
  { name: "Finance Guidelines 2025", file: "/demo-documents/Finance_Guidelines_2025.txt" },
  { name: "Care Procurement Policy", file: "/demo-documents/Care_Procurement_Policy.txt" },
];

/* ── DB helpers ── */

export async function resetPoliciesTable() {
  const { error } = await supabase.from("policies").delete().neq("id", "");
  if (error) throw error;
}

export async function upsertPolicies(
  readyPolicies: ReadyPolicy[],
  conflictPolicies: ConflictPolicy[],
  resolvedValues: Record<string, number>
) {
  const rows = [
    ...readyPolicies.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      max_amount: p.maxAmount,
      limit_amount: p.limitAmount,
      friction: p.friction,
      afas_code: p.afasCode,
      intent: p.intent,
      status: "active" as const,
      ledger: String(p.afasCode),
      benchmark_score: p.benchmarkScore,
      benchmark_warning: p.benchmarkWarning,
      start_date: p.startDate,
      end_date: p.endDate,
    })),
    ...conflictPolicies.map((p) => {
      const resolved = resolvedValues[p.id] ?? 0;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        max_amount: `EUR ${resolved.toFixed(2).replace(".", ",")}`,
        limit_amount: Math.round(resolved),
        friction: p.friction,
        afas_code: p.afasCode,
        intent: p.intent,
        status: "active" as const,
        ledger: String(p.afasCode),
      };
    }),
  ];

  const { error } = await supabase.from("policies").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  return rows.length;
}
