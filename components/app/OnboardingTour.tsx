"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
  mobileIcon?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "dashboard-greeting",
    title: "Welcome to Skillify! 👋",
    description: "This is your personal learning dashboard. Here you can see your progress, XP, and streaks at a glance.",
    placement: "bottom",
    mobileIcon: "🏠",
  },
  {
    target: "dashboard-stats",
    title: "Your Learning Stats",
    description: "Track your total XP, daily streak, active courses, and completed courses — all in one place.",
    placement: "bottom",
    mobileIcon: "📊",
  },
  {
    target: "dashboard-weekly-goal",
    title: "Weekly XP Goal",
    description: "Set a weekly XP target and watch the ring fill up as you learn. Change your goal in Settings.",
    placement: "top",
    mobileIcon: "🎯",
  },
  {
    target: "dashboard-courses",
    title: "Your Courses",
    description: "AI builds a personalized course for any topic in seconds. Each card shows your progress.",
    placement: "top",
    mobileIcon: "📚",
  },
  {
    target: "sidebar-nav",
    title: "Navigation",
    description: "Use the sidebar to access your courses, leaderboard, achievements, and notifications.",
    placement: "right",
    mobileIcon: "🧭",
  },
];

const STORAGE_KEY = "skillify_tour_v1";
const TOOLTIP_WIDTH = 300;
const PAD = 12;

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Track mobile breakpoint
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const updateRect = useCallback((targetId: string) => {
    const el = document.querySelector(`[data-tour="${targetId}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      // If element is off-screen (e.g. sidebar hidden on mobile), treat as missing
      if (r.width === 0 || r.height === 0 || r.top < 0 || r.left < 0) {
        setRect(null);
      } else {
        setRect(r);
      }
    } else {
      setRect(null);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    updateRect(TOUR_STEPS[step].target);
    function onResize() { updateRect(TOUR_STEPS[step].target); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, step, updateRect]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setActive(false);
  }

  function next() {
    if (step < TOUR_STEPS.length - 1) setStep((s) => s + 1);
    else dismiss();
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  // ─── Mobile: bottom sheet ────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Dim backdrop — tap outside does nothing (prevents accidental dismiss) */}
        <div className="fixed inset-0 z-[100] bg-black/40 pointer-events-none" />

        {/* Bottom sheet */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[102] bg-card border-t border-primary/15 rounded-t-3xl shadow-2xl shadow-black/30 px-6 pt-5 pb-8"
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full bg-primary/20 mx-auto mb-5" />

            {/* Step dots + close */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1.5 items-center">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? "w-6 bg-primary" : "w-2 bg-primary/20"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={dismiss}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-muted hover:bg-primary/10 cursor-pointer text-muted-foreground"
                aria-label="Skip tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl mb-4">
              {currentStep.mobileIcon}
            </div>

            {/* Content */}
            <h3 className="font-heading font-bold text-foreground text-lg mb-2">{currentStep.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{currentStep.description}</p>

            {/* Buttons */}
            <div className="flex gap-3">
              {step > 0 ? (
                <Button
                  variant="outline"
                  onClick={prev}
                  className="flex-1 rounded-2xl border-primary/15 gap-2 cursor-pointer h-12"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={dismiss}
                  className="flex-1 rounded-2xl text-muted-foreground cursor-pointer h-12"
                >
                  Skip
                </Button>
              )}
              <Button
                onClick={next}
                className="flex-1 rounded-2xl bg-primary hover:bg-[#6d28d9] text-white gap-2 cursor-pointer h-12 shadow-lg shadow-primary/25"
              >
                {isLast ? (
                  <><Sparkles className="w-4 h-4" /> Let&apos;s Go!</>
                ) : (
                  <><span>Next</span> <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </>
    );
  }

  // ─── Desktop: floating tooltip ───────────────────────────────────────────
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect) {
      // Fallback: centered on screen
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const placement = currentStep.placement ?? "bottom";
    const clampLeft = (x: number) => Math.max(16, Math.min(x, vw - TOOLTIP_WIDTH - 16));

    switch (placement) {
      case "bottom": {
        const top = rect.bottom + PAD;
        return { top, left: clampLeft(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2) };
      }
      case "top": {
        return {
          top: rect.top - PAD,
          left: clampLeft(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2),
          transform: "translateY(-100%)",
        };
      }
      case "right": {
        const left = rect.right + PAD;
        // If tooltip would overflow right, flip to left
        if (left + TOOLTIP_WIDTH > vw - 16) {
          return {
            top: Math.max(16, Math.min(rect.top + rect.height / 2, vh - 200)),
            left: Math.max(16, rect.left - PAD - TOOLTIP_WIDTH),
            transform: "translateY(-50%)",
          };
        }
        return {
          top: Math.max(16, Math.min(rect.top + rect.height / 2, vh - 200)),
          left,
          transform: "translateY(-50%)",
        };
      }
      case "left": {
        return {
          top: Math.max(16, Math.min(rect.top + rect.height / 2, vh - 200)),
          left: Math.max(16, rect.left - PAD - TOOLTIP_WIDTH),
          transform: "translateY(-50%)",
        };
      }
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
          transition={{ duration: 0.18 }}
          className="fixed z-[102] bg-card border border-primary/15 rounded-2xl shadow-2xl shadow-black/20 p-5"
          style={{ width: TOOLTIP_WIDTH, ...getTooltipStyle() }}
        >
          {/* Step dots + close */}
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
              {isLast ? (
                "Get Started!"
              ) : (
                <><span>Next</span> <ArrowRight className="w-3.5 h-3.5" /></>
              )}
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
