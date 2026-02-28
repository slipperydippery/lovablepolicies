import type Database from "better-sqlite3";
import type { IPolicyRepository, PolicyRow } from "./repo.js";

/**
 * SQLite implementation of IPolicyRepository.
 * All SQL lives here — swap this file to change storage backend.
 */
export class SqlitePolicyRepository implements IPolicyRepository {
  constructor(private db: Database.Database) {}

  getAll(): PolicyRow[] {
    const rows = this.db.prepare("SELECT * FROM policies ORDER BY id").all() as any[];
    return rows.map(normalizeRow);
  }

  getActive(): PolicyRow[] {
    const rows = this.db
      .prepare("SELECT * FROM policies WHERE status = 'active' ORDER BY id")
      .all() as any[];
    return rows.map(normalizeRow);
  }

  getById(id: string): PolicyRow | undefined {
    const row = this.db.prepare("SELECT * FROM policies WHERE id = ?").get(id) as any | undefined;
    return row ? normalizeRow(row) : undefined;
  }

  update(id: string, changes: Record<string, unknown>): void {
    const keys = Object.keys(changes);
    if (keys.length === 0) return;

    const setClauses = keys.map((k) => `${k} = @${k}`).join(", ");
    const stmt = this.db.prepare(`UPDATE policies SET ${setClauses} WHERE id = @id`);
    stmt.run({ ...changes, id });
  }

  upsert(rows: Partial<PolicyRow>[]): number {
    if (rows.length === 0) return 0;

    const stmt = this.db.prepare(`
      INSERT INTO policies (
        id, name, category, status, max_amount, limit_amount, friction,
        intent, afas_code, ledger, benchmark_score, benchmark_warning,
        allowed_categories, source_document, start_date, end_date
      ) VALUES (
        @id, @name, @category, @status, @max_amount, @limit_amount, @friction,
        @intent, @afas_code, @ledger, @benchmark_score, @benchmark_warning,
        @allowed_categories, @source_document, @start_date, @end_date
      )
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        status = excluded.status,
        max_amount = excluded.max_amount,
        limit_amount = excluded.limit_amount,
        friction = excluded.friction,
        intent = excluded.intent,
        afas_code = excluded.afas_code,
        ledger = excluded.ledger,
        benchmark_score = excluded.benchmark_score,
        benchmark_warning = excluded.benchmark_warning,
        allowed_categories = excluded.allowed_categories,
        source_document = excluded.source_document,
        start_date = excluded.start_date,
        end_date = excluded.end_date
    `);

    const upsertMany = this.db.transaction((items: Partial<PolicyRow>[]) => {
      for (const row of items) {
        stmt.run({
          id: row.id,
          name: row.name ?? null,
          category: row.category ?? null,
          status: row.status ?? "draft",
          max_amount: row.max_amount ?? null,
          limit_amount: row.limit_amount ?? 0,
          friction: row.friction ?? null,
          intent: row.intent ?? null,
          afas_code: row.afas_code ?? null,
          ledger: row.ledger ?? null,
          benchmark_score: row.benchmark_score ?? null,
          benchmark_warning: row.benchmark_warning ? 1 : 0,
          allowed_categories: row.allowed_categories ?? null,
          source_document: row.source_document ?? null,
          start_date: row.start_date ?? null,
          end_date: row.end_date ?? null,
        });
      }
      return items.length;
    });

    return upsertMany(rows);
  }

  deleteAll(): number {
    const result = this.db.prepare("DELETE FROM policies").run();
    return result.changes;
  }

  updateBenchmarks(
    updates: { id: string; benchmark_score: string | null; benchmark_warning: boolean }[]
  ): number {
    const stmt = this.db.prepare(
      "UPDATE policies SET benchmark_score = @benchmark_score, benchmark_warning = @benchmark_warning WHERE id = @id"
    );

    const updateMany = this.db.transaction(
      (items: { id: string; benchmark_score: string | null; benchmark_warning: boolean }[]) => {
        for (const u of items) {
          stmt.run({
            id: u.id,
            benchmark_score: u.benchmark_score,
            benchmark_warning: u.benchmark_warning ? 1 : 0,
          });
        }
        return items.length;
      }
    );

    return updateMany(updates);
  }
}

/** SQLite stores booleans as 0/1 — normalize to true/false */
function normalizeRow(row: any): PolicyRow {
  return {
    ...row,
    benchmark_warning: !!row.benchmark_warning,
  };
}
