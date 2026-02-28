/**
 * Repository interface for policy storage.
 * Implement this interface to swap storage backends (SQLite, Postgres, etc.).
 */

export interface PolicyRow {
  id: string;
  name: string;
  category: string | null;
  status: string;
  max_amount: string | null;
  limit_amount: number | null;
  friction: string | null;
  intent: string | null;
  afas_code: number | null;
  ledger: string | null;
  benchmark_score: string | null;
  benchmark_warning: boolean;
  allowed_categories: string | null;
  source_document: string | null;
  start_date: string | null;
  end_date: string | null;
  valid_until: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface IPolicyRepository {
  /** Return all policies ordered by id */
  getAll(): PolicyRow[];

  /** Return only active policies */
  getActive(): PolicyRow[];

  /** Return a single policy by id, or undefined */
  getById(id: string): PolicyRow | undefined;

  /** Update specific fields on a policy */
  update(id: string, changes: Record<string, unknown>): void;

  /** Bulk upsert (insert or replace) rows */
  upsert(rows: Partial<PolicyRow>[]): number;

  /** Delete all policies */
  deleteAll(): number;

  /** Batch-update benchmark fields */
  updateBenchmarks(updates: { id: string; benchmark_score: string | null; benchmark_warning: boolean }[]): number;
}
