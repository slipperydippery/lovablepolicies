import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { useActiveLocation } from "@/contexts/ActiveLocationContext";
import { mockLocations, mockLedger } from "@/data";
import { toast } from "@/hooks/use-toast";

const fmt = (n: number) => `€ ${n.toLocaleString("nl-NL")}`;

function getProgressColor(pct: number): "success" | "warning" | "error" {
  if (pct <= 70) return "success";
  if (pct <= 90) return "warning";
  return pct > 100 ? "error" : "warning";
}


// Monthly spent overrides for specific sub-ledger codes
const monthlySpentOverrides: Record<number, number> = {
  4340: 52083, // Recreation: monthly spent = 52083 → 125% of monthly budget (41667)
};

export default function BudgetView() {
  const { t } = useTranslation();
  const { activeLocation, setActiveLocation } = useActiveLocation();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["cat-001"]));
  const [period, setPeriod] = useState("month");
  const [interventionOpen, setInterventionOpen] = useState(false);
  const [optionA, setOptionA] = useState(false);
  const [optionB, setOptionB] = useState(false);

  const periodItems = [
    { value: "month", label: t("budget.periodMonth") },
    { value: "ytd", label: t("budget.periodYtd") },
    { value: "yearly", label: t("budget.periodYearly") },
  ];

  const isMonthly = period === "month";

  const locationItems = mockLocations.map((l) => ({
    value: l.id,
    label: `${l.name} (${l.city} - ${l.sector})`,
  }));

  const totalSpent = useMemo(
    () => mockLedger.reduce((sum, cat) => sum + cat.subLedgers.reduce((s, sl) => s + sl.spent, 0), 0),
    []
  );
  const remaining = activeLocation.annualBudget - totalSpent;

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleApplyIntervention = () => {
    setInterventionOpen(false);
    setOptionA(false);
    setOptionB(false);
    toast.success(t("budget.policyUpdated"));
  };

  // Monthly helpers
  const getMonthlyBudget = (annual: number) => Math.round(annual / 12);
  const getMonthlySpent = (sl: { code: number; spent: number }) => {
    if (sl.code in monthlySpentOverrides) return monthlySpentOverrides[sl.code];
    return Math.round(sl.spent / 12 * (1 + (Math.random() * 0.1 - 0.05))); // slight variance for realism
  };

  return (
    <div className="space-y-sp-24">
      {/* ---- Header ---- */}
      <PageHeader
        title={t("budget.title")}
        subtitle={t("budget.subtitle")}
        icon="fa-solid fa-coins"
      />

      {/* Selectors row */}
      <div className="flex gap-sp-16">
        <div className="flex-1 max-w-md">
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-sp-4">
            {t("budget.location")}
          </label>
          <Select
            items={locationItems}
            value={activeLocation.id}
            onValueChange={setActiveLocation}
            placeholder={t("budget.selectLocation")}
          />
        </div>
        <div className="w-72">
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-sp-4">
            {t("budget.period")}
          </label>
          <Select
            items={periodItems}
            value={period}
            onValueChange={setPeriod}
          />
        </div>
      </div>

      {/* KPI Cards */}
      {isMonthly ? (
        <div className="grid grid-cols-3 gap-sp-16">
          {[
            {
              icon: "fa-solid fa-wallet",
              label: t("budget.monthlyBudget"),
              value: "€ 166.666",
              valueColor: "text-primary",
              subtext: t("budget.monthlyBudgetSubtext"),
            },
            {
              icon: "fa-solid fa-receipt",
              label: t("budget.spentApril"),
              value: "€ 180.000",
              valueColor: "text-orange-600",
              subtext: t("budget.spentAprilSubtext"),
            },
            {
              icon: "fa-solid fa-triangle-exclamation",
              label: t("budget.forecastRunRate"),
              value: t("budget.forecastValue"),
              valueColor: "text-error",
              subtext: t("budget.forecastSubtext"),
              alert: true,
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`border rounded-lg p-sp-24 flex flex-col gap-sp-8 ${
                (card as any).alert
                  ? "bg-red-50/50 border-red-100"
                  : "bg-card border-border"
              }`}
            >
              <div className="flex items-center gap-sp-8 text-text-secondary text-xs font-semibold uppercase tracking-wide">
                <i className={`${card.icon} text-sm`} aria-hidden="true" />
                {card.label}
              </div>
              <span className={`text-3xl font-heading font-medium ${card.valueColor}`}>
                {card.value}
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">{card.subtext}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-sp-16">
          {[
            { icon: "fa-solid fa-wallet", label: t("budget.totalAnnualBudget"), value: activeLocation.annualBudget, valueColor: "text-primary", subtext: t("budget.totalAnnualSubtext") },
            { icon: "fa-solid fa-receipt", label: t("budget.totalSpent"), value: totalSpent, valueColor: "text-orange-600", subtext: t("budget.totalSpentSubtext") },
            { icon: "fa-solid fa-piggy-bank", label: t("budget.remainingLabel"), value: remaining, valueColor: remaining >= 0 ? "text-green-600" : "text-error", subtext: t("budget.remainingSubtext") },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-card border border-border rounded-lg p-sp-24 flex flex-col gap-sp-8"
            >
              <div className="flex items-center gap-sp-8 text-text-secondary text-xs font-semibold uppercase tracking-wide">
                <i className={`${kpi.icon} text-sm`} aria-hidden="true" />
                {kpi.label}
              </div>
              <span className={`text-3xl font-heading font-medium ${kpi.valueColor}`}>
                {fmt(kpi.value)}
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">{kpi.subtext}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ledger Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Header */}
        {isMonthly ? (
          <div className="grid grid-cols-[1fr_150px_150px_180px_140px] bg-muted px-sp-16 py-sp-8 text-xs font-semibold text-muted-foreground uppercase">
            <span>{t("budget.colLedgerAccount")}</span>
            <span className="text-right">{t("budget.colMonthlyBudget")}</span>
            <span className="text-right">{t("budget.colSpentApril")}</span>
            <span className="text-right pr-sp-8">{t("budget.colPacing")}</span>
            <span className="text-right">{t("budget.colAction")}</span>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_150px_150px_150px_180px] bg-muted px-sp-16 py-sp-8 text-xs font-semibold text-muted-foreground uppercase">
            <span>{t("budget.colLedgerAccount")}</span>
            <span className="text-right">{t("budget.colAllocated")}</span>
            <span className="text-right">{t("budget.colSpent")}</span>
            <span className="text-right">{t("budget.colRemaining")}</span>
            <span className="text-right pr-sp-8">{t("budget.colUtilization")}</span>
          </div>
        )}

        {mockLedger.map((cat) => {
          const isOpen = expanded.has(cat.id);

          if (isMonthly) {
            const catMonthBudget = cat.subLedgers.reduce((s, sl) => s + getMonthlyBudget(sl.budget), 0);
            const catMonthSpent = cat.subLedgers.reduce((s, sl) => s + getMonthlySpent(sl), 0);
            const catPct = Math.round((catMonthSpent / catMonthBudget) * 100);

            return (
              <div key={cat.id}>
                <div
                  className="grid grid-cols-[1fr_150px_150px_180px_140px] px-sp-16 py-sp-12 bg-surface font-semibold cursor-pointer hover:bg-grey-100 border-t border-border items-center"
                  onClick={() => toggle(cat.id)}
                >
                  <span className="flex items-center gap-sp-8 text-sm text-foreground">
                    <i className={`fa-solid fa-chevron-right text-xs text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} aria-hidden="true" />
                    {cat.name}
                  </span>
                  <span className="text-right font-mono text-sm text-foreground">{fmt(catMonthBudget)}</span>
                  <span className="text-right font-mono text-sm text-foreground">{fmt(catMonthSpent)}</span>
                  <div className="flex items-center gap-sp-8 justify-end">
                    <div className="w-20 relative">
                      <Progress value={Math.min(catPct, 100)} colorScheme={getProgressColor(catPct)} />
                      <div className="absolute top-0 bottom-0 left-full w-px bg-foreground/30" style={{ left: '100%' }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{catPct}%</span>
                  </div>
                  <div className="flex items-center justify-end">
                    {cat.subLedgers.some((sl) => {
                      const mb = getMonthlyBudget(sl.budget);
                      const ms = getMonthlySpent(sl);
                      return Math.round((ms / mb) * 100) > 100;
                    }) && (
                      <Tooltip text={t("budget.overrunTooltip")} side="left">
                        <span>
                          <Badge colorScheme="error" label={t("budget.overrun", { count: cat.subLedgers.filter((sl) => { const mb = getMonthlyBudget(sl.budget); const ms = getMonthlySpent(sl); return Math.round((ms / mb) * 100) > 100; }).length })} />
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {isOpen && cat.subLedgers.map((sl, idx) => {
                  const slMonthBudget = getMonthlyBudget(sl.budget);
                  const slMonthSpent = getMonthlySpent(sl);
                  const slPct = Math.round((slMonthSpent / slMonthBudget) * 100);
                  const isRecreation = sl.code === 4340;
                  const isOverBudget = slPct > 100;

                  return (
                    <div
                      key={sl.id}
                      className={`grid grid-cols-[1fr_150px_150px_180px_140px] px-sp-16 py-sp-8 pl-sp-32 border-t border-border items-center ${
                        isOverBudget
                          ? "bg-red-50"
                          : idx % 2 === 0
                            ? "bg-card"
                            : "bg-muted/40"
                      }`}
                    >
                      <span className="flex items-center gap-sp-8 text-sm text-foreground">
                        <span className="text-muted-foreground font-mono text-xs w-10">{sl.code}</span>
                        {sl.name}
                        {isRecreation && (
                          <Tooltip
                            text={`Recently charged: €15.00 – Umbrella Blokker (Anouk, via AI Chat)\nLinked Policy: POL-2026-041`}
                            side="right"
                          >
                            <span>
                              <Badge colorScheme="primary" label="New" className="ml-sp-4 cursor-help" />
                            </span>
                          </Tooltip>
                        )}
                      </span>
                      <span className="text-right font-mono text-sm text-foreground">{fmt(slMonthBudget)}</span>
                      <span className="text-right font-mono text-sm text-foreground">{fmt(slMonthSpent)}</span>
                      <div className="flex items-center gap-sp-8 justify-end">
                        <div className="w-20 relative">
                          <Progress value={Math.min(slPct, 100)} colorScheme={getProgressColor(slPct)} />
                          <div className="absolute top-0 bottom-0 w-px bg-foreground/30" style={{ left: '100%' }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">{slPct}%</span>
                      </div>
                      <div className="text-right">
                        {isRecreation && (
                          <Button
                            variant="ghost"
                            className="text-xs h-7 text-error hover:text-error hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInterventionOpen(true);
                            }}
                          >
                            <i className="fa-solid fa-gavel mr-sp-4" aria-hidden="true" />
                            {t("budget.intervene")}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          // Yearly / YTD view (existing)
          const catSpent = cat.subLedgers.reduce((s, sl) => s + sl.spent, 0);
          const catBudget = cat.subLedgers.reduce((s, sl) => s + sl.budget, 0);
          const catRemaining = catBudget - catSpent;
          const catPct = Math.round((catSpent / catBudget) * 100);

          return (
            <div key={cat.id}>
              <div
                className="grid grid-cols-[1fr_150px_150px_150px_180px] px-sp-16 py-sp-12 bg-surface font-semibold cursor-pointer hover:bg-grey-100 border-t border-border items-center"
                onClick={() => toggle(cat.id)}
              >
                <span className="flex items-center gap-sp-8 text-sm text-foreground">
                  <i className={`fa-solid fa-chevron-right text-xs text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} aria-hidden="true" />
                  {cat.name}
                </span>
                <span className="text-right font-mono text-sm text-foreground">{fmt(catBudget)}</span>
                <span className="text-right font-mono text-sm text-foreground">{fmt(catSpent)}</span>
                <span className="text-right font-mono text-sm text-foreground">{fmt(catRemaining)}</span>
                <div className="flex items-center gap-sp-8 justify-end">
                  <div className="w-20">
                    <Progress value={catPct} colorScheme={getProgressColor(catPct)} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{catPct}%</span>
                </div>
              </div>

              {isOpen && cat.subLedgers.map((sl, idx) => {
                const slRemaining = sl.budget - sl.spent;
                const slPct = Math.round((sl.spent / sl.budget) * 100);
                const isRecreation = sl.code === 4340;
                const isOverBudget = slPct > 100;

                return (
                  <div
                    key={sl.id}
                    className={`grid grid-cols-[1fr_150px_150px_150px_180px] px-sp-16 py-sp-8 pl-sp-32 border-t border-border items-center ${
                      isOverBudget
                        ? "bg-red-50"
                        : idx % 2 === 0
                          ? "bg-card"
                          : "bg-muted/40"
                    }`}
                  >
                    <span className="flex items-center gap-sp-8 text-sm text-foreground">
                      <span className="text-muted-foreground font-mono text-xs w-10">{sl.code}</span>
                      {sl.name}
                      {isRecreation && (
                        <Tooltip
                          text={`Recently charged: €15.00 – Umbrella Blokker (Anouk, via AI Chat)\nLinked Policy: POL-2026-041`}
                          side="right"
                        >
                          <span>
                            <Badge colorScheme="primary" label="New" className="ml-sp-4 cursor-help" />
                          </span>
                        </Tooltip>
                      )}
                    </span>
                    <span className="text-right font-mono text-sm text-foreground">{fmt(sl.budget)}</span>
                    <span className="text-right font-mono text-sm text-foreground">{fmt(sl.spent)}</span>
                    <span className="text-right font-mono text-sm text-foreground">{fmt(slRemaining)}</span>
                    <div className="flex items-center gap-sp-8 justify-end">
                      <div className="w-20">
                        <Progress value={slPct} colorScheme={getProgressColor(slPct)} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{slPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Policy Intervention Modal */}
      <Modal
        open={interventionOpen}
        onOpenChange={setInterventionOpen}
        size="lg"
        title={t("budget.interventionTitle")}
        icon={<i className="fa-solid fa-triangle-exclamation text-error" aria-hidden="true" />}
        body={
          <div className="space-y-sp-24">
            {/* AI Analysis */}
            <div className="bg-info/10 border border-info/30 rounded-lg p-sp-16">
              <div className="flex items-start gap-sp-12">
                <i className="fa-solid fa-robot text-info mt-0.5" aria-hidden="true" />
                <div className="text-sm text-foreground">
                  <p className="font-semibold mb-sp-4">{t("budget.aiAnalysis")}</p>
                  <p dangerouslySetInnerHTML={{ __html: t("budget.aiAnalysisText") }} />
                </div>
              </div>
            </div>

            {/* Option A */}
            <div className="border border-border rounded-lg p-sp-16">
              <div className="flex items-start justify-between gap-sp-16">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-sp-4">{t("budget.optionATitle")}</p>
                  <p className="text-sm text-muted-foreground">{t("budget.optionADesc")}</p>
                </div>
                <Switch checked={optionA} onCheckedChange={setOptionA} />
              </div>
            </div>

            {/* Option B */}
            <div className="border border-border rounded-lg p-sp-16">
              <div className="flex items-start justify-between gap-sp-16">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-sp-4">{t("budget.optionBTitle")}</p>
                  <p className="text-sm text-muted-foreground">{t("budget.optionBDesc")}</p>
                </div>
                <Switch checked={optionB} onCheckedChange={setOptionB} />
              </div>
            </div>
          </div>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setInterventionOpen(false)}>{t("common.cancel")}</Button>
            <Button
              variant="solid"
              colorScheme="primary"
              disabled={!optionA && !optionB}
              onClick={handleApplyIntervention}
            >
              {t("budget.applyPolicyChange")}
            </Button>
          </>
        }
      />
    </div>
  );
}
