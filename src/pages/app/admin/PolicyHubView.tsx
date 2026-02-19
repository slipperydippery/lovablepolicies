import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, type TableColumn, type TableSort } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { mockLedger } from "@/data/mock-ledger";
import { usePolicies } from "@/hooks/use-policies";
import type { Policy } from "@/hooks/use-policies";
import { resetPoliciesTable } from "@/data/onboarding-policies";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import OnboardingModal from "@/components/OnboardingModal";

type FilterKey = "all" | "active" | "conflict" | "review" | "draft";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "draft", label: "Drafts" },
  { key: "conflict", label: "Conflicts" },
  { key: "review", label: "Needs Review" },
];

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const { policies, isLoading, updatePolicy } = usePolicies();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [sort, setSort] = useState<TableSort>({ column: "id", direction: "asc" });
  const queryClient = useQueryClient();

  const handleRemoveAll = async () => {
    setRemoving(true);
    try {
      await resetPoliciesTable();
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("All policies removed.");
    } catch {
      toast.error("Failed to remove policies.");
    } finally {
      setRemoving(false);
    }
  };

  const selectedPolicy = policies.find((p) => p.id === selectedId) ?? null;

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
    toast.success("Policy updated.");
  };

  /* Filtering & search */
  const filtered = useMemo(() => {
    let list = policies;
    if (filter === "active") list = list.filter((p) => p.status === "active");
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
  };

  /* Status badge helper */
  const statusBadge = (status: Policy["status"]) => {
    const map: Record<Policy["status"], { label: string; color: "success" | "error" | "neutral" | "warning" }> = {
      active: { label: "Active", color: "success" },
      conflict: { label: "Conflict", color: "error" },
      deprecated: { label: "Deprecated", color: "neutral" },
      draft: { label: "Draft", color: "warning" },
    };
    const { label, color } = map[status];
    return <Badge status colorScheme={color} label={label} />;
  };

  return (
    <div className="relative space-y-sp-24">
      {/* ---- Header ---- */}
      <PageHeader
        title="Policy Hub"
        subtitle="Manage, benchmark, and resolve conflicts for all atomic policies."
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
          Add New Document
        </Button>
        <Button
          variant="outline"
          colorScheme="error"
          disabled={removing || policies.length === 0}
          onClick={handleRemoveAll}
        >
          <i className="fa-solid fa-trash-can" aria-hidden="true" />
          {removing ? "Removing\u2026" : "Remove All Policies"}
        </Button>
      </div>

      {/* ---- Onboarding ---- */}
      <OnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onActivated={() => queryClient.invalidateQueries({ queryKey: ["policies"] })}
      />

      {/* ---- Search ---- */}
      <div className="max-w-md">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search policies, ledgers, or keywords..."
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

      {/* ---- Table ---- */}
      <Table<Policy>
        data={filtered}
        rowKey="id"
        sort={sort}
        onSortChange={setSort}
        emptyMessage="No policies match your criteria."
        onRowClick={(row) => setSelectedId(row.id)}
        rowClassName={(row) => selectedId === row.id ? "!bg-blue-50 dark:!bg-grey-800" : ""}
        columns={[
          {
            key: "id",
            label: "Policy ID",
            sortable: true,
            cell: (row) => <span className="font-mono">{row.id}</span>,
          },
          {
            key: "name",
            label: "Name",
            sortable: true,
            cell: (row) => <span className="font-semibold">{row.name}</span>,
          },
          {
            key: "category",
            label: "Category",
            sortable: true,
            cell: (row) => <span className="text-muted-foreground">{row.category}</span>,
          },
          {
            key: "status",
            label: "Status",
            cell: (row) => statusBadge(row.status),
          },
          {
            key: "maxAmount",
            label: "Max Amount",
            cell: (row) => <span className="text-muted-foreground">{row.maxAmount || "—"}</span>,
          },
          {
            key: "friction",
            label: "Friction",
            cell: (row) => <span className="text-muted-foreground">{row.friction}</span>,
          },
          {
            key: "benchmarkScore",
            label: "Benchmark",
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
            key: "endDate",
            label: "End Date",
            sortable: true,
            cell: (row) => <span className="text-muted-foreground">{row.endDate || "—"}</span>,
          },
        ]}
      />

      {/* ---- Detail Panel (slide-out) ---- */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] bg-background border-l border-border shadow-xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${
          selectedPolicy ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedPolicy && (
          <div className="p-sp-24 flex flex-col gap-sp-20">
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

            {/* ---- Draft Activation Card ---- */}
            {selectedPolicy.status === "draft" && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-sp-16">
                <p className="text-sm font-semibold text-warning mb-sp-8">
                  📄 Draft Policy
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This policy was parsed from uploaded documents and is ready for review.
                </p>
                <Button
                  variant="outline"
                  className="mt-sp-12"
                  onClick={() => activatePolicy(selectedPolicy.id)}
                >
                  Activate Policy
                </Button>
              </div>
            )}

            {/* ---- Benchmark Insight Card (generic) ---- */}
            {selectedPolicy.benchmarkWarning && selectedPolicy.status !== "deprecated" && (() => {
              const insight = BENCHMARK_INSIGHTS[selectedPolicy.id];
              if (!insight) return null;
              return (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-sp-16 dark:border-blue-800 dark:bg-blue-950">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-sp-4">
                    💡 Industry Insight
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
                        toast.success(`Limit updated to ${insight.standardAmount}.`);
                      }}
                    >
                      <i className="fa-solid fa-arrow-trend-up" aria-hidden="true" />
                      Update to Standard
                    </Button>
                  )}
                </div>
              );
            })()}

            {/* ---- Conflict Card (POL-2022-12) ---- */}
            {selectedPolicy.id === "POL-2022-12" && selectedPolicy.status === "conflict" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-sp-16 dark:border-red-800 dark:bg-red-950">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-sp-8">
                  ⚠️ Conflict Detected
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed mb-sp-12">
                  This policy allows <strong>€0.23/km</strong>. A newer uploaded document
                  (HR_Memo_2025) states <strong>€0.21/km</strong>. Which should be the active atomic
                  rule?
                </p>
                <div className="flex gap-sp-8">
                  <Button
                    variant="outline"
                    onClick={() => resolveConflict("POL-2022-12", "active")}
                  >
                    Keep €0.23/km
                  </Button>
                  <Button
                    colorScheme="error"
                    onClick={() => resolveConflict("POL-2022-12", "deprecated", "EUR 0.21 per km")}
                  >
                    Apply €0.21/km &amp; Deprecate
                  </Button>
                </div>
              </div>
            )}

            {/* ---- Policy Rules Editor ---- */}
            <section className="pt-sp-8">
              <h3 className="font-semibold text-sm text-foreground mb-sp-12">Policy Rules</h3>
              <div className="flex flex-col gap-sp-12">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-sp-4 block">Intent</label>
                  <Input
                    value={draft.intent}
                    onChange={(e) => setDraft((d) => ({ ...d, intent: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-sp-4 block">Max Amount</label>
                  <Input
                    value={draft.maxAmount}
                    onChange={(e) => setDraft((d) => ({ ...d, maxAmount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-sp-4 block">Allowed Categories</label>
                  <Input static value={selectedPolicy.allowedCategories} readOnly />
                </div>
              </div>
            </section>

            {/* ---- AFAS Mapping ---- */}
            <section className="pt-sp-8">
              <h3 className="font-semibold text-sm text-foreground mb-sp-12">AFAS Mapping</h3>
              <label className="text-xs text-muted-foreground font-semibold mb-sp-4 block">Ledger Account</label>
              <Select
                items={ledgerOptions}
                value={draft.afasCode ? String(draft.afasCode) : undefined}
                placeholder="Select ledger..."
                onValueChange={(val) => setDraft((d) => ({ ...d, afasCode: Number(val) }))}
              />
            </section>

            {/* ---- Lifecycle Management ---- */}
            <section className="pt-sp-8">
              <h3 className="font-semibold text-sm text-foreground mb-sp-12">Lifecycle</h3>
              <div className="grid grid-cols-2 gap-sp-12">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-sp-4 block">Start Date</label>
                  <Input
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold mb-sp-4 block">End Date</label>
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
                Update Policy
              </Button>
              {selectedPolicy.status !== "deprecated" && (
                <Button
                  colorScheme="error"
                  variant="outline"
                  className="mt-sp-16 w-full"
                  onClick={() => deprecatePolicy(selectedPolicy.id)}
                >
                  <i className="fa-solid fa-ban mr-sp-8" aria-hidden="true" />
                  Deprecate Policy
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
