import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPolicies, updatePolicy as apiUpdatePolicy, type PolicyRow } from "@/lib/api";

export interface Policy {
  id: string;
  name: string;
  ledger: string;
  status: "active" | "pending_review" | "conflict" | "deprecated" | "draft";
  benchmarkScore: string | null;
  benchmarkWarning: boolean;
  validUntil: string;
  intent: string;
  maxAmount: string;
  allowedCategories: string;
  afasCode: number | null;
  startDate: string;
  endDate: string;
  limit: number;
  friction: "Low" | "Medium" | "High";
  category: string;
  sourceDocument: string;
  extractionJobId: string;
  createdAt: string;
}

// PolicyRow type is imported from @/lib/api

function rowToPolicy(row: PolicyRow): Policy {
  return {
    id: row.id,
    name: row.name,
    ledger: row.ledger ?? "",
    status: row.status as Policy["status"],
    benchmarkScore: row.benchmark_score,
    benchmarkWarning: row.benchmark_warning ?? false,
    validUntil: row.valid_until ?? "",
    intent: row.intent ?? "",
    maxAmount: row.max_amount ?? "",
    allowedCategories: row.allowed_categories ?? "",
    afasCode: row.afas_code,
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    limit: row.limit_amount ?? 0,
    friction: (row.friction ?? "Low") as Policy["friction"],
    category: row.category ?? "",
    sourceDocument: row.source_document ?? "",
    extractionJobId: row.extraction_job_id ?? "",
    createdAt: row.created_at ?? "",
  };
}

const POLICIES_KEY = ["policies"];

export function usePolicies() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: POLICIES_KEY,
    queryFn: async (): Promise<Policy[]> => {
      const data = await fetchPolicies();
      return data.map(rowToPolicy);
    },
  });

  const updatePolicy = useMutation({
    mutationFn: async (updates: { id: string; changes: Record<string, any> }) => {
      // Map camelCase fields to snake_case DB columns
      const dbChanges: Record<string, any> = {};
      const fieldMap: Record<string, string> = {
        status: "status",
        maxAmount: "max_amount",
        benchmarkScore: "benchmark_score",
        benchmarkWarning: "benchmark_warning",
        intent: "intent",
        afasCode: "afas_code",
        ledger: "ledger",
        startDate: "start_date",
        endDate: "end_date",
        sourceDocument: "source_document",
      };
      for (const [key, val] of Object.entries(updates.changes)) {
        const dbKey = fieldMap[key] ?? key;
        dbChanges[dbKey] = val;
      }

      await apiUpdatePolicy(updates.id, dbChanges);
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: POLICIES_KEY });
      const previous = queryClient.getQueryData<Policy[]>(POLICIES_KEY);
      queryClient.setQueryData<Policy[]>(POLICIES_KEY, (old) =>
        old?.map((p) =>
          p.id === updates.id ? { ...p, ...updates.changes } : p
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(POLICIES_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: POLICIES_KEY });
    },
  });

  return {
    policies: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    updatePolicy: (id: string, changes: Record<string, any>) =>
      updatePolicy.mutate({ id, changes }),
  };
}
