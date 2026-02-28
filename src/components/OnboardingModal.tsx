import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/modal";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  READY_POLICIES,
  CONFLICT_POLICIES,
  upsertPolicies,
} from "@/data/onboarding-policies";

type Phase = "upload" | "processing" | "results";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated: () => void;
}

export default function OnboardingModal({ open, onOpenChange, onActivated }: OnboardingModalProps) {
  const { t } = useTranslation();

  const PROCESSING_STEPS = [
    t("onboarding.readingDocs"),
    t("onboarding.extractingRules"),
    t("onboarding.mappingAfas"),
    t("onboarding.detectingConflicts"),
  ];

  const [phase, setPhase] = useState<Phase>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [processingStep, setProcessingStep] = useState(0);
  const [resolvedConflicts, setResolvedConflicts] = useState<Record<string, number | null>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [activating, setActivating] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPhase("upload");
      setFiles([]);
      setProcessingStep(0);
      setResolvedConflicts({});
      setCustomValues({});
    }
  }, [open]);

  // Processing animation
  useEffect(() => {
    if (phase !== "processing") return;
    setProcessingStep(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < PROCESSING_STEPS.length) {
        setProcessingStep(i);
      } else {
        clearInterval(interval);
        setPhase("results");
      }
    }, 800);
    return () => clearInterval(interval);
  }, [phase]);

  const handleProcess = () => {
    setResolvedConflicts({});
    setCustomValues({});
    setPhase("processing");
  };

  const handleQuickPick = (policyId: string, val: number) => {
    setResolvedConflicts((prev) => ({ ...prev, [policyId]: val }));
    setCustomValues((prev) => ({ ...prev, [policyId]: "" }));
  };

  const handleCustomSubmit = (policyId: string) => {
    const num = parseFloat(customValues[policyId] || "");
    if (!isNaN(num) && num > 0) {
      setResolvedConflicts((prev) => ({ ...prev, [policyId]: num }));
    }
  };

  const allConflictsResolved = CONFLICT_POLICIES.every(
    (p) => resolvedConflicts[p.id] != null
  );

  const handleActivate = async () => {
    setActivating(true);
    try {
      const resolved = Object.fromEntries(
        Object.entries(resolvedConflicts).filter(([, v]) => v != null)
      ) as Record<string, number>;
      const count = await upsertPolicies(READY_POLICIES, CONFLICT_POLICIES, resolved);
      toast.success(t("onboarding.activated", { count }));
      onOpenChange(false);
      onActivated();
    } catch {
      toast.error(t("onboarding.activateFailed"));
    } finally {
      setActivating(false);
    }
  };

  // ─── Upload Phase ───
  const uploadContent = (
    <div className="space-y-sp-16">
      <FileUpload
        value={files}
        onChange={(f) => setFiles(f ? (Array.isArray(f) ? f : [f]) : [])}
        multiple
        accept=".pdf,.txt"
        filesLayout="list"
        description={t("onboarding.uploadDesc")}
      />
      <Button
        variant="solid"
        colorScheme="primary"
        className="w-full"
        disabled={files.length === 0}
        onClick={handleProcess}
      >
        <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
        {t("onboarding.processGenerate")}
      </Button>
    </div>
  );

  // ─── Processing Phase ───
  const processingContent = (
    <div className="flex flex-col items-center gap-sp-24 py-sp-16">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50">
        <i className="fa-solid fa-brain text-2xl text-primary" aria-hidden="true" />
      </div>
      <div className="w-full">
        <Progress indeterminate colorScheme="primary" />
      </div>
      <p className="text-sm font-medium text-foreground animate-pulse">
        {PROCESSING_STEPS[processingStep]}
      </p>
      <p className="text-xs text-muted-foreground">
        {t("onboarding.analyzing", { count: files.length })}
      </p>
    </div>
  );

  // ─── Results Phase ───
  const resultsContent = (
    <div className="space-y-sp-16 max-h-[60vh] overflow-y-auto">
      {/* Section: Conflicts */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {t("onboarding.conflictsToResolve", { count: CONFLICT_POLICIES.length })}
      </p>

      {CONFLICT_POLICIES.map((p) => {
        const resolved = resolvedConflicts[p.id] != null;
        const resolvedVal = resolvedConflicts[p.id];
        return (
          <div
            key={p.id}
            className={`rounded-lg border bg-white dark:bg-grey-900 p-sp-16 border-l-4 transition-colors ${
              resolved
                ? "border-grey-200 dark:border-grey-700 border-l-success"
                : "border-orange-200 dark:border-orange-800 border-l-warning"
            }`}
          >
            <div className="flex items-start gap-sp-12">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                  resolved ? "bg-green-50" : "bg-orange-50"
                }`}
              >
                <i
                  className={`text-sm ${
                    resolved
                      ? "fa-solid fa-circle-check text-success"
                      : "fa-solid fa-triangle-exclamation text-warning"
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-sp-8">
                <div className="flex items-center gap-sp-8 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">
                    {p.id}: {p.name}
                  </h3>
                  {resolved ? (
                    <Badge colorScheme="success" label={t("onboarding.resolved", { value: resolvedVal })} />
                  ) : (
                    <Badge colorScheme="warning" label={t("onboarding.conflictDetected")} />
                  )}
                </div>

                {!resolved && (
                  <>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">{p.conflictField}</span>
                      {" — "}
                      <span className="font-semibold text-foreground">{p.sourceA.label}</span>
                      {": "}
                      <span className="font-semibold">{p.sourceA.display}</span>
                      {" vs. "}
                      <span className="font-semibold text-foreground">{p.sourceB.label}</span>
                      {": "}
                      <span className="font-semibold">{p.sourceB.display}</span>
                    </p>

                    {/* Benchmark */}
                    <div className="inline-flex items-center gap-sp-8 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-sp-12 py-sp-4 rounded-md text-xs font-medium">
                      <i className="fa-solid fa-lightbulb" aria-hidden="true" />
                      {p.benchmark.label}: {p.benchmark.display}
                    </div>

                    {/* Resolution controls */}
                    <div className="flex items-center gap-sp-8 flex-wrap pt-sp-4">
                      <Button
                        variant="outline"
                        colorScheme="primary"
                        onClick={() => handleQuickPick(p.id, p.sourceA.value)}
                      >
                        {p.sourceA.display}
                      </Button>
                      <Button
                        variant="outline"
                        colorScheme="primary"
                        onClick={() => handleQuickPick(p.id, p.sourceB.value)}
                      >
                        {p.sourceB.display}
                      </Button>
                      <Button
                        variant="outline"
                        colorScheme="primary"
                        onClick={() => handleQuickPick(p.id, p.benchmark.value)}
                      >
                        {p.benchmark.display} (benchmark)
                      </Button>

                      <div className="flex items-center gap-sp-4">
                        <Input
                          type="number"
                          placeholder="Custom"
                          className="w-24 h-9"
                          value={customValues[p.id] || ""}
                          onChange={(e) => {
                            setCustomValues((prev) => ({ ...prev, [p.id]: e.target.value }));
                            setResolvedConflicts((prev) => ({ ...prev, [p.id]: null }));
                          }}
                        />
                        <Button
                          variant="outline"
                          colorScheme="primary"
                          square
                          onClick={() => handleCustomSubmit(p.id)}
                          disabled={!customValues[p.id]}
                        >
                          <i className="fa-solid fa-check" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {resolved && (
                  <p className="text-xs text-muted-foreground">
                    {p.conflictField} set to{" "}
                    <span className="font-semibold text-foreground">{resolvedVal}</span>. Ready for
                    activation.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Section: Ready */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-sp-8">
        {t("onboarding.readyToActivate", { count: READY_POLICIES.length })}
      </p>

      {READY_POLICIES.map((p) => (
        <div
          key={p.id}
          className="rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-900 p-sp-16 border-l-4 border-l-success"
        >
          <div className="flex items-start gap-sp-12">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 shrink-0">
              <i className="fa-solid fa-circle-check text-sm text-success" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 space-y-sp-4">
              <div className="flex items-center gap-sp-8 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground">
                  {p.id}: {p.name}
                </h3>
                <Badge colorScheme="success" label={t("onboarding.ready")} />
              </div>
              <p className="text-xs text-muted-foreground">
                {p.category} · {p.maxAmount} · AFAS {p.afasCode} · Friction: {p.friction}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Activate button */}
      <Button
        variant="solid"
        colorScheme="primary"
        className="w-full"
        disabled={!allConflictsResolved || activating}
        onClick={handleActivate}
      >
        <i className="fa-solid fa-rocket" aria-hidden="true" />
        {activating
          ? t("onboarding.activating")
          : t("onboarding.activateCount", { count: READY_POLICIES.length + CONFLICT_POLICIES.length })}
      </Button>
    </div>
  );

  const phaseTitle = phase === "upload"
    ? t("onboarding.addDocument")
    : phase === "processing"
    ? t("onboarding.processingDocuments")
    : t("onboarding.reviewActivate");

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={phaseTitle}
      size="2xl"
      close
      dismissible={phase !== "processing"}
      body={
        phase === "upload"
          ? uploadContent
          : phase === "processing"
          ? processingContent
          : resultsContent
      }
    />
  );
}
