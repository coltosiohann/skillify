"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "dashboard-greeting",
    title: "Welcome to Skillify! 👋",
    description: "This is your personal learning dashboard. Here you can see your progress, XP, and streaks at a glance.",
    placement: "bottom",
  },
  {
    target: "dashboard-stats",
    title: "Your Learning Stats",
    description: "Track your total XP, daily streak, active courses, and completed courses — all in one place.",
    placement: "bottom",
  },
  {
    target: "dashboard-weekly-goal",
    title: "Weekly XP Goal",
    description: "Set a weekly XP target and watch the ring fill up as you learn. Change your goal in Settings.",
    placement: "top",
  },
  {
    target: "dashboard-courses",
    title: "Your Courses",
    description: "AI builds a personalized course for any topic in seconds. Each card shows your progress.",
    placement: "top",
  },
  {
    target: "sidebar-nav",
    title: "Navigation",
    description: "Use the sidebar to access your courses, leaderboard, achievements, and notifications.",
    placement: "right",
  },
];

const STORAGE_KEY = "skillify_tour_v1";

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Only show if never completed
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      // Short delay so page renders first
      const timer = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateRect = useCallback((targetId: string) => {
    const el = document.querySelector(`[data-tour="${targetId}"]`);
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const currentStep = TOUR_STEPS[step];
    updateRect(currentStep.target);

    function onResize() { updateRect(currentStep.target); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, step, updateRect]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setActive(false);
  }

  function next() {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];
  const PAD = 12;

  // Calculate tooltip position based on element rect
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const placement = currentStep.placement ?? "bottom";
    const tooltipWidth = 300;

    switch (placement) {
      case "bottom":
        return {
          top: rect.bottom + PAD,
          left: Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16)),
        };
      case "top":
        return {
          top: rect.top - PAD,
          left: Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16)),
          transform: "translateY(-100%)",
        };
      case "right":
        return {
          top: rect.top + rect.height / 2,
          left: rect.right + PAD,
          transform: "translateY(-50%)",
        };
      case "left":
        return {
          top: rect.top + rect.height / 2,
          left: rect.left - PAD,
          transform: "translate(-100%, -50%)",
        };
    }
  };

  const getHighlightStyle = (): React.CSSProperties => {
    if (!rect) return {};
    return {
      top: rect.top - 4,
      left: rect.left - 4,
      width: rect.width + 8,
      height: rect.height + 8,
    };
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40"
        onClick={dismiss}
        aria-label="Close tour"
      />

      {/* Highlight ring */}
      {rect && (
        <div
          className="fixed z-[101] rounded-2xl ring-2 ring-primary ring-offset-2 pointer-events-none transition-all duration-300"
          style={getHighlightStyle()}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[102] w-[300px] bg-card border border-primary/15 rounded-2xl shadow-2xl shadow-black/20 p-5"
          style={getTooltipStyle()}
        >
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? "w-5 bg-primary" : "w-1.5 bg-primary/25"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={dismiss}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary/8 cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Skip tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h3 className="font-heading font-bold text-foreground text-sm mb-1.5">{currentStep.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">{currentStep.description}</p>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={prev}
                className="rounded-xl border-primary/15 gap-1 cursor-pointer text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={next}
              className="flex-1 rounded-xl bg-primary hover:bg-[#6d28d9] text-white gap-1 cursor-pointer text-xs shadow-md shadow-primary/20"
            >
              {step === TOUR_STEPS.length - 1 ? "Get Started!" : <><span>Next</span> <ArrowRight className="w-3.5 h-3.5" /></>}
            </Button>
          </div>
          <button
            onClick={dismiss}
            className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Skip tour
          </button>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
