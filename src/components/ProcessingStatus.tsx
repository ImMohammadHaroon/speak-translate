import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProcessingStep = "idle" | "uploading" | "transcribing" | "translating" | "done" | "error";

interface ProcessingStatusProps {
  currentStep: ProcessingStep;
  errorMessage?: string;
}

const steps = [
  { key: "uploading", label: "Uploading" },
  { key: "transcribing", label: "Transcribing" },
  { key: "translating", label: "Translating" },
  { key: "done", label: "Done" },
] as const;

const stepOrder: Record<string, number> = {
  idle: -1,
  uploading: 0,
  transcribing: 1,
  translating: 2,
  done: 3,
  error: -1,
};

export function ProcessingStatus({ currentStep, errorMessage }: ProcessingStatusProps) {
  if (currentStep === "idle") return null;

  const currentIndex = stepOrder[currentStep];

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, i) => {
          const isComplete = currentIndex > i;
          const isActive = currentIndex === i && currentStep !== "error";
          const isPending = currentIndex < i;

          return (
            <div key={step.key} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all",
                  isComplete && "bg-primary text-primary-foreground",
                  isActive && "bg-primary text-primary-foreground animate-pulse",
                  isPending && "bg-muted/30 text-muted-foreground border border-border"
                )}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:inline",
                  (isComplete || isActive) ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1",
                    isComplete ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {currentStep === "error" && errorMessage && (
        <p className="text-sm text-destructive text-center">{errorMessage}</p>
      )}
    </div>
  );
}
