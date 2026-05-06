"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Step1Domain from "@/components/onboarding/Step1Domain";
import Step2Upload from "@/components/onboarding/Step2Upload";
import Step3Assessment from "@/components/onboarding/Step3Assessment";
import Step3Smart from "@/components/onboarding/Step3Smart";
import Step4Schedule from "@/components/onboarding/Step4Schedule";
import type { GoalType } from "@/lib/prompts/course-generator";

export interface WizardData {
  domain: string;
  category: string;
  goalType: GoalType;
  timeframe?: string;
  useCases?: string[];
  constraints?: string[];
  documentId: string | null;
  extractedText: string | null;
  detectedLevel: "beginner" | "intermediate" | "advanced";
  durationWeeks: number;
  minutesPerDay: number;
  learningStyle: "theory" | "practical" | "balanced";
}

const DEFAULT: WizardData = {
  domain: "",
  category: "",
  goalType: "auto",
  timeframe: undefined,
  useCases: undefined,
  constraints: undefined,
  documentId: null,
  extractedText: null,
  detectedLevel: "beginner",
  durationWeeks: 4,
  minutesPerDay: 30,
  learningStyle: "balanced",
};

const STEP_LABELS = ["Goal", "Materials", "Details", "Schedule"];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(DEFAULT);
  const router = useRouter();

  function next(patch: Partial<WizardData>) {
    const updated = { ...data, ...patch };
    setData(updated);
    if (step < 4) {
      setStep((s) => s + 1);
    } else {
      localStorage.setItem("skillify_wizard", JSON.stringify(updated));
      router.push("/onboarding/generating");
    }
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--background)" }}>
      {/* Step progress indicator */}
      <div style={{ position: "fixed", top: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0", position: "relative" }}>
          {/* Connector line behind steps */}
          <div style={{
            position: "absolute", top: "16px", left: "16px", right: "16px",
            height: "1px", background: "var(--border)", zIndex: 0,
          }} />
          {STEP_LABELS.map((label, idx) => {
            const i = idx + 1;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1, position: "relative", zIndex: 1, minWidth: "60px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: done ? "var(--emerald)" : active ? "var(--blue)" : "var(--muted)",
                  border: `2px solid ${done ? "var(--emerald)" : active ? "var(--blue)" : "var(--border)"}`,
                  display: "grid", placeItems: "center",
                  fontSize: "12px", fontWeight: 700,
                  color: (done || active) ? "#fff" : "var(--muted-foreground)",
                  boxShadow: active ? "0 0 0 4px var(--blue-muted)" : "none",
                  transition: "all 0.25s",
                }}>
                  {done ? "✓" : i}
                </div>
                <span style={{
                  fontSize: "11px", fontWeight: 600,
                  color: done ? "var(--emerald)" : active ? "var(--blue)" : "var(--muted-foreground)",
                  transition: "color 0.25s",
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && <Step1Domain key="step1" data={data} onNext={next} />}
        {step === 2 && <Step2Upload key="step2" data={data} onNext={next} onBack={back} />}
        {step === 3 && data.goalType === "learning" && <Step3Assessment key="step3-assess" data={data} onNext={next} onBack={back} />}
        {step === 3 && data.goalType !== "learning" && <Step3Smart key="step3-smart" data={data} onNext={next} onBack={back} />}
        {step === 4 && <Step4Schedule key="step4" data={data} onNext={next} onBack={back} />}
      </AnimatePresence>
    </div>
  );
}
