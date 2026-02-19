import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  READY_POLICIES,
  CONFLICT_POLICIES,
  resetPoliciesTable,
  upsertPolicies,
} from "@/data/onboarding-policies";

type Phase = "upload" | "processing" | "results";

const PROCESSING_STEPS = [
  "Reading documents...",
  "Extracting purchasing rules...",
  "Mapping to AFAS ledgers...",
  "Detecting conflicts...",
];

export default function OnboardingView() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [processingStep, setProcessingStep] = useState(0);
  const [resolvedConflicts, setResolvedConflicts] = useState<Record<string, number | null>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState(false);
  const [activating, setActivating] = useState(false);

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

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetPoliciesTable();
      toast.success("All policies cleared — ready for a fresh demo.");
    } catch {
      toast.error("Failed to reset the database.");
    } finally {
      setResetting(false);
    }
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
      toast.success(`${count} policies activated and synced to AFAS!`);
      navigate("/app/admin/policy-hub");
    } catch {
      toast.error("Failed to activate policies.");
    } finally {
      setActivating(false);
    }
  };

  // ─── Upload Phase ───
  if (phase === "upload") {
    return (
      <div className="space-y-sp-24">
        <PageHeader
          title="Policy Onboarding"
          subtitle="Upload your organization's policy documents and let the AI engine extract atomic purchasing rules."
          icon="fa-solid fa-file-import"
        />

        <div className="max-w-2xl space-y-sp-16">
          <FileUpload
            value={files}
            onChange={(f) => setFiles(f ? (Array.isArray(f) ? f : [f]) : [])}
            multiple
            accept=".pdf,.txt"
            filesLayout="list"
            description="PDF or TXT files up to 50 MB"
          />

          <div className="flex gap-sp-8">
            <Button
              variant="solid"
              colorScheme="primary"
              className="flex-1"
              disabled={files.length === 0}
              onClick={handleProcess}
            >
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
              Process & Generate Atomic Policies
            </Button>

            <Button
              variant="outline"
              colorScheme="error"
              disabled={resetting}
              onClick={handleReset}
            >
              <i className="fa-solid fa-trash-can" aria-hidden="true" />
              {resetting ? "Resetting…" : "Reset Database"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Processing Phase ───
  if (phase === "processing") {
    return (
      <div className="space-y-sp-24">
        <PageHeader
          title="Policy Onboarding"
          subtitle="Upload your organization's policy documents and let the AI engine extract atomic purchasing rules."
          icon="fa-solid fa-file-import"
        />

        <div className="max-w-lg mx-auto py-sp-32 flex flex-col items-center gap-sp-24">
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
            Analyzing {files.length} document{files.length !== 1 ? "s" : ""}…
          </p>
        </div>
      </div>
    );
  }

  // ─── Results Phase ───
  return (
    <div className="space-y-sp-24">
      <PageHeader
        title="Policy Onboarding"
        subtitle="Review the AI-generated draft policies below. Resolve any conflicts before activation."
        icon="fa-solid fa-file-import"
      />

      <div className="max-w-3xl space-y-sp-16">
        {/* Section: Ready */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Ready to Activate ({READY_POLICIES.length})
        </p>

        {READY_POLICIES.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-900 p-sp-24 border-l-4 border-l-success"
          >
            <div className="flex items-start gap-sp-16">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 shrink-0">
                <i className="fa-solid fa-circle-check text-lg text-success" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 space-y-sp-4">
                <div className="flex items-center gap-sp-8 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">
                    {p.id}: {p.name}
                  </h3>
                  <Badge colorScheme="success" label="Ready" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.category} · {p.maxAmount} · AFAS {p.afasCode} · Friction: {p.friction}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Section: Conflicts */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-sp-8">
          Conflicts to Resolve ({CONFLICT_POLICIES.length})
        </p>

        {CONFLICT_POLICIES.map((p) => {
          const resolved = resolvedConflicts[p.id] != null;
          const resolvedVal = resolvedConflicts[p.id];
          return (
            <div
              key={p.id}
              className={`rounded-lg border bg-white dark:bg-grey-900 p-sp-24 border-l-4 transition-colors ${
                resolved
                  ? "border-grey-200 dark:border-grey-700 border-l-success"
                  : "border-orange-200 dark:border-orange-800 border-l-warning"
              }`}
            >
              <div className="flex items-start gap-sp-16">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                    resolved ? "bg-green-50" : "bg-orange-50"
                  }`}
                >
                  <i
                    className={`text-lg ${
                      resolved
                        ? "fa-solid fa-circle-check text-success"
                        : "fa-solid fa-triangle-exclamation text-warning"
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-sp-12">
                  <div className="flex items-center gap-sp-8 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">
                      {p.id}: {p.name}
                    </h3>
                    {resolved ? (
                      <Badge colorScheme="success" label={`Resolved — ${resolvedVal}`} />
                    ) : (
                      <Badge colorScheme="warning" label="Conflict Detected" />
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
            ? "Activating…"
            : `Approve & Activate ${READY_POLICIES.length + CONFLICT_POLICIES.length} Policies`}
        </Button>
      </div>
    </div>
  );
}
