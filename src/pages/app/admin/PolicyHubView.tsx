import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, type TableColumn, type TableSort } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { mockLedger } from "@/data/mock-ledger";
import { usePolicies } from "@/hooks/use-policies";
import type { Policy } from "@/hooks/use-policies";
import { useDocumentJobs } from "@/hooks/use-document-jobs";
import { deleteAllDocumentJobs, cancelDocumentJob, fetchPolicyConflicts, resolveConflict as apiResolveConflict, resolveConflictKeepBoth as apiResolveConflictKeepBoth, type PolicyConflictRow } from "@/lib/api";
import { resetPoliciesTable, populateBenchmarks } from "@/data/onboarding-policies";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import OnboardingModal from "@/components/OnboardingModal";

type FilterKey = "all" | "active" | "pending_review" | "conflict" | "review" | "draft";

/* ------------------------------------------------------------------ */
/*  Ledger options for AFAS mapping dropdown                           */
/* ------------------------------------------------------------------ */
const ledgerOptions = mockLedger.flatMap((cat) =>
  cat.subLedgers.map((sl) => ({
    label: `${sl.code} – ${sl.name}`,
    value: String(sl.code),
  }))
);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PolicyHubView() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("policyHub.filterAll") },
    { key: "active", label: t("policyHub.filterActive") },
    { key: "pending_review", label: t("policyHub.filterPendingReview") },
    { key: "draft", label: t("policyHub.filterDrafts") },
    { key: "conflict", label: t("policyHub.filterConflicts") },
    { key: "review", label: t("policyHub.filterNeedsReview") },
  ];
  const { policies, isLoading, updatePolicy } = usePolicies();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [sort, setSort] = useState<TableSort>({ column: "id", direction: "asc" });
  const queryClient = useQueryClient();
  const { jobs, hasActiveJobs, processingJob, queuedJobs, completedJobs, errorJobs, invalidate: invalidateJobs } = useDocumentJobs();
  const [conflicts, setConflicts] = useState<PolicyConflictRow[]>([]);

  // Fetch conflicts
  useEffect(() => {
    fetchPolicyConflicts().then(setConflicts).catch(() => {});
  }, [policies]);


  const handleRemoveAll = async () => {
    setRemoving(true);
    try {
      await resetPoliciesTable();
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success(t("policyHub.allRemoved"));
    } catch {
      toast.error(t("policyHub.removeFailed"));
    } finally {
      setRemoving(false);
    }
  };

  const hasBenchmarks = policies.some((p) => !!p.benchmarkScore);

  const handleBenchmark = async () => {
    setBenchmarking(true);
    try {
      const count = await populateBenchmarks();
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success(t("policyHub.benchmarked", { count }));
    } catch {
      toast.error(t("policyHub.benchmarkFailed"));
    } finally {
      setBenchmarking(false);
    }
  };

  const selectedPolicy = policies.find((p) => p.id === selectedId) ?? null;

  /* ---- Review queue: pending_review navigation ---- */
  const pendingPolicies = useMemo(
    () => policies.filter((p) => p.status === "pending_review"),
    [policies]
  );
  const pendingIndex = selectedPolicy
    ? pendingPolicies.findIndex((p) => p.id === selectedPolicy.id)
    : -1;
  const prevPendingId = pendingIndex > 0 ? pendingPolicies[pendingIndex - 1].id : null;
  const nextPendingId =
    pendingIndex >= 0 && pendingIndex < pendingPolicies.length - 1
      ? pendingPolicies[pendingIndex + 1].id
      : null;
  const hasNextPending = nextPendingId !== null;

  const handleActivateAndNext = () => {
    if (!selectedPolicy) return;
    // Save any pending draft changes together with activation
    const changes: Record<string, any> = { status: "active" };
    if (draft.intent !== selectedPolicy.intent) changes.intent = draft.intent;
    if (draft.maxAmount !== selectedPolicy.maxAmount) changes.maxAmount = draft.maxAmount;
    if (draft.startDate !== selectedPolicy.startDate) changes.startDate = draft.startDate;
    if (draft.endDate !== selectedPolicy.endDate) changes.endDate = draft.endDate;
    if (draft.afasCode !== selectedPolicy.afasCode) {
      changes.afasCode = draft.afasCode;
      changes.ledger = draft.afasCode ? String(draft.afasCode) : "";
    }
    updatePolicy(selectedPolicy.id, changes);
    toast.success(t("policyHub.policyActivated"));
    if (hasNextPending) {
      setSelectedId(nextPendingId);
    } else {
      setSelectedId(null);
      toast.success(t("policyHub.allReviewed"));
    }
  };

  const handleSkipNext = () => {
    if (hasNextPending) {
      setSelectedId(nextPendingId);
    }
  };

  const handleStartReview = () => {
    if (pendingPolicies.length > 0) {
      setFilter("pending_review");
      setSelectedId(pendingPolicies[0].id);
    }
  };

  /* ---- Local draft state for editable sidebar fields ---- */
  const [draft, setDraft] = useState({
    intent: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
    afasCode: null as number | null,
  });

  useEffect(() => {
    if (selectedPolicy) {
      setDraft({
        intent: selectedPolicy.intent,
        maxAmount: selectedPolicy.maxAmount,
        startDate: selectedPolicy.startDate,
        endDate: selectedPolicy.endDate,
        afasCode: selectedPolicy.afasCode,
      });
    }
  }, [selectedPolicy?.id, selectedPolicy?.intent, selectedPolicy?.maxAmount, selectedPolicy?.startDate, selectedPolicy?.endDate, selectedPolicy?.afasCode]);

  const isDirty = selectedPolicy
    ? draft.intent !== selectedPolicy.intent ||
      draft.maxAmount !== selectedPolicy.maxAmount ||
      draft.startDate !== selectedPolicy.startDate ||
      draft.endDate !== selectedPolicy.endDate ||
      draft.afasCode !== selectedPolicy.afasCode
    : false;

  const handleSave = () => {
    if (!selectedPolicy || !isDirty) return;
    const changes: Record<string, any> = {};
    if (draft.intent !== selectedPolicy.intent) changes.intent = draft.intent;
    if (draft.maxAmount !== selectedPolicy.maxAmount) changes.maxAmount = draft.maxAmount;
    if (draft.startDate !== selectedPolicy.startDate) changes.startDate = draft.startDate;
    if (draft.endDate !== selectedPolicy.endDate) changes.endDate = draft.endDate;
    if (draft.afasCode !== selectedPolicy.afasCode) {
      changes.afasCode = draft.afasCode;
      changes.ledger = draft.afasCode ? String(draft.afasCode) : "";
    }
    updatePolicy(selectedPolicy.id, changes);
    toast.success(t("policyHub.policyUpdated"));
  };

  /* Filtering & search */
  const filtered = useMemo(() => {
    let list = policies;
    if (filter === "active") list = list.filter((p) => p.status === "active");
    else if (filter === "pending_review") list = list.filter((p) => p.status === "pending_review");
    else if (filter === "conflict") list = list.filter((p) => p.status === "conflict");
    else if (filter === "review") list = list.filter((p) => p.benchmarkWarning);
    else if (filter === "draft") list = list.filter((p) => p.status === "draft");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.ledger.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [policies, filter, search]);

  /* Conflict resolution helpers */
  const resolveConflict = (policyId: string, newStatus: "active" | "deprecated", newAmount?: string) => {
    updatePolicy(policyId, { status: newStatus, ...(newAmount ? { maxAmount: newAmount } : {}) });
  };

  const deprecatePolicy = (policyId: string) => {
    updatePolicy(policyId, { status: "deprecated" });
  };

  const activatePolicy = (policyId: string) => {
    updatePolicy(policyId, { status: "active" });
  };

  /* Benchmark insight data for policies that don't match standards */
  const BENCHMARK_INSIGHTS: Record<string, { explanation: string; standardAmount?: string; standardBenchmark?: string }> = {
    "POL-2026-041": {
      explanation: "Your limit of EUR 50,00 per transaction is above the VVT sector standard of EUR 35,00. Consider lowering to reduce overspend risk.",
      standardAmount: "EUR 35,00 per transaction",
      standardBenchmark: "Matches VVT Standard",
    },
    "POL-2024-05": {
      explanation: "Your policy limits spend to EUR 1,80/client/day. The current GGZ/VVT average is EUR 2,10/client/day. This may explain the high volume of out-of-stock exceptions.",
      standardAmount: "EUR 2,10 per client per day",
      standardBenchmark: "Matches GGZ Standard",
    },
    "POL-2025-18": {
      explanation: "Your limit of EUR 15,00 per transaction is below the VVT sector standard of EUR 20,00. Staff may be unable to cover daily grocery needs.",
      standardAmount: "EUR 20,00 per transaction",
      standardBenchmark: "Matches VVT Standard",
    },
    "POL-2026-092": {
      explanation: "No GGZ benchmark exists for pharmacy runs. Consider reviewing peer organizations to set an appropriate limit.",
    },
    "POL-2026-120": {
      explanation: "No sector benchmark exists for ad-hoc emergency purchases. Consider setting a quarterly cap to control cumulative spend.",
    },
  };

  // Helpers for conflict resolution
  const getConflictsForPolicy = (policyId: string) =>
    conflicts.filter((c) => !c.resolved && (c.policy_a_id === policyId || c.policy_b_id === policyId));

  const handleResolveConflict = async (conflict: PolicyConflictRow, keepPolicyId: string) => {
    const otherPolicyId = conflict.policy_a_id === keepPolicyId ? conflict.policy_b_id : conflict.policy_a_id;
    try {
      await apiResolveConflict(conflict.id, keepPolicyId);
      updatePolicy(keepPolicyId, { status: "active" });
      updatePolicy(otherPolicyId, { status: "deprecated" });
      setConflicts((prev) => prev.map((c) => c.id === conflict.id ? { ...c, resolved: true, resolved_policy_id: keepPolicyId } : c));
      toast.success(t("policyHub.conflictResolved"));
    } catch {
      toast.error("Failed to resolve conflict.");
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelDocumentJob(jobId);
      invalidateJobs();
    } catch {}
  };

  const handleResolveKeepBoth = async (conflict: PolicyConflictRow) => {
    try {
      await apiResolveConflictKeepBoth(conflict.id);
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      setConflicts((prev) => prev.map((c) => c.id === conflict.id ? { ...c, resolved: true } : c));
      toast.success(t("policyHub.conflictResolved"));
    } catch {
      toast.error("Failed to resolve conflict.");
    }
  };

  const handleClearCompletedJobs = async () => {
    try {
      await deleteAllDocumentJobs();
      invalidateJobs();
    } catch {}
  };

  /* Status badge helper */
  const statusBadge = (status: Policy["status"]) => {
    const map: Record<Policy["status"], { label: string; color: "success" | "error" | "neutral" | "warning" }> = {
      active: { label: t("policyHub.statusActive"), color: "success" },
      pending_review: { label: t("policyHub.statusPendingReview"), color: "warning" },
      conflict: { label: t("policyHub.statusConflict"), color: "error" },
      deprecated: { label: t("policyHub.statusDeprecated"), color: "neutral" },
      draft: { label: t("policyHub.statusDraft"), color: "warning" },
    };
    const entry = map[status];
    if (!entry) return <Badge status colorScheme="neutral" label={status} />;
    return <Badge status colorScheme={entry.color} label={entry.label} />;
  };

  return (
    <div className="space-y-sp-24">
      {/* ---- Header ---- */}
      <PageHeader
        title={t("policyHub.title")}
        subtitle={t("policyHub.subtitle")}
        icon="fa-solid fa-book"
      />

      {/* ---- Actions ---- */}
      <div className="flex items-center gap-sp-8">
        <Button
          variant="solid"
          colorScheme="primary"
          onClick={() => setOnboardingOpen(true)}
        >
          <i className="fa-solid fa-file-arrow-up" aria-hidden="true" />
          {t("policyHub.addDocument")}
        </Button>
        <Button
          variant="outline"
          colorScheme="primary"
          disabled={benchmarking || policies.length === 0 || hasBenchmarks}
          onClick={handleBenchmark}
        >
          <i className="fa-solid fa-chart-bar" aria-hidden="true" />
          {benchmarking ? t("policyHub.benchmarking") : t("policyHub.benchmark")}
        </Button>
        <Button
          variant="outline"
          colorScheme="error"
          disabled={removing || policies.length === 0}
          onClick={handleRemoveAll}
        >
          <i className="fa-solid fa-trash-can" aria-hidden="true" />
          {removing ? t("policyHub.removing") : t("policyHub.removeAll")}
        </Button>
      </div>

      {/* ---- Onboarding ---- */}
      <OnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onActivated={() => {
          queryClient.invalidateQueries({ queryKey: ["policies"] });
          invalidateJobs();
        }}
      />

      {/* ---- Document Queue Panel ---- */}
      {jobs.length > 0 && (
        <div className="rounded-lg border border-border bg-background p-sp-16 space-y-sp-12">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-sp-8">
              <i className="fa-solid fa-layer-group text-primary" aria-hidden="true" />
              {t("queue.title")}
            </h3>
            {!hasActiveJobs && (
              <Button variant="outline" onClick={handleClearCompletedJobs}>
                <i className="fa-solid fa-broom" aria-hidden="true" />
                {t("queue.clearCompleted")}
              </Button>
            )}
          </div>
          <div className="space-y-sp-8">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center gap-sp-12 text-sm">
                <div className="flex items-center justify-center w-6 h-6 shrink-0">
                  {job.status === "processing" && (
                    <i className="fa-solid fa-spinner fa-spin text-primary" aria-hidden="true" />
                  )}
                  {job.status === "queued" && (
                    <i className="fa-solid fa-clock text-muted-foreground" aria-hidden="true" />
                  )}
                  {job.status === "done" && (
                    <i className="fa-solid fa-circle-check text-success" aria-hidden="true" />
                  )}
                  {job.status === "error" && (
                    <i className="fa-solid fa-circle-xmark text-error" aria-hidden="true" />
                  )}
                  {job.status === "cancelled" && (
                    <i className="fa-solid fa-ban text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground truncate block">{job.filename}</span>
                </div>
                <div className="shrink-0 flex items-center gap-sp-8">
                  {job.status === "processing" && (
                    <Badge colorScheme="primary" label={`${t("queue.processing")}${job.policies_extracted > 0 ? ` (${job.policies_extracted})` : ""}`} />
                  )}
                  {job.status === "queued" && (
                    <Badge colorScheme="neutral" label={t("queue.queued")} />
                  )}
                  {job.status === "done" && (
                    <Badge colorScheme="success" label={t("queue.policiesExtracted", { count: job.policies_extracted })} />
                  )}
                  {job.status === "error" && (
                    <Badge colorScheme="error" label={t("queue.error")} />
                  )}
                  {job.status === "cancelled" && (
                    <Badge colorScheme="neutral" label={t("queue.cancelled")} />
                  )}
                  {(job.status === "queued" || job.status === "processing") && (
                    <button
                      type="button"
                      onClick={() => handleCancelJob(job.id)}
                      className="text-muted-foreground hover:text-error transition-colors p-sp-4"
                      aria-label={t("queue.cancel")}
                      title={t("queue.cancel")}
                    >
                      <i className="fa-solid fa-xmark text-sm" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {hasActiveJobs && (
            <Progress indeterminate colorScheme="primary" />
          )}
        </div>
      )}

      {/* ---- Search ---- */}
      <div className="max-w-md">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("policyHub.searchPlaceholder")}
          leadingIcon={<i className="fa-solid fa-magnifying-glass" aria-hidden="true" />}
        />
      </div>

      {/* ---- Filter chips ---- */}
      <div className="flex gap-sp-8">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)}>
            <Badge
              colorScheme={filter === f.key ? "primary" : "neutral"}
              label={f.label}
              className="cursor-pointer select-none"
            />
          </button>
        ))}
      </div>

      {/* ---- Start Review Banner ---- */}
      {pendingPolicies.length > 0 && !selectedPolicy && (
        <div className="flex items-center gap-sp-12 rounded-lg border border-warning/30 bg-warning/10 px-sp-16 py-sp-12">
          <i className="fa-solid fa-clipboard-check text-warning" aria-hidden="true" />
          <span className="text-sm text-foreground flex-1">
            {t("policyHub.pendingBanner", { count: pendingPolicies.length })}
          </span>
          <Button variant="solid" colorScheme="primary" onClick={handleStartReview}>
            <i className="fa-solid fa-play" aria-hidden="true" />
            {t("policyHub.startReview")}
          </Button>
        </div>
      )}

      {/* ---- Table + Ghost skeleton rows ---- */}
      <div>
        <Table<Policy>
          data={filtered}
          rowKey="id"
          sort={sort}
          onSortChange={setSort}
          stickyHeader
          className={`max-h-[60vh]${hasActiveJobs ? " !rounded-b-none" : ""}`}
          emptyMessage={t("policyHub.emptyMessage")}
          onRowClick={(row) => setSelectedId(row.id)}
          rowClassName={(row) => selectedId === row.id ? "!bg-blue-50 dark:!bg-grey-800" : ""}
          columns={[
            {
              key: "id",
              label: t("policyHub.colPolicyId"),
              sortable: true,
              width: "130px",
              cell: (row) => <span className="font-mono whitespace-nowrap">{row.id}</span>,
            },
            {
              key: "name",
              label: t("policyHub.colName"),
              sortable: true,
              cell: (row) => <span className="font-semibold block truncate max-w-[200px]" title={row.name}>{row.name}</span>,
            },
            {
              key: "category",
              label: t("policyHub.colCategory"),
              sortable: true,
              cell: (row) => <span className="text-muted-foreground">{row.category}</span>,
            },
            {
              key: "status",
              label: t("policyHub.colStatus"),
              width: "120px",
              cell: (row) => statusBadge(row.status),
            },
            {
              key: "maxAmount",
              label: t("policyHub.colMaxAmount"),
              cell: (row) => <span className="text-muted-foreground">{row.maxAmount || "—"}</span>,
            },
            {
              key: "friction",
              label: t("policyHub.colFriction"),
              width: "80px",
              cell: (row) => <span className="text-muted-foreground">{row.friction}</span>,
            },
            {
              key: "benchmarkScore",
              label: t("policyHub.colBenchmark"),
              cell: (row) =>
                row.benchmarkScore ? (
                  <span className="inline-flex items-center gap-sp-4">
                    {row.benchmarkWarning && (
                      <i className="fa-solid fa-triangle-exclamation text-warning text-xs" aria-hidden="true" />
                    )}
                    <span className={row.benchmarkWarning ? "text-warning" : "text-success"}>
                      {row.benchmarkScore}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              key: "sourceDocument",
              label: t("policyHub.colSource"),
              cell: (row) =>
                row.sourceDocument ? (
                  <span className="inline-flex items-center gap-sp-4 text-muted-foreground">
                    <i className="fa-solid fa-file-lines text-xs" aria-hidden="true" />
                    <span className="truncate max-w-[140px]" title={row.sourceDocument}>{row.sourceDocument.split(",")[0].trim()}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              key: "endDate",
              label: t("policyHub.colEndDate"),
              sortable: true,
              width: "100px",
              cell: (row) => <span className="text-muted-foreground whitespace-nowrap">{row.endDate || "—"}</span>,
            },
          ]}
        />
        {/* Ghost skeleton rows while extracting */}
        {hasActiveJobs && (
          <div className="border border-t-0 border-input rounded-b-lg overflow-hidden">
            <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "130px" }} />
                <col />
                <col />
                <col style={{ width: "120px" }} />
                <col />
                <col style={{ width: "80px" }} />
                <col />
                <col />
                <col style={{ width: "100px" }} />
              </colgroup>
              <tbody>
                {[0, 1, 2].map((i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-surface" : ""}>
                    {Array.from({ length: 9 }).map((_, ci) => (
                      <td key={ci} className="px-sp-16 py-sp-8">
                        <div
                          className="h-4 bg-muted animate-pulse rounded w-3/4"
                          style={{ animationDelay: `${i * 200 + ci * 75}ms` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---- Detail Panel (slide-out) ---- */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] bg-background border-l border-border shadow-xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${
          selectedPolicy ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedPolicy && (
          <div className="p-sp-24 flex flex-col gap-sp-24">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{selectedPolicy.id}</p>
                <h2 className="font-heading font-medium text-lg text-foreground mt-sp-4">
                  {selectedPolicy.name}
                </h2>
                <div className="mt-sp-8 mb-sp-8">{statusBadge(selectedPolicy.status)}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-sp-4"
                aria-label="Close panel"
              >
                <i className="fa-solid fa-xmark text-lg" aria-hidden="true" />
              </button>
            </div>

            {/* ---- Review Queue Navigation ---- */}
            {pendingIndex >= 0 && pendingPolicies.length > 1 && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-sp-12 py-sp-8">
                <button
                  type="button"
                  disabled={!prevPendingId}
                  onClick={() => prevPendingId && setSelectedId(prevPendingId)}
                  className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-sp-4"
                >
                  <i className="fa-solid fa-chevron-left mr-sp-4" aria-hidden="true" />
                  {t("common.review")}
                </button>
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("policyHub.reviewProgress", { current: pendingIndex + 1, total: pendingPolicies.length })}
                </span>
                <button
                  type="button"
                  disabled={!nextPendingId}
                  onClick={() => nextPendingId && setSelectedId(nextPendingId)}
                  className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-sp-4"
                >
                  {t("common.review")}
                  <i className="fa-solid fa-chevron-right ml-sp-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* ---- Source & Created At ---- */}
            <div className="flex flex-col gap-sp-4 text-sm">
              <div className="flex items-center gap-sp-8">
                <span className="text-xs text-muted-foreground font-semibold">{t("policyHub.labelSource")}:</span>
                {selectedPolicy.sourceDocument ? (
                  <span className="inline-flex items-center gap-sp-4 text-xs text-foreground">
                    <i className="fa-solid fa-file-lines text-xs text-muted-foreground" aria-hidden="true" />
                    {selectedPolicy.sourceDocument}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground italic">{t("policyHub.sourceManual")}</span>
                )}
              </div>
              {selectedPolicy.createdAt && (
                <div className="flex items-center gap-sp-8">
                  <span className="text-xs text-muted-foreground font-semibold">{t("policyHub.labelCreatedAt")}:</span>
                  <span className="text-xs text-foreground">
                    {new Date(selectedPolicy.createdAt).toLocaleDateString("nl-NL", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
            </div>

            {/* ---- Pending Review Activation Card ---- */}
            {selectedPolicy.status === "pending_review" && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-sp-16">
                <p className="text-sm font-semibold text-warning mb-sp-8">
                  {t("policyHub.pendingReviewPolicy")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("policyHub.pendingReviewPolicyDesc")}
                </p>
                <div className="flex gap-sp-8 mt-sp-12">
                  <Button
                    variant="solid"
                    colorScheme="primary"
                    onClick={handleActivateAndNext}
                  >
                    <i className="fa-solid fa-check" aria-hidden="true" />
                    {hasNextPending ? t("policyHub.activateAndNext") : t("policyHub.reviewPolicy")}
                    {hasNextPending && <i className="fa-solid fa-chevron-right ml-sp-4" aria-hidden="true" />}
                  </Button>
                  {hasNextPending && (
                    <Button
                      variant="outline"
                      onClick={handleSkipNext}
                    >
                      {t("policyHub.skipNext")}
                      <i className="fa-solid fa-chevron-right ml-sp-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* ---- Draft Activation Card ---- */}
            {selectedPolicy.status === "draft" && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-sp-16">
                <p className="text-sm font-semibold text-warning mb-sp-8">
                  {t("policyHub.draftPolicy")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("policyHub.draftPolicyDesc")}
                </p>
                <Button
                  variant="outline"
                  className="mt-sp-12"
                  onClick={() => activatePolicy(selectedPolicy.id)}
                >
                  {t("policyHub.activatePolicy")}
                </Button>
              </div>
            )}

            {/* ---- Conflict Resolution Card ---- */}
            {selectedPolicy.status === "conflict" && (() => {
              const policyConflicts = getConflictsForPolicy(selectedPolicy.id);
              if (policyConflicts.length === 0) return null;
              // Deduplicate: only show one conflict card per unique other-policy
              const seen = new Set<string>();
              const deduped = policyConflicts.filter((conflict) => {
                const otherPolicyId = conflict.policy_a_id === selectedPolicy.id ? conflict.policy_b_id : conflict.policy_a_id;
                if (seen.has(otherPolicyId)) return false;
                seen.add(otherPolicyId);
                return true;
              });
              return deduped.map((conflict) => {
                const otherPolicyId = conflict.policy_a_id === selectedPolicy.id ? conflict.policy_b_id : conflict.policy_a_id;
                const otherPolicy = policies.find((p) => p.id === otherPolicyId);
                return (
                  <div key={conflict.id} className="rounded-lg border border-error/30 bg-error/10 p-sp-16">
                    <p className="text-sm font-semibold text-error mb-sp-4">
                      {t("policyHub.conflictPolicy")}
                    </p>
                    <p className="text-xs text-muted-foreground mb-sp-4">
                      <span className="font-semibold">{t("policyHub.conflictField")}:</span> {conflict.conflict_field}
                    </p>
                    {conflict.description && (
                      <p className="text-xs text-muted-foreground mb-sp-4 italic">
                        {conflict.description}
                      </p>
                    )}
                    {otherPolicy && (
                      <div className="rounded border border-border bg-background p-sp-12 mb-sp-8">
                        <p className="text-xs font-semibold text-foreground mb-sp-4">
                          {t("policyHub.conflictWith")}: {otherPolicy.id} — {otherPolicy.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{otherPolicy.maxAmount}</p>
                        {otherPolicy.intent && (
                          <p className="text-xs text-muted-foreground mt-sp-4 leading-relaxed">{otherPolicy.intent}</p>
                        )}
                      </div>
                    )}
                    <div className="flex gap-sp-8 flex-wrap">
                      <Button
                        variant="solid"
                        colorScheme="primary"
                        onClick={() => handleResolveConflict(conflict, selectedPolicy.id)}
                      >
                        {t("policyHub.resolveKeepThis")}
                      </Button>
                      {otherPolicy && (
                        <Button
                          variant="outline"
                          onClick={() => handleResolveConflict(conflict, otherPolicyId)}
                        >
                          {t("policyHub.resolveKeepOther")}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleResolveKeepBoth(conflict)}
                      >
                        {t("policyHub.resolveKeepBoth")}
                      </Button>
                    </div>
                  </div>
                );
              });
            })()}

            {/* ---- Benchmark Insight Card (generic) ---- */}
            {selectedPolicy.benchmarkWarning && selectedPolicy.status !== "deprecated" && (() => {
              const insight = BENCHMARK_INSIGHTS[selectedPolicy.id];
              if (!insight) return null;
              return (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-sp-16 dark:border-blue-800 dark:bg-blue-950">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-sp-4">
                    {t("policyHub.industryInsight")}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-sp-8">
                    {selectedPolicy.benchmarkScore}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
                    {insight.explanation}
                  </p>
                  {insight.standardAmount && insight.standardBenchmark && (
                    <Button
                      variant="outline"
                      className="mt-sp-12 whitespace-normal text-left"
                      onClick={() => {
                        updatePolicy(selectedPolicy.id, {
                          maxAmount: insight.standardAmount!,
                          benchmarkScore: insight.standardBenchmark!,
                          benchmarkWarning: false,
                        });
                        toast.success(t("policyHub.limitUpdated", { amount: insight.standardAmount }));
                      }}
                    >
                      <i className="fa-solid fa-arrow-trend-up" aria-hidden="true" />
                      {t("policyHub.updateToStandard")}
                    </Button>
                  )}
                </div>
              );
            })()}

            {/* ---- Tags ---- */}
            {selectedPolicy.tags.length > 0 && (
              <div className="flex flex-wrap gap-sp-4">
                {selectedPolicy.tags.map((tag) => (
                  <Badge key={tag} colorScheme="neutral" label={tag} className="text-xs" />
                ))}
              </div>
            )}

            {/* ---- Policy Rules Editor ---- */}
            <section className="pt-sp-8 border-t border-border">
              <h3 className="font-semibold text-sm text-foreground mb-sp-12">{t("policyHub.policyRules")}</h3>
              <div className="flex flex-col gap-sp-12">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-sp-4 block">{t("policyHub.labelIntent")}</label>
                  <textarea
                    value={draft.intent}
                    onChange={(e) => setDraft((d) => ({ ...d, intent: e.target.value }))}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-sp-4 block">{t("policyHub.labelMaxAmount")}</label>
                  <Input
                    value={draft.maxAmount}
                    onChange={(e) => setDraft((d) => ({ ...d, maxAmount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-sp-4 block">{t("policyHub.labelAllowedCategories")}</label>
                  <Input static value={selectedPolicy.allowedCategories} readOnly />
                </div>
              </div>
            </section>

            {/* ---- AFAS Mapping ---- */}
            <section className="pt-sp-8 border-t border-border">
              <h3 className="font-semibold text-sm text-foreground mb-sp-12">{t("policyHub.afasMapping")}</h3>
              <label className="text-xs text-muted-foreground font-semibold mb-sp-4 block">{t("policyHub.labelLedger")}</label>
              <Select
                items={ledgerOptions}
                value={draft.afasCode ? String(draft.afasCode) : undefined}
                placeholder={t("policyHub.selectLedger")}
                onValueChange={(val) => setDraft((d) => ({ ...d, afasCode: Number(val) }))}
              />
            </section>

            {/* ---- Lifecycle Management ---- */}
            <section className="pt-sp-8 border-t border-border">
              <h3 className="font-semibold text-sm text-foreground mb-sp-12">{t("policyHub.lifecycle")}</h3>
              <div className="grid grid-cols-2 gap-sp-12">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-sp-4 block">{t("policyHub.labelStartDate")}</label>
                  <Input
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-sp-4 block">{t("policyHub.labelEndDate")}</label>
                  <Input
                    type="date"
                    value={draft.endDate}
                    onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* ---- Update Policy button ---- */}
              <Button
                variant="solid"
                colorScheme="primary"
                className="mt-sp-16 w-full"
                disabled={!isDirty}
                onClick={handleSave}
              >
                <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
                {t("policyHub.updatePolicy")}
              </Button>
              {selectedPolicy.status !== "deprecated" && (
                <Button
                  colorScheme="error"
                  variant="outline"
                  className="mt-sp-16 w-full"
                  onClick={() => deprecatePolicy(selectedPolicy.id)}
                >
                  <i className="fa-solid fa-ban mr-sp-8" aria-hidden="true" />
                  {t("policyHub.deprecatePolicy")}
                </Button>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Overlay when panel is open */}
      {selectedPolicy && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
