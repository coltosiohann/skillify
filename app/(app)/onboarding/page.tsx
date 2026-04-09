"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Step1Domain from "@/components/onboarding/Step1Domain";
import Step2Upload from "@/components/onboarding/Step2Upload";
import Step3Assessment from "@/components/onboarding/Step3Assessment";
import Step4Schedule from "@/components/onboarding/Step4Schedule";

export interface WizardData {
  domain: string;
  category: string;
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
  documentId: null,
  extractedText: null,
  detectedLevel: "beginner",
  durationWeeks: 4,
  minutesPerDay: 30,
  learningStyle: "balanced",
};

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
      // Save to localStorage and go to generating page
      localStorage.setItem("skillify_wizard", JSON.stringify(updated));
      router.push("/onboarding/generating");
    }
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 onboarding-bg">
      {/* Step dots */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step
                ? "bg-primary w-6"
                : i < step
                ? "bg-primary/40 w-2"
                : "bg-primary/15 w-2"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <Step1Domain key="step1" data={data} onNext={next} />
        )}
        {step === 2 && (
          <Step2Upload key="step2" data={data} onNext={next} onBack={back} />
        )}
        {step === 3 && (
          <Step3Assessment key="step3" data={data} onNext={next} onBack={back} />
        )}
        {step === 4 && (
          <Step4Schedule key="step4" data={data} onNext={next} onBack={back} />
        )}
      </AnimatePresence>
    </div>
  );
}
