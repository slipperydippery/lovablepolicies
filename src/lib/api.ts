/**
 * Frontend API client for the Express server.
 * All DB operations go through these functions — no direct DB imports in the frontend.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchPolicies(): Promise<PolicyRow[]> {
  const res = await fetch(`${API_URL}/api/policies`);
  return handleResponse<PolicyRow[]>(res);
}

export async function updatePolicy(id: string, changes: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_URL}/api/policies/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changes }),
  });
  await handleResponse(res);
}

export async function upsertPolicies(rows: Partial<PolicyRow>[]): Promise<{ count: number }> {
  const res = await fetch(`${API_URL}/api/policies/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  return handleResponse<{ count: number }>(res);
}

export async function deleteAllPolicies(): Promise<{ count: number }> {
  const res = await fetch(`${API_URL}/api/policies`, { method: "DELETE" });
  return handleResponse<{ count: number }>(res);
}

export async function updateBenchmarks(
  updates: { id: string; benchmark_score: string | null; benchmark_warning: boolean }[]
): Promise<{ count: number }> {
  const res = await fetch(`${API_URL}/api/policies/benchmarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  return handleResponse<{ count: number }>(res);
}

/** Base URL for chat and extract endpoints */
export const CHAT_URL = `${API_URL}/api/chat`;
export const EXTRACT_URL = `${API_URL}/api/extract-policies`;
