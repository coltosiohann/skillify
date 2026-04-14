"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search, BookOpen, Zap, Wrench, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WizardData } from "@/app/(app)/onboarding/page";
import type { GoalType } from "@/lib/prompts/course-generator";

const CATEGORIES = [
  { label: "Tech", emoji: "💻" },
  { label: "Fitness", emoji: "🏋️" },
  { label: "Language", emoji: "🌍" },
  { label: "Creative", emoji: "🎨" },
  { label: "Business", emoji: "📊" },
  { label: "Science", emoji: "🔬" },
  { label: "Music", emoji: "🎵" },
  { label: "Cooking", emoji: "🍳" },
  { label: "Sports", emoji: "⚽" },
  { label: "Academics", emoji: "📚" },
];

const GOAL_OPTIONS: {
  value: GoalType;
  label: string;
  sub: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
}[] = [
  {
    value: "auto",
    label: "Let AI decide",
    sub: "Best choice for your goal",
    icon: Layers,
    color: "text-primary/60",
    activeColor: "text-primary",
  },
  {
    value: "learning",
    label: "Learn & Understand",
    sub: "Concepts, theory, deep dives",
    icon: BookOpen,
    color: "text-blue-500/60",
    activeColor: "text-blue-500",
  },
  {
    value: "execution",
    label: "Step-by-step Plan",
    sub: "Routines, habits, results",
    icon: Zap,
    color: "text-amber-500/60",
    activeColor: "text-amber-500",
  },
  {
    value: "tool-based",
    label: "Tools & Workflows",
    sub: "Software, AI, automation",
    icon: Wrench,
    color: "text-emerald-500/60",
    activeColor: "text-emerald-500",
  },
];

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
}

export default function Step1Domain({ data, onNext }: Props) {
  const [domain, setDomain] = useState(data.domain);
  const [category, setCategory] = useState(data.category);
  const [goalType, setGoalType] = useState<GoalType>(data.goalType ?? "auto");

  function handleChip(label: string) {
    setCategory(label);
    if (!domain) setDomain(label);
  }

  function handleSubmit() {
    if (!domain.trim()) return;
    onNext({ domain: domain.trim(), category, goalType });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -32 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      className="w-full max-w-xl"
    >
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4"
        >
          Step 1 of 4
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="font-heading text-4xl font-extrabold text-foreground mb-3"
        >
          What do you want to{" "}
          <span className="text-gradient">learn?</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-muted-foreground"
        >
          Enter any topic — from coding to cooking to classical guitar.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="glass-card rounded-3xl p-8 shadow-xl shadow-primary/10"
      >
        {/* Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            autoFocus
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. Machine Learning, Guitar, Digital Marketing..."
            className="pl-12 h-14 text-base rounded-2xl border-primary/20 focus-visible:ring-primary/30 bg-card shadow-sm"
          />
        </div>

        {/* Category chips */}
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Or pick a category
        </p>
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => handleChip(cat.label)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer border ${
                category === cat.label
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
                  : "bg-card border-primary/15 text-foreground hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Goal type picker */}
        <div className="mb-8">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            What kind of course do you want?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = goalType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGoalType(opt.value)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "border-primary/40 bg-primary/8 shadow-sm shadow-primary/10"
                      : "border-primary/10 bg-card hover:border-primary/25 hover:bg-primary/4"
                  }`}
                >
                  <span className={`mt-0.5 flex-shrink-0 transition-colors ${isActive ? opt.activeColor : opt.color}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span>
                    <span className={`block text-xs font-semibold transition-colors ${isActive ? "text-foreground" : "text-foreground/70"}`}>
                      {opt.label}
                    </span>
                    <span className="block text-xs text-muted-foreground leading-tight mt-0.5">
                      {opt.sub}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!domain.trim()}
          className="w-full h-12 rounded-xl bg-primary text-white hover:bg-[#6d28d9] shadow-md shadow-primary/25 transition-all duration-200 gap-2 cursor-pointer disabled:opacity-50"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
