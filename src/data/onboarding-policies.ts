import { upsertPolicies as apiUpsert, deleteAllPolicies, updateBenchmarks as apiBenchmarks } from "@/lib/api";

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
  sourceDocument?: string;
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
  sourceDocument?: string;
}

/* ── Ready policies ── */

export const READY_POLICIES: ReadyPolicy[] = [
  {
    id: "POL-2026-041",
    name: "Afdelingsbenodigdheden (spoed)",
    category: "Recreatie & Welzijn",
    maxAmount: "EUR 50,00 per transactie",
    friction: "Low",
    afasCode: 4340,
    intent: "Afdelingspersoneel mag kleine verbruiksartikelen (handschoenen, tape, desinfectiemiddel) aanschaffen zonder voorafgaande goedkeuring.",
    limitAmount: 50,
    benchmarkScore: "Boven VVT-norm",
    benchmarkWarning: true,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    sourceDocument: "Inkoopbeleid Zorg & Welzijn",
  },
  {
    id: "POL-2024-05",
    name: "Incontinentiemateriaal (ABENA)",
    category: "Incontinentiemateriaal",
    maxAmount: "EUR 2,10 per cliënt per dag",
    friction: "High",
    afasCode: 4310,
    intent: "Incontinentieproducten budgetteren binnen de raamovereenkomst met ABENA tegen een vast dagtarief per cliënt.",
    limitAmount: 2,
    benchmarkScore: "Conform GGZ-norm",
    benchmarkWarning: false,
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    sourceDocument: "Inkoopbeleid Zorg & Welzijn",
  },
  {
    id: "POL-2025-18",
    name: "Dagelijkse boodschappen woongroep",
    category: "Voeding (Boodschappen)",
    maxAmount: "EUR 15,00 per transactie",
    friction: "Medium",
    afasCode: 4210,
    intent: "Elke woongroep krijgt een dagelijks budget voor verse boodschappen bij goedgekeurde supermarkten.",
    limitAmount: 15,
    benchmarkScore: "Onder VVT-norm",
    benchmarkWarning: true,
    startDate: "2025-06-01",
    endDate: "2026-05-31",
    sourceDocument: "Personeelshandboek 2024, Inkoopbeleid Zorg & Welzijn",
  },
  {
    id: "POL-2025-33",
    name: "Inhuur flexpersoneel (AB-Zorg)",
    category: "Inhuur personeel",
    maxAmount: "Geen limiet per transactie",
    friction: "High",
    afasCode: 4600,
    intent: "Tijdelijk personeel uitsluitend inhuren via AB-Zorg Uitzendbureau met verplichte inkooporderreferentie.",
    limitAmount: 0,
    benchmarkScore: "Conform VVT-norm",
    benchmarkWarning: false,
    startDate: "2025-01-15",
    endDate: "2025-12-31",
    sourceDocument: "Personeelshandboek 2024, Inkoopbeleid Zorg & Welzijn",
  },
  {
    id: "POL-2026-092",
    name: "Spoedmedicatie apotheek",
    category: "Farmacie",
    maxAmount: "EUR 150,00 per transactie",
    friction: "Low",
    afasCode: 4320,
    intent: "Dienstdoend verpleegkundigen mogen met spoed medicatie en EHBO-voorraad aanschaffen bij de apotheek.",
    limitAmount: 150,
    benchmarkScore: "Geen GGZ-benchmark",
    benchmarkWarning: true,
    startDate: "2026-02-01",
    endDate: "2027-01-31",
    sourceDocument: "Inkoopbeleid Zorg & Welzijn",
  },
  {
    id: "POL-2022-12",
    name: "Reiskostenvergoeding",
    category: "Reizen & Vervoer",
    maxAmount: "EUR 0,23 per km",
    friction: "Low",
    afasCode: 4510,
    intent: "Medewerkers ontvangen een vergoeding voor zakelijke ritten met de privéauto tegen een vast kilometertarief.",
    limitAmount: 0,
    benchmarkScore: "Conform Belastingdienst",
    benchmarkWarning: false,
    startDate: "2022-01-01",
    endDate: "2026-12-31",
    sourceDocument: "Personeelshandboek 2024",
  },
  {
    id: "POL-2026-104",
    name: "Kantoorartikelen (Lyreco)",
    category: "Kantoorartikelen",
    maxAmount: "EUR 150,00 per bestelling",
    friction: "Medium",
    afasCode: 4230,
    intent: "Alle kantoorartikelen verplicht bestellen via de raamovereenkomst met Lyreco, met een goedkeuringsdrempel.",
    limitAmount: 150,
    benchmarkScore: "Conform sectorgemiddelde",
    benchmarkWarning: false,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    sourceDocument: "Inkoopbeleid Zorg & Welzijn",
  },
  {
    id: "POL-2026-115",
    name: "Locatie-inrichting & apparatuur",
    category: "Kantoorartikelen",
    maxAmount: "EUR 75,00 per artikel",
    friction: "Low",
    afasCode: 4230,
    intent: "Zorglocaties mogen kleine inrichtingsartikelen en apparatuur (lampen, verlichting, klein meubilair) via Lyreco aanschaffen zonder voorafgaande goedkeuring.",
    limitAmount: 75,
    benchmarkScore: "Conform sectorgemiddelde",
    benchmarkWarning: false,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    sourceDocument: "Inkoopbeleid Zorg & Welzijn",
  },
  {
    id: "POL-2026-120",
    name: "Ad-hoc noodaankopen",
    category: "Noodvoorzieningen",
    maxAmount: "EUR 25,00 per transactie",
    friction: "Low",
    afasCode: 4340,
    intent: "Medewerkers mogen kleine ad-hoc aankopen doen voor urgente of onvoorziene behoeften (bijv. regenkleding, noodvoorraad) bij elke winkel in de buurt, zonder voorafgaande goedkeuring.",
    limitAmount: 25,
    benchmarkScore: "Geen sectorbenchmark",
    benchmarkWarning: true,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    sourceDocument: "Inkoopbeleid Zorg & Welzijn",
  },
];

/* ── Conflict policies ── */

export const CONFLICT_POLICIES: ConflictPolicy[] = [
  {
    id: "POL-2026-088",
    name: "Verjaardagsbudget bewoners",
    category: "Recreatie & Welzijn",
    friction: "Medium",
    afasCode: 4340,
    intent: "Per bewoner een verjaardagsbudget voor taart, versiering en een klein cadeautje.",
    conflictField: "Maximale besteding per verjaardag",
    sourceA: { label: "Personeelshandboek", value: 15, display: "EUR 15" },
    sourceB: { label: "Financieel Reglement", value: 25, display: "EUR 25" },
    benchmark: { label: "Sectorgemiddelde", value: 20, display: "EUR 20" },
    sourceDocument: "Personeelshandboek 2024, Financieel Reglement 2025",
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
  await deleteAllPolicies();
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
      benchmark_score: null,
      benchmark_warning: false,
      start_date: p.startDate,
      end_date: p.endDate,
      source_document: p.sourceDocument ?? null,
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
        benchmark_score: null,
        benchmark_warning: false,
        source_document: p.sourceDocument ?? null,
      };
    }),
  ];

  const { count } = await apiUpsert(rows);
  return count;
}

export async function populateBenchmarks() {
  const updates = [
    ...READY_POLICIES.map((p) => ({
      id: p.id,
      benchmark_score: p.benchmarkScore,
      benchmark_warning: p.benchmarkWarning,
    })),
    ...CONFLICT_POLICIES.map((p) => ({
      id: p.id,
      benchmark_score: `${p.benchmark.label}: ${p.benchmark.display}`,
      benchmark_warning: true,
    })),
  ];

  const { count } = await apiBenchmarks(updates);
  return count;
}
