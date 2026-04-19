"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Target, Wrench, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardData } from "@/app/(app)/onboarding/page";

// ─── Data ─────────────────────────────────────────────────────────────────────

const EXECUTION_CONSTRAINTS = [
  "No equipment needed",
  "Home-based",
  "Low budget",
  "30 min/day max",
  "Include nutrition",
  "Injury-friendly",
];

const TOOL_USE_CASES = [
  "Content creation",
  "Social media",
  "Ads & marketing",
  "Email campaigns",
  "SEO & research",
  "Automation",
  "Design & visuals",
  "Sales outreach",
  "Business workflows",
];

const TOOL_BUDGETS = [
  { value: "free tools only", label: "Free tools only", sub: "No paid subscriptions" },
  { value: "mix of free and paid", label: "Mix of free & paid", sub: "Some budget available" },
  { value: "happy to pay for the best tools", label: "Best tools, paid or free", sub: "Budget is not a constraint" },
];

const HYBRID_CONTEXTS = [
  "For my own business",
  "For clients / agency",
  "Personal project",
  "Career change",
  "Side hustle",
  "Academic / study",
];

const LEVELS: { value: "beginner" | "intermediate" | "advanced"; label: string; sub: string }[] = [
  { value: "beginner",     label: "Beginner",      sub: "Little or no experience" },
  { value: "intermediate", label: "Intermediate",  sub: "Some practical experience" },
  { value: "advanced",     label: "Advanced",      sub: "Solid background already" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-primary/60" />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer ${
        active
          ? "bg-primary text-white border-primary shadow-sm shadow-primary/25"
          : "bg-card border-primary/15 text-foreground hover:border-primary/35 hover:bg-primary/5"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
  onBack: () => void;
}

export default function Step3Smart({ data, onNext, onBack }: Props) {
  const { goalType } = data;

  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    data.detectedLevel ?? "beginner"
  );
  const [useCases, setUseCases]     = useState<string[]>(data.useCases ?? []);
  const [constraints, setConstraints] = useState<string[]>(data.constraints ?? []);
  const [toolBudget, setToolBudget] = useState<string>(
    data.constraints?.find((c) => TOOL_BUDGETS.map((b) => b.value).includes(c)) ?? ""
  );

  function toggleItem(arr: string[], set: (v: string[]) => void, val: string) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function handleSubmit() {
    const allConstraints = [
      ...constraints.filter((c) => !TOOL_BUDGETS.map((b) => b.value).includes(c)),
      ...(toolBudget ? [toolBudget] : []),
    ];
    onNext({
      detectedLevel: level,
      useCases:    useCases.length     > 0 ? useCases     : undefined,
      constraints: allConstraints.length > 0 ? allConstraints : undefined,
    });
  }

  const isExecution = goalType === "execution";
  const isToolBased = goalType === "tool-based";
  const isHybrid    = goalType === "hybrid";
  // "auto" gets a neutral version with level + optional timeframe

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -32 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      className="w-full max-w-xl"
    >
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
          Step 3 of 4
        </div>
        <h1 className="font-heading text-4xl font-extrabold text-foreground mb-3">
          {isExecution ? "Plan your " : isToolBased ? "Set your " : "Customize your "}
          <span className="text-gradient">
            {isExecution ? "journey" : isToolBased ? "toolkit" : "course"}
          </span>
        </h1>
        <p className="text-muted-foreground">
          {isExecution
            ? "A few details so we can build the exact plan you need."
            : isToolBased
            ? "Tell us your focus so we can choose the right tools and workflows."
            : "Help us tailor the course to your situation."}
        </p>
      </div>

      <div className="glass-card rounded-3xl p-8 shadow-xl shadow-primary/10 space-y-8">

        {/* ── Level ──────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel icon={Target} label="Your current level" />
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLevel(l.value)}
                className={`flex flex-col items-center gap-1 p-3.5 rounded-xl border transition-all duration-150 cursor-pointer text-center ${
                  level === l.value
                    ? "border-primary/50 bg-primary/8 shadow-sm"
                    : "border-primary/10 bg-card hover:border-primary/25 hover:bg-primary/4"
                }`}
              >
                <span className={`text-sm font-bold ${level === l.value ? "text-primary" : "text-foreground/80"}`}>
                  {l.label}
                </span>
                <span className="text-xs text-muted-foreground leading-tight">{l.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Constraints (execution) ─────────────────────────────────────── */}
        {isExecution && (
          <div>
            <SectionLabel icon={Target} label="Constraints (optional)" />
            <div className="flex flex-wrap gap-2">
              {EXECUTION_CONSTRAINTS.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={constraints.includes(c)}
                  onClick={() => toggleItem(constraints, setConstraints, c)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Use cases (tool-based + hybrid) ────────────────────────────── */}
        {(isToolBased || isHybrid) && (
          <div>
            <SectionLabel icon={Wrench} label="Main focus areas" />
            <div className="flex flex-wrap gap-2">
              {TOOL_USE_CASES.map((uc) => (
                <Chip
                  key={uc}
                  label={uc}
                  active={useCases.includes(uc)}
                  onClick={() => toggleItem(useCases, setUseCases, uc)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Context (hybrid) ────────────────────────────────────────────── */}
        {isHybrid && (
          <div>
            <SectionLabel icon={Target} label="Context (optional)" />
            <div className="flex flex-wrap gap-2">
              {HYBRID_CONTEXTS.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={constraints.includes(c)}
                  onClick={() => toggleItem(constraints, setConstraints, c)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Tool budget (tool-based + hybrid) ───────────────────────────── */}
        {(isToolBased || isHybrid) && (
          <div>
            <SectionLabel icon={Wallet} label="Tool budget" />
            <div className="flex flex-col gap-2">
              {TOOL_BUDGETS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setToolBudget(toolBudget === b.value ? "" : b.value)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                    toolBudget === b.value
                      ? "border-primary/50 bg-primary/8 shadow-sm"
                      : "border-primary/10 bg-card hover:border-primary/25 hover:bg-primary/4"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      toolBudget === b.value ? "border-primary" : "border-primary/25"
                    }`}
                  >
                    {toolBudget === b.value && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${toolBudget === b.value ? "text-foreground" : "text-foreground/70"}`}>
                      {b.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{b.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2 rounded-xl border-primary/15 hover:bg-primary/5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 h-12 rounded-xl bg-primary text-white hover:bg-[#4338CA] shadow-md shadow-primary/25 gap-2 cursor-pointer"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
