import type { PolicyRow } from "./repo";

/**
 * Sector benchmark lookup keyed by AFAS ledger code.
 * Values are representative of VVT/GGZ sector averages (fake but realistic for demos).
 */
interface SectorBenchmark {
  /** Human-readable standard, e.g. "EUR 40,00 per transactie" */
  standardLabel: string;
  /** Numeric euro value for comparison against policy limit_amount */
  standardAmount: number;
  /** Source label, e.g. "VVT Sectorgemiddelde 2024" */
  source: string;
}

const SECTOR_BENCHMARKS: Record<number, SectorBenchmark> = {
  // Food, Beverages & Kitchen
  4110: { standardLabel: "EUR 18,00 per dag per groep", standardAmount: 18, source: "VVT Sectorgemiddelde 2024" },
  4120: { standardLabel: "EUR 12,00 per maaltijd", standardAmount: 12, source: "VVT Sectorgemiddelde 2024" },
  4130: { standardLabel: "EUR 8,00 per bestelling", standardAmount: 8, source: "VVT Sectorgemiddelde 2024" },

  // Groceries & Office Supplies
  4210: { standardLabel: "EUR 15,00 per dag per groep", standardAmount: 15, source: "VVT Sectorgemiddelde 2024" },
  4230: { standardLabel: "EUR 175,00 per bestelling", standardAmount: 175, source: "Sectorgemiddelde 2024" },

  // Care & Treatment
  4310: { standardLabel: "EUR 2,30 per cliënt per dag", standardAmount: 2, source: "GGZ Benchmark 2024" },
  4320: { standardLabel: "EUR 175,00 per transactie", standardAmount: 175, source: "GGZ Benchmark 2024" },
  4330: { standardLabel: "EUR 60,00 per transactie", standardAmount: 60, source: "VVT Sectorgemiddelde 2024" },
  4340: { standardLabel: "EUR 25,00 per activiteit", standardAmount: 25, source: "VVT Sectorgemiddelde 2024" },

  // Travel & Transport
  4510: { standardLabel: "EUR 0,23 per km", standardAmount: 0, source: "Belastingdienst 2024" },

  // Temporary Staff
  4600: { standardLabel: "Geen limiet per transactie", standardAmount: 0, source: "VVT Sectorgemiddelde 2024" },
};

// Additional AFAS codes used by AI extraction that aren't in the core set above
// These use reasonable ranges for healthcare procurement
const EXTENDED_BENCHMARKS: Record<number, SectorBenchmark> = {
  4220: { standardLabel: "EUR 100,00 per bestelling", standardAmount: 100, source: "Sectorgemiddelde 2024" },
  4240: { standardLabel: "EUR 300,00 per item", standardAmount: 300, source: "Sectorgemiddelde 2024" },
  4250: { standardLabel: "EUR 80,00 per bestelling", standardAmount: 80, source: "Sectorgemiddelde 2024" },
  4350: { standardLabel: "EUR 20,00 per activiteit", standardAmount: 20, source: "VVT Sectorgemiddelde 2024" },
  4410: { standardLabel: "EUR 200,00 per reparatie", standardAmount: 200, source: "Sectorgemiddelde 2024" },
  4420: { standardLabel: "EUR 60,00 per bestelling", standardAmount: 60, source: "Sectorgemiddelde 2024" },
  4430: { standardLabel: "EUR 50,00 per afvoer", standardAmount: 50, source: "Sectorgemiddelde 2024" },
  4440: { standardLabel: "EUR 180,00 per aankoop", standardAmount: 180, source: "Sectorgemiddelde 2024" },
  4450: { standardLabel: "EUR 35,00 per locatie per seizoen", standardAmount: 35, source: "Sectorgemiddelde 2024" },
  4460: { standardLabel: "EUR 125,00 per apparaat", standardAmount: 125, source: "Sectorgemiddelde 2024" },
  4520: { standardLabel: "EUR 90,00 per voertuig per maand", standardAmount: 90, source: "Sectorgemiddelde 2024" },
  4610: { standardLabel: "EUR 450,00 per medewerker per jaar", standardAmount: 450, source: "VVT Sectorgemiddelde 2024" },
  4620: { standardLabel: "EUR 12,00 per persoon per evenement", standardAmount: 12, source: "Sectorgemiddelde 2024" },
  4630: { standardLabel: "EUR 20,00 per geschenk", standardAmount: 20, source: "Sectorgemiddelde 2024" },
};

const ALL_BENCHMARKS: Record<number, SectorBenchmark> = { ...SECTOR_BENCHMARKS, ...EXTENDED_BENCHMARKS };

export interface BenchmarkResult {
  benchmark_score: string;
  benchmark_warning: boolean;
}

/**
 * Assign a benchmark score + warning to a policy based on its AFAS code and limit_amount.
 * Returns null if the policy already has a benchmark.
 */
export function assignBenchmark(policy: PolicyRow): BenchmarkResult {
  const afas = policy.afas_code;
  const limit = policy.limit_amount ?? 0;

  if (afas === null || afas === undefined) {
    return { benchmark_score: "Geen sectordata", benchmark_warning: false };
  }

  const bench = ALL_BENCHMARKS[afas];
  if (!bench) {
    return { benchmark_score: "Geen sectordata", benchmark_warning: false };
  }

  // Policies with no per-transaction limit (0) are generally conforming
  if (limit === 0 && bench.standardAmount === 0) {
    return { benchmark_score: `Conform ${bench.source}`, benchmark_warning: false };
  }
  if (limit === 0) {
    return { benchmark_score: `Conform ${bench.source}`, benchmark_warning: false };
  }

  // Compare with ±15% tolerance
  const diff = (limit - bench.standardAmount) / bench.standardAmount;

  if (Math.abs(diff) <= 0.15) {
    return { benchmark_score: `Conform ${bench.source}`, benchmark_warning: false };
  } else if (diff > 0.15) {
    return { benchmark_score: `Boven ${bench.source}`, benchmark_warning: true };
  } else {
    return { benchmark_score: `Onder ${bench.source}`, benchmark_warning: true };
  }
}

/**
 * Return the sector standard info for a given AFAS code (used by frontend for insight cards).
 */
export function getSectorBenchmark(afasCode: number): SectorBenchmark | null {
  return ALL_BENCHMARKS[afasCode] ?? null;
}
