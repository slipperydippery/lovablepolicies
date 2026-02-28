/**
 * Repository interfaces for policy storage, document jobs, conflicts, and audit log.
 * Implement these interfaces to swap storage backends (SQLite, Postgres, etc.).
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
  extraction_job_id: string | null;
  tags: string | null;
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

/* ── Document Jobs ─────────────────────────────────────────────────── */

export interface DocumentJobRow {
  id: string;
  filename: string;
  file_content: string | null;
  status: "queued" | "processing" | "done" | "error" | "cancelled";
  policies_extracted: number;
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface IDocumentJobRepository {
  getAll(): DocumentJobRow[];
  getById(id: string): DocumentJobRow | undefined;
  create(job: Pick<DocumentJobRow, "id" | "filename" | "file_content">): void;
  updateStatus(id: string, status: DocumentJobRow["status"], extra?: { policies_extracted?: number; error_message?: string }): void;
  getNextQueued(): DocumentJobRow | undefined;
  cancel(id: string): void;
  deleteAll(): number;
}

/* ── Policy Conflicts ──────────────────────────────────────────────── */

export interface PolicyConflictRow {
  id: string;
  policy_a_id: string;
  policy_b_id: string;
  conflict_field: string;
  description: string | null;
  resolved: boolean;
  resolved_policy_id: string | null;
  created_at: string | null;
}

export interface IPolicyConflictRepository {
  getAll(): PolicyConflictRow[];
  getByPolicyId(policyId: string): PolicyConflictRow[];
  create(conflict: Omit<PolicyConflictRow, "resolved" | "resolved_policy_id" | "created_at">): void;
  resolve(id: string, resolvedPolicyId: string): void;
  deleteAll(): number;
}

/* ── Audit Log ─────────────────────────────────────────────────────── */

export interface AuditLogRow {
  id: number;
  policy_id: string;
  action: string;
  changes_json: string | null;
  source: string | null;
  created_at: string | null;
}

export interface IAuditLogRepository {
  log(entry: Pick<AuditLogRow, "policy_id" | "action" | "changes_json" | "source">): void;
  getByPolicyId(policyId: string): AuditLogRow[];
}
