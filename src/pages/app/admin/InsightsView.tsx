import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const questionedPoliciesData = [
  {
    name: "Travel Reimbursement",
    code: "POL-2022-12",
    questions: 45,
    frictionKey: "insights.frictionHigh" as const,
    badgeColor: "error" as const,
  },
  {
    name: "Incontinence Material Standard",
    code: "POL-2024-05",
    questions: 28,
    frictionKey: "insights.frictionModerate" as const,
    badgeColor: "warning" as const,
  },
];

export default function InsightsView() {
  const { t } = useTranslation();
  const [acknowledged, setAcknowledged] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [shadowModalOpen, setShadowModalOpen] = useState(false);
  const [shadowOrderResolved, setShadowOrderResolved] = useState(false);
  const [travelResolved, setTravelResolved] = useState(false);
  const [suggestedText, setSuggestedText] = useState(
    t("insights.suggestedText")
  );

  const kpiCards = [
    {
      icon: "fa-solid fa-bolt",
      label: t("insights.stp"),
      value: t("insights.stpValue"),
      valueColor: "text-green-600",
      subtext: t("insights.stpSubtext"),
    },
    {
      icon: "fa-solid fa-clock",
      label: t("insights.hoursReclaimed"),
      value: t("insights.hoursValue"),
      valueColor: "text-primary",
      subtext: t("insights.hoursSubtext"),
    },
    {
      icon: "fa-solid fa-robot",
      label: t("insights.aiFallbacks"),
      value: t("insights.aiFallbacksValue"),
      valueColor: "text-orange-600",
      subtext: t("insights.aiFallbacksSubtext"),
    },
  ];

  const questionedPolicies = questionedPoliciesData.map((p) =>
    p.code === "POL-2022-12" && travelResolved
      ? { ...p, questions: 0, frictionKey: "insights.frictionResolved" as const, badgeColor: "success" as const }
      : p
  );

  return (
    <div className="space-y-sp-24">
      <PageHeader
        title={t("insights.title")}
        subtitle={t("insights.subtitle")}
        icon="fa-solid fa-chart-line"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-sp-16">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-card border border-border rounded-lg p-sp-24 flex flex-col gap-sp-8"
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

      {/* Friction Heatmap */}
      <div className="grid grid-cols-2 gap-sp-16">
        {/* Left — Most Questioned Policies */}
        <div className="bg-card border border-border rounded-lg p-sp-24 flex flex-col gap-sp-16">
          <div className="flex items-center gap-sp-8 text-text-primary font-semibold text-sm">
            <i className="fa-solid fa-fire text-orange-600" aria-hidden="true" />
            {t("insights.mostQuestioned")}
          </div>

          <div className="flex flex-col gap-sp-12">
            {questionedPolicies.map((policy, idx) => (
              <div
                key={policy.code}
                className="flex items-center justify-between border border-border rounded-md p-sp-16"
              >
                <div className="flex flex-col gap-sp-4">
                  <span className="text-sm font-semibold text-text-primary">
                    {policy.name}{" "}
                    <span className="font-normal text-text-secondary">({policy.code})</span>
                  </span>
                  <span className="text-xs text-text-secondary">
                    {t("insights.questionsThisWeek", { count: policy.questions })}
                  </span>
                </div>
                <div className="flex items-center gap-sp-8">
                  <Badge colorScheme={policy.badgeColor} label={t(policy.frictionKey)} />
                  {idx === 0 && (
                    <Button
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => setReviewModalOpen(true)}
                    >
                      {t("insights.reviewClarify")}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — On-the-Ground Feedback */}
        <div className="bg-card border border-border rounded-lg p-sp-24 flex flex-col gap-sp-16">
          <div className="flex items-center gap-sp-8 text-text-primary font-semibold text-sm">
            <i className="fa-solid fa-comments text-primary" aria-hidden="true" />
            {t("insights.onTheGroundFeedback")}
          </div>

          <div
            className={`border rounded-md p-sp-16 flex flex-col gap-sp-12 transition-opacity ${
              acknowledged ? "border-green-300 bg-green-50/50 opacity-75" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">
                {t("insights.from")} <span className="font-normal text-text-secondary">{t("insights.fromLocation")}</span>
              </span>
              {acknowledged && <Badge colorScheme="success" label={t("insights.acknowledged")} />}
            </div>
            <span className="text-xs text-text-secondary">{t("insights.taggedPolicy")}</span>
            <p className="text-sm text-text-primary italic leading-relaxed">
              {t("insights.feedbackQuote")}
            </p>
            {!acknowledged && (
              <div className="flex items-center gap-sp-8">
                <Button variant="outline" className="text-xs h-8" onClick={() => setAcknowledged(true)}>
                  {t("insights.acknowledge")}
                </Button>
                <Button
                  className="text-xs h-8"
                  onClick={() =>
                    toast.info(t("insights.amendmentCreated"))
                  }
                >
                  {t("insights.draftAmendment")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meaningful Exceptions Queue */}
      {!shadowOrderResolved && (
        <div className="bg-card border border-border rounded-lg p-sp-24 flex flex-col gap-sp-16">
          <div className="flex items-center gap-sp-8 text-text-primary font-semibold text-sm">
            <i className="fa-solid fa-triangle-exclamation text-orange-600" aria-hidden="true" />
            {t("insights.pendingExceptions")}
          </div>

          <div className="flex items-center justify-between border border-border rounded-md p-sp-16">
            <div className="flex items-center gap-sp-12">
              <i className="fa-solid fa-circle-exclamation text-orange-600 text-lg" aria-hidden="true" />
              <div className="flex flex-col gap-sp-4">
                <span className="text-sm font-semibold text-text-primary">{t("insights.shadowOrder")}</span>
                <span className="text-xs text-text-secondary">
                  {t("insights.shadowOrderDesc")}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="text-xs h-8 shrink-0"
              onClick={() => setShadowModalOpen(true)}
            >
              {t("insights.reviewThreeWay")}
            </Button>
          </div>
        </div>
      )}

      {/* Review & Clarify Modal */}
      <Modal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        title={t("insights.clarifyTitle")}
        icon={<i className="fa-solid fa-magnifying-glass-chart" aria-hidden="true" />}
        size="xl"
        body={
          <div className="flex flex-col gap-sp-24">
            {/* AI Analysis */}
            <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-sp-16 flex flex-col gap-sp-8">
              <span className="text-sm font-semibold text-indigo-800">{t("insights.aiConfusionAnalysis")}</span>
              <p className="text-sm text-indigo-700 leading-relaxed">
                {t("insights.aiConfusionText")}
              </p>
            </div>

            {/* Policy Amendment */}
            <div className="flex flex-col gap-sp-16">
              <span className="text-sm font-semibold text-foreground">{t("insights.policyAmendment")}</span>

              <div className="flex flex-col gap-sp-8">
                <label className="text-xs font-semibold text-text-secondary">{t("insights.currentRule")}</label>
                <Input
                  value={t("insights.currentRuleValue")}
                  disabled
                />
              </div>

              <div className="flex flex-col gap-sp-8">
                <label className="text-xs font-semibold text-text-secondary">{t("insights.aiSuggestedAddition")}</label>
                <Textarea
                  value={suggestedText}
                  onChange={(e) => setSuggestedText(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                setReviewModalOpen(false);
                setTravelResolved(true);
                toast.success(t("insights.policyUpdated"));
              }}
            >
              {t("insights.updateAtomicPolicy")}
            </Button>
          </>
        }
      />

      {/* Shadow Order Modal */}
      <Modal
        open={shadowModalOpen}
        onOpenChange={setShadowModalOpen}
        title={t("insights.shadowModalTitle")}
        icon={<i className="fa-solid fa-file-invoice-dollar" aria-hidden="true" />}
        size="2xl"
        body={
          <div className="flex flex-col gap-sp-16">
            {/* Invoice context */}
            <p className="text-sm text-text-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: t("insights.shadowInvoice") }} />

            {/* AI Evidence */}
            <div className="rounded-lg border border-border p-sp-16 flex flex-col gap-sp-12">
              <div className="flex items-center gap-sp-8">
                <span className="inline-flex items-center gap-sp-4 rounded-full bg-green-50 dark:bg-green-900/30 px-sp-8 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                  <i className="fa-solid fa-sparkles text-[10px]" aria-hidden="true" />
                  {t("insights.matchConfidence")}
                </span>
                <span className="text-sm text-text-secondary" dangerouslySetInnerHTML={{ __html: t("insights.linkedTo") }} />
              </div>

              <blockquote className="border-l-2 border-grey-300 dark:border-grey-600 pl-sp-12 py-sp-4">
                <p className="text-sm italic text-text-secondary leading-relaxed">
                  {t("insights.chatQuote")}
                </p>
                <cite className="text-xs text-text-tertiary not-italic mt-sp-4 block">
                  {t("insights.chatLogDate")}
                </cite>
              </blockquote>

              <div className="flex items-center gap-sp-8 pt-sp-8 border-t border-border">
                <i className="fa-solid fa-book text-text-tertiary text-xs" aria-hidden="true" />
                <span className="text-sm text-text-secondary" dangerouslySetInnerHTML={{ __html: t("insights.suggestedCoding") }} />
              </div>
            </div>
          </div>
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setShadowModalOpen(false)}>
              {t("insights.rejectJustification")}
            </Button>
            <Button
              colorScheme="success"
              onClick={() => {
                setShadowModalOpen(false);
                setShadowOrderResolved(true);
                toast.success(t("insights.retroSuccess"));
              }}
            >
              <i className="fa-solid fa-check" aria-hidden="true" />
              {t("insights.retroPO")}
            </Button>
          </>
        }
      />
    </div>
  );
}
