import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDocumentJobs, type DocumentJobRow } from "@/lib/api";

const JOBS_KEY = ["document-jobs"];

export function useDocumentJobs() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: JOBS_KEY,
    queryFn: fetchDocumentJobs,
    // Poll every 2s while any jobs are queued or processing
    refetchInterval: (query) => {
      const jobs = query.state.data;
      if (!jobs || jobs.length === 0) return false;
      const hasActive = jobs.some((j) => j.status === "queued" || j.status === "processing");
      return hasActive ? 2000 : false;
    },
  });

  const jobs = query.data ?? [];
  const hasActiveJobs = jobs.some((j) => j.status === "queued" || j.status === "processing");
  const processingJob = jobs.find((j) => j.status === "processing");
  const queuedJobs = jobs.filter((j) => j.status === "queued");
  const completedJobs = jobs.filter((j) => j.status === "done");
  const errorJobs = jobs.filter((j) => j.status === "error");
  const cancelledJobs = jobs.filter((j) => j.status === "cancelled");

  // Invalidate policies on every poll cycle while jobs are active
  // so newly extracted policies appear in real-time
  const prevDataRef = useRef(query.data);
  useEffect(() => {
    if (query.data !== prevDataRef.current && hasActiveJobs) {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    }
    prevDataRef.current = query.data;
  }, [query.data, hasActiveJobs]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: JOBS_KEY });
    queryClient.invalidateQueries({ queryKey: ["policies"] });
  };

  return {
    jobs,
    hasActiveJobs,
    processingJob,
    queuedJobs,
    completedJobs,
    errorJobs,
    cancelledJobs,
    isLoading: query.isLoading,
    invalidate,
  };
}
