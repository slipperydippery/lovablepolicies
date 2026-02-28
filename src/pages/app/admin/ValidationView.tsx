import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Table, type TableColumn } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────

type PolicyRef = { id: string; label: string; type: "approved" | "exception" };

type ExpenseStatus = "ai-approved" | "manual-review" | "approved" | "rejected";

interface ExpenseItem {
  id: string;
  requester: string;
  team: string;
  region: string;
  item: string;
  vendor: string;
  amount: number;
  status: ExpenseStatus;
  date: string;
  aiNote: string;
  budgetCode: string;
  budgetName: string;
  budgetTotal: number;
  budgetUsed: number;
  policies: PolicyRef[];
}

// ── Mock Data ──────────────────────────────────────────

const initialExpenses: ExpenseItem[] = [
  {
    id: "exp-001",
    requester: "Anouk",
    team: "Team De Veldkeur",
    region: "Achterhoek",
    item: "Umbrella",
    vendor: "Blokker",
    amount: 15.0,
    status: "ai-approved",
    date: "2026-02-18",
    aiNote: "Care worker was caught in the rain with a client. Emergency umbrella purchase (€15) from Blokker. Note: Blokker is not on the approved supplier list.",
    budgetCode: "4350",
    budgetName: "Incidental Budget",
    budgetTotal: 50,
    budgetUsed: 15,
    policies: [
      { id: "POL-2026-041", label: "Emergency Ward Supplies (Max €50 without prior approval)", type: "approved" },
      { id: "POL-2023-088", label: "Preferred Procurement (Out-of-network exception flagged)", type: "exception" },
    ],
  },
  {
    id: "exp-002",
    requester: "Marc",
    team: "Team Zorgzaam",
    region: "Twente",
    item: "First aid refill",
    vendor: "Etos",
    amount: 22.5,
    status: "ai-approved",
    date: "2026-02-17",
    aiNote: "Routine first aid supply restock. Within policy limits.",
    budgetCode: "4350",
    budgetName: "Incidental Budget",
    budgetTotal: 50,
    budgetUsed: 22.5,
    policies: [
      { id: "POL-2026-041", label: "Emergency Ward Supplies (Max €50 without prior approval)", type: "approved" },
    ],
  },
  {
    id: "exp-003",
    requester: "Lisa",
    team: "Team Thuiszorg",
    region: "Veluwe",
    item: "Client transport (taxi)",
    vendor: "Uber",
    amount: 18.75,
    status: "manual-review",
    date: "2026-02-16",
    aiNote: "Transport for client with mobility issues to hospital appointment. Requires manual review per transport policy.",
    budgetCode: "4410",
    budgetName: "Transport Budget",
    budgetTotal: 100,
    budgetUsed: 68.75,
    policies: [
      { id: "POL-2024-012", label: "Client Transport (Manual approval required above €15)", type: "exception" },
    ],
  },
  {
    id: "exp-004",
    requester: "Anouk",
    team: "Team De Veldkeur",
    region: "Achterhoek",
    item: "Coffee supplies",
    vendor: "Albert Heijn",
    amount: 8.2,
    status: "ai-approved",
    date: "2026-02-15",
    aiNote: "Regular coffee supplies for the ward. Recurring approved purchase.",
    budgetCode: "4350",
    budgetName: "Incidental Budget",
    budgetTotal: 50,
    budgetUsed: 8.2,
    policies: [
      { id: "POL-2026-041", label: "Emergency Ward Supplies (Max €50 without prior approval)", type: "approved" },
    ],
  },
];

// ── Status Badge ───────────────────────────────────────

// ── Component ──────────────────────────────────────────

export default function ValidationView() {
  const { t } = useTranslation();

  const statusConfig: Record<ExpenseStatus, { colorScheme: "warning" | "purple" | "success" | "error"; label: string }> = {
    "ai-approved": { colorScheme: "warning", label: t("validation.statusAiApproved") },
    "manual-review": { colorScheme: "purple", label: t("validation.statusManualReview") },
    approved: { colorScheme: "success", label: t("validation.statusApproved") },
    rejected: { colorScheme: "error", label: t("validation.statusRejected") },
  };
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [selected, setSelected] = useState<ExpenseItem | null>(null);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyScope, setPolicyScope] = useState<"team" | "company">("team");

  // ── Actions ──

  const handleApprove = () => {
    if (!selected) return;
    setExpenses((prev) => prev.map((e) => (e.id === selected.id ? { ...e, status: "approved" as const } : e)));
    toast.success(t("validation.expenseApproved", { amount: selected.amount.toFixed(2) }));
    setSelected(null);
  };

  const handleReject = () => {
    if (!selected) return;
    setExpenses((prev) => prev.map((e) => (e.id === selected.id ? { ...e, status: "rejected" as const } : e)));
    toast.error(t("validation.expenseRejected", { name: selected.requester }));
    setSelected(null);
  };

  const handleSavePolicy = () => {
    const scopeLabel = policyScope === "team" ? t("validation.scopeTeam") : t("validation.scopeCompany");
    toast.success(t("validation.policySaved", { scope: scopeLabel }));
    setPolicyModalOpen(false);
  };

  // ── Table Columns ──

  const columns: TableColumn<ExpenseItem>[] = [
    {
      key: "requester",
      label: t("validation.colRequester"),
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.requester}</span>
          <span className="text-[11px] text-muted-foreground">{row.team}</span>
        </div>
      ),
    },
    { key: "item", label: t("validation.colItem"), sortable: true },
    {
      key: "amount",
      label: t("validation.colAmount"),
      sortable: true,
      align: "right",
      cell: (row) => <span className="font-medium">€{row.amount.toFixed(2)}</span>,
    },
    { key: "vendor", label: t("validation.colVendor"), sortable: true },
    {
      key: "status",
      label: t("validation.colStatus"),
      cell: (row) => {
        const cfg = statusConfig[row.status];
        return <Badge colorScheme={cfg.colorScheme} status label={cfg.label} />;
      },
    },
    { key: "date", label: t("validation.colDate"), sortable: true },
    {
      key: "actions",
      width: "100px",
      cell: (row) => (
        <Button variant="outline" colorScheme="primary" className="text-xs h-7 px-sp-12" onClick={() => setSelected(row)}>
          {t("common.review")}
        </Button>
      ),
    },
  ];

  // ── Render ──

  return (
    <div className="space-y-sp-24">
      <PageHeader title={t("validation.title")} subtitle={t("validation.subtitle")} icon="fa-solid fa-clipboard-check" />

      <Table data={expenses} columns={columns} rowKey="id" />

      {/* ── Detail Slide-Over Panel ── */}
      <DialogPrimitive.Root open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-background shadow-xl border-l border-input flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right duration-300">
            {selected && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-sp-24 py-sp-16 border-b border-input bg-muted">
                  <div>
                    <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
                      {t("validation.expenseReview", { name: selected.requester })}
                    </DialogPrimitive.Title>
                    <p className="text-xs text-muted-foreground mt-sp-4">
                      {selected.team} · {selected.region} · {t("validation.submitted", { date: selected.date })}
                    </p>
                  </div>
                  <DialogPrimitive.Close asChild>
                    <Button variant="ghost" square>
                      <i className="fa-solid fa-xmark" />
                    </Button>
                  </DialogPrimitive.Close>
                </div>

                {/* Body — two columns */}
                <div className="flex-1 overflow-y-auto px-sp-24 py-sp-24">
                  <div className="grid grid-cols-2 gap-sp-24">
                    {/* Left: The Expense */}
                    <div className="space-y-sp-16">
                      {/* Receipt placeholder */}
                      <div className="aspect-[4/3] rounded-lg bg-grey-100 border border-input flex flex-col items-center justify-center text-muted-foreground">
                        <i className="fa-solid fa-camera text-2xl mb-sp-8" />
                        <span className="text-xs">{t("validation.receiptImage")}</span>
                      </div>

                      {/* Amount */}
                      <div className="text-center">
                        <span className="text-3xl font-bold text-foreground">€{selected.amount.toFixed(2)}</span>
                        <p className="text-xs text-muted-foreground mt-sp-4">{selected.item} · {selected.vendor}</p>
                      </div>

                      {/* AI Justification */}
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-sp-16">
                        <div className="flex items-center gap-sp-8 mb-sp-8">
                          <i className="fa-solid fa-robot text-sm text-blue-500" />
                          <span className="text-xs font-semibold text-blue-600">{t("validation.aiNote")}</span>
                        </div>
                        <p className="text-sm text-blue-700">{selected.aiNote}</p>
                      </div>
                    </div>

                    {/* Right: Policy & AFAS Engine */}
                    <div className="space-y-sp-16">
                      {/* AFAS Budget Impact */}
                      <div className="rounded-lg border border-input bg-surface p-sp-16">
                        <h3 className="text-sm font-semibold text-foreground mb-sp-4">{t("validation.afasBudgetImpact")}</h3>
                        <p className="text-xs text-muted-foreground mb-sp-12">
                          {selected.budgetName} ({t("validation.ledger", { code: selected.budgetCode })}) — {selected.team}
                        </p>
                        <Progress value={selected.budgetUsed} max={selected.budgetTotal} colorScheme="primary" />
                        <div className="flex justify-between mt-sp-8 text-xs text-muted-foreground">
                          <span>{t("validation.used", { amount: selected.budgetUsed.toFixed(2) })}</span>
                          <span>{t("validation.remaining", { amount: (selected.budgetTotal - selected.budgetUsed).toFixed(2) })}</span>
                        </div>
                      </div>

                      {/* Atomic Policies */}
                      <div className="space-y-sp-8">
                        <h3 className="text-sm font-semibold text-foreground">{t("validation.appliedPolicies")}</h3>
                        {selected.policies.map((pol) => (
                          <div
                            key={pol.id}
                            className={cn(
                              "rounded-lg p-sp-12 text-xs border-l-[3px]",
                              pol.type === "approved"
                                ? "border-l-green-500 bg-green-50 text-green-700"
                                : "border-l-orange-500 bg-orange-50 text-orange-700"
                            )}
                          >
                            <div className="flex items-start gap-sp-8">
                              <i
                                className={cn(
                                  "mt-0.5",
                                  pol.type === "approved"
                                    ? "fa-solid fa-circle-check text-green-500"
                                    : "fa-solid fa-triangle-exclamation text-orange-500"
                                )}
                              />
                              <span>
                                <span className="font-semibold">{pol.id}:</span> {pol.label}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between px-sp-24 py-sp-16 border-t border-input bg-muted">
                  <Button variant="outline" colorScheme="primary" onClick={() => setPolicyModalOpen(true)}>
                    <i className="fa-solid fa-sliders" />
                    {t("validation.adjustPolicy")}
                  </Button>
                  <div className="flex items-center gap-sp-8">
                    <Button variant="solid" colorScheme="error" onClick={handleReject}>
                      <i className="fa-solid fa-xmark" />
                      {t("common.reject")}
                    </Button>
                    <Button variant="solid" colorScheme="success" onClick={handleApprove}>
                      <i className="fa-solid fa-check" />
                      {t("common.approve")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* ── Adjust Policy Modal ── */}
      <Modal
        open={policyModalOpen}
        onOpenChange={setPolicyModalOpen}
        title={t("validation.adjustPolicyTitle")}
        size="md"
        body={
          <div className="space-y-sp-16">
            <p className="text-sm text-muted-foreground">
              {t("validation.preferredProcurement")}
            </p>
            <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: t("validation.addVendorQuestion") }} />
            <div className="space-y-sp-12 pt-sp-8">
              <Switch
                checked={policyScope === "team"}
                onCheckedChange={(checked) => setPolicyScope(checked ? "team" : "company")}
                label={t("validation.applyTeamOnly")}
                description={t("validation.applyTeamDesc")}
              />
              <Switch
                checked={policyScope === "company"}
                onCheckedChange={(checked) => setPolicyScope(checked ? "company" : "team")}
                label={t("validation.applyCompanyWide")}
                description={t("validation.applyCompanyDesc")}
              />
            </div>
          </div>
        }
        footer={
          <>
            <Button variant="outline" colorScheme="primary" onClick={() => setPolicyModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="solid" colorScheme="primary" onClick={handleSavePolicy}>
              {t("validation.savePolicyChange")}
            </Button>
          </>
        }
      />
    </div>
  );
}
