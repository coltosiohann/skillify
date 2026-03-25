"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WizardData } from "@/app/(app)/onboarding/page";

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

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
}

export default function Step1Domain({ data, onNext }: Props) {
  const [domain, setDomain] = useState(data.domain);
  const [category, setCategory] = useState(data.category);

  function handleChip(label: string, emoji: string) {
    setCategory(label);
    if (!domain) setDomain(label);
  }

  function handleSubmit() {
    if (!domain.trim()) return;
    onNext({ domain: domain.trim(), category });
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
            className="pl-12 h-14 text-base rounded-2xl border-primary/20 focus-visible:ring-primary/30 bg-white shadow-sm"
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
              onClick={() => handleChip(cat.label, cat.emoji)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer border ${
                category === cat.label
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
                  : "bg-white border-primary/15 text-foreground hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
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
