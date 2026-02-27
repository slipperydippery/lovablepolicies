import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const PROCESSING_STEPS = [
  "Reading documents...",
  "Extracting purchasing rules...",
  "Mapping to AFAS ledgers...",
  "Detecting conflicts...",
];

const kpiCards = [
  {
    icon: "fa-solid fa-bolt",
    label: "Straight-Through Processing (STP)",
    value: "88%",
    valueColor: "text-green-600",
    subtext: "Purchases auto-approved & AFAS-coded via AI this month.",
  },
  {
    icon: "fa-solid fa-clock",
    label: "Finance Hours Reclaimed",
    value: "42 Hours",
    valueColor: "text-primary",
    subtext: "Saved by eliminating manual ledger coding and follow-ups.",
  },
  {
    icon: "fa-solid fa-robot",
    label: "AI Fallbacks",
    value: "12 Instances",
    valueColor: "text-orange-600",
    subtext: "Queries where AI could not find a relevant policy. (Requires Review)",
  },
];

const questionedPoliciesData = [
  {
    name: "Travel Reimbursement",
    code: "POL-2022-12",
    questions: 45,
    friction: "High Friction" as const,
    badgeColor: "error" as const,
  },
  {
    name: "Incontinence Material Standard",
    code: "POL-2024-05",
    questions: 28,
    friction: "Moderate Friction" as const,
    badgeColor: "warning" as const,
  },
];

export default function InsightsView() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [shadowModalOpen, setShadowModalOpen] = useState(false);
  const [shadowOrderResolved, setShadowOrderResolved] = useState(false);
  const [travelResolved, setTravelResolved] = useState(false);
  const [suggestedText, setSuggestedText] = useState(
    "Parking fees incurred during direct client transport (e.g., hospital visits) are fully reimbursable. A receipt is required."
  );

  const questionedPolicies = questionedPoliciesData.map((p) =>
    p.code === "POL-2022-12" && travelResolved
      ? { ...p, questions: 0, friction: "Resolved" as const, badgeColor: "success" as const }
      : p
  );

  return (
    <div className="space-y-sp-24">
      <PageHeader
        title="Policy Health & Insights"
        subtitle="Proactive command center for monitoring policy effectiveness, friction points, and meaningful exceptions."
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
            Most Questioned Policies
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
                    {policy.questions} questions this week
                  </span>
                </div>
                <div className="flex items-center gap-sp-8">
                  <Badge colorScheme={policy.badgeColor} label={policy.friction} />
                  {idx === 0 && (
                    <Button
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => setReviewModalOpen(true)}
                    >
                      Review & Clarify Policy
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
            On-the-Ground Feedback
          </div>

          <div
            className={`border rounded-md p-sp-16 flex flex-col gap-sp-12 transition-opacity ${
              acknowledged ? "border-green-300 bg-green-50/50 opacity-75" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">
                From: Anouk <span className="font-normal text-text-secondary">(De Veldkeur)</span>
              </span>
              {acknowledged && <Badge colorScheme="success" label="Acknowledged" />}
            </div>
            <span className="text-xs text-text-secondary">Tagged Policy: POL-2023-088</span>
            <p className="text-sm text-text-primary italic leading-relaxed">
              "The standard supplier is always out of stock on weekends, forcing us to use
              exceptions to buy at Blokker."
            </p>
            {!acknowledged && (
              <div className="flex items-center gap-sp-8">
                <Button variant="outline" className="text-xs h-8" onClick={() => setAcknowledged(true)}>
                  Acknowledge
                </Button>
                <Button
                  className="text-xs h-8"
                  onClick={() =>
                    toast.info("A policy amendment draft for POL-2023-088 has been created.")
                  }
                >
                  Draft Policy Amendment
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
            Pending Meaningful Exceptions (Action Required)
          </div>

          <div className="flex items-center justify-between border border-border rounded-md p-sp-16">
            <div className="flex items-center gap-sp-12">
              <i className="fa-solid fa-circle-exclamation text-orange-600 text-lg" aria-hidden="true" />
              <div className="flex flex-col gap-sp-4">
                <span className="text-sm font-semibold text-text-primary">Shadow Order Detected</span>
                <span className="text-xs text-text-secondary">
                  Unregistered supplier used by Team Veldkeur for €200 medical device. Reason: Resident
                  safety.
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="text-xs h-8 shrink-0"
              onClick={() => setShadowModalOpen(true)}
            >
              Review 3-Way Match Failure
            </Button>
          </div>
        </div>
      )}

      {/* Review & Clarify Modal */}
      <Modal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        title="Clarify Policy: Travel Reimbursement (POL-2022-12)"
        icon={<i className="fa-solid fa-magnifying-glass-chart" aria-hidden="true" />}
        size="xl"
        body={
          <div className="flex flex-col gap-sp-24">
            {/* AI Analysis */}
            <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-sp-16 flex flex-col gap-sp-8">
              <span className="text-sm font-semibold text-indigo-800">✨ AI Confusion Analysis</span>
              <p className="text-sm text-indigo-700 leading-relaxed">
                Based on 45 chat queries this week, 78% of care workers are asking if hospital parking fees
                are reimbursed when transporting a client, or if they are included in the €0.21/km flat rate.
              </p>
            </div>

            {/* Policy Amendment */}
            <div className="flex flex-col gap-sp-16">
              <span className="text-sm font-semibold text-foreground">Policy Amendment</span>

              <div className="flex flex-col gap-sp-8">
                <label className="text-xs font-semibold text-text-secondary">Current Rule</label>
                <Input
                  value="Travel is reimbursed at €0.21/km. Commuting is excluded."
                  disabled
                />
              </div>

              <div className="flex flex-col gap-sp-8">
                <label className="text-xs font-semibold text-text-secondary">AI Suggested Addition</label>
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
              Cancel
            </Button>
            <Button
              onClick={() => {
                setReviewModalOpen(false);
                setTravelResolved(true);
                toast.success("Policy Updated. Care workers will now be automatically guided on parking fees.");
              }}
            >
              Update Atomic Policy
            </Button>
          </>
        }
      />

      {/* Shadow Order Modal */}
      <Modal
        open={shadowModalOpen}
        onOpenChange={setShadowModalOpen}
        title="Resolve Shadow Order: Unregistered Supplier"
        icon={<i className="fa-solid fa-file-invoice-dollar" aria-hidden="true" />}
        size="2xl"
        body={
          <div className="flex flex-col gap-sp-16">
            {/* Invoice context */}
            <p className="text-sm text-text-secondary leading-relaxed">
              An invoice from <span className="font-medium text-text-primary">Medipoint Lokaal</span> (unregistered) for a Specialized Shower Chair at €200.00 has no matching PO or goods receipt in AFAS.
            </p>

            {/* AI Evidence */}
            <div className="rounded-lg border border-border p-sp-16 flex flex-col gap-sp-12">
              <div className="flex items-center gap-sp-8">
                <span className="inline-flex items-center gap-sp-4 rounded-full bg-green-50 dark:bg-green-900/30 px-sp-8 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                  <i className="fa-solid fa-sparkles text-[10px]" aria-hidden="true" />
                  98% Match
                </span>
                <span className="text-sm text-text-secondary">
                  Linked to <span className="font-medium text-text-primary">Anouk</span> at De VeldKeur
                </span>
              </div>

              <blockquote className="border-l-2 border-grey-300 dark:border-grey-600 pl-sp-12 py-sp-4">
                <p className="text-sm italic text-text-secondary leading-relaxed">
                  "Kersten Hulpmiddelen has a 2-week delay. Resident is being discharged today.
                  I am buying the chair locally to ensure patient safety."
                </p>
                <cite className="text-xs text-text-tertiary not-italic mt-sp-4 block">
                  — Chat log, Tuesday
                </cite>
              </blockquote>

              <div className="flex items-center gap-sp-8 pt-sp-8 border-t border-border">
                <i className="fa-solid fa-book text-text-tertiary text-xs" aria-hidden="true" />
                <span className="text-sm text-text-secondary">
                  Suggested coding: <span className="font-medium text-text-primary">3. CARE & TREATMENT → Medical Aids</span>
                </span>
              </div>
            </div>
          </div>
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setShadowModalOpen(false)}>
              Reject & Request Justification
            </Button>
            <Button
              colorScheme="success"
              onClick={() => {
                setShadowModalOpen(false);
                setShadowOrderResolved(true);
                toast.success("Retrospective PO created. Coded to Medical Aids. Invoice cleared for payment.");
              }}
            >
              <i className="fa-solid fa-check" aria-hidden="true" />
              Retroactively Create PO & Approve
            </Button>
          </>
        }
      />
    </div>
  );
}
