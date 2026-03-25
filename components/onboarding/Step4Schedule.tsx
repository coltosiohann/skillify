"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardData } from "@/app/(app)/onboarding/page";

const DURATION_OPTIONS = [1, 2, 4, 6, 8, 12];
const MINUTES_OPTIONS = [15, 30, 45, 60];
const STYLE_OPTIONS = [
  {
    value: "theory" as const,
    label: "Theory-first",
    desc: "Deep concepts & explanations",
    icon: BookOpen,
  },
  {
    value: "practical" as const,
    label: "Hands-on",
    desc: "Projects & real-world practice",
    icon: Zap,
  },
  {
    value: "balanced" as const,
    label: "Balanced",
    desc: "Mix of theory & practice",
    icon: Layers,
  },
];

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
  onBack: () => void;
}

export default function Step4Schedule({ data, onNext, onBack }: Props) {
  const [durationWeeks, setDurationWeeks] = useState(data.durationWeeks);
  const [minutesPerDay, setMinutesPerDay] = useState(data.minutesPerDay);
  const [learningStyle, setLearningStyle] = useState(data.learningStyle);

  function handleGenerate() {
    onNext({ durationWeeks, minutesPerDay, learningStyle });
  }

  const totalHours = Math.round((durationWeeks * 7 * minutesPerDay) / 60);

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
          Step 4 of 4
        </div>
        <h1 className="font-heading text-4xl font-extrabold text-foreground mb-3">
          Design your{" "}
          <span className="text-gradient">schedule</span>
        </h1>
        <p className="text-muted-foreground">
          We&apos;ll build a course that fits your life.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-8 shadow-xl shadow-primary/10 space-y-8">
        {/* Duration */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-semibold text-foreground text-sm">Course duration</label>
            <span className="text-primary font-bold text-sm">{durationWeeks} weeks</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {DURATION_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setDurationWeeks(w)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer border ${
                  durationWeeks === w
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                    : "bg-white border-primary/15 text-foreground hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                {w}w
              </button>
            ))}
          </div>
        </div>

        {/* Minutes per day */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-semibold text-foreground text-sm">Daily study time</label>
            <span className="text-primary font-bold text-sm">{minutesPerDay} min/day</span>
          </div>
          <div className="flex gap-2">
            {MINUTES_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutesPerDay(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer border ${
                  minutesPerDay === m
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                    : "bg-white border-primary/15 text-foreground hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Learning style */}
        <div>
          <label className="font-semibold text-foreground text-sm block mb-3">Learning style</label>
          <div className="grid grid-cols-3 gap-2.5">
            {STYLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLearningStyle(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-150 cursor-pointer text-center ${
                    learningStyle === opt.value
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-white border-primary/15 text-foreground hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${learningStyle === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-semibold text-xs leading-tight">{opt.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Your course will be{" "}
            <span className="font-bold text-primary">{durationWeeks} weeks</span> long with{" "}
            <span className="font-bold text-primary">{minutesPerDay} min/day</span> — about{" "}
            <span className="font-bold text-primary">{totalHours} total hours</span> of learning.
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2 rounded-xl border-primary/15 hover:bg-primary/5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button
            onClick={handleGenerate}
            className="flex-1 h-12 rounded-xl bg-primary text-white hover:bg-[#6d28d9] shadow-md shadow-primary/25 transition-all duration-200 gap-2 cursor-pointer font-semibold"
          >
            <Zap className="w-4 h-4" />
            Generate My Course
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
