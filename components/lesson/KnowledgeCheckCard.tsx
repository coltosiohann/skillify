"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Brain } from "lucide-react";
import type { KnowledgeCheck } from "@/lib/types/lesson-content";

interface Props {
  check: KnowledgeCheck;
  onAnswered: () => void;
}

export default function KnowledgeCheckCard({ check, onAnswered }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    onAnswered();
  }

  const isCorrect = selected === check.correct_index;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50 rounded-2xl p-6 my-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-800/50 flex items-center justify-center">
          <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">Quick Check</span>
      </div>

      <p className="font-semibold text-foreground mb-4">{check.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {check.options.map((option, i) => {
          let containerStyle = "border-primary/15 bg-background dark:bg-card hover:border-primary/40 hover:bg-primary/5";
          let labelStyle = "text-foreground";

          if (answered) {
            if (i === check.correct_index) {
              containerStyle = "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30";
              labelStyle = "text-emerald-800 dark:text-emerald-300 font-medium";
            } else if (i === selected) {
              containerStyle = "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/30";
              labelStyle = "text-red-800 dark:text-red-300";
            } else {
              containerStyle = "border-primary/10 opacity-40";
            }
          }

          const isThisCorrect = answered && i === check.correct_index;
          const isThisWrong   = answered && i === selected && i !== check.correct_index;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`w-full text-left p-3.5 rounded-xl border transition-all text-sm cursor-pointer disabled:cursor-default ${containerStyle} ${
                !answered ? "active:scale-[0.98]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Radio indicator */}
                <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isThisCorrect
                    ? "bg-emerald-100 dark:bg-emerald-800/50"
                    : isThisWrong
                    ? "bg-red-100 dark:bg-red-800/50"
                    : "bg-primary/10 dark:bg-primary/20"
                }`}>
                  {isThisCorrect ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : isThisWrong ? (
                    <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                  ) : (
                    <span className="text-xs font-bold text-primary/70 dark:text-primary/60">
                      {String.fromCharCode(65 + i)}
                    </span>
                  )}
                </span>
                <span className={labelStyle}>{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`mt-4 p-4 rounded-xl border ${
            isCorrect
              ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700"
              : "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700"
          }`}
        >
          <div className="flex items-start gap-2">
            {isCorrect ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className={`text-sm font-semibold ${
                isCorrect
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-amber-700 dark:text-amber-400"
              }`}>
                {isCorrect ? "Correct!" : "Not quite right"}
              </p>
              <p className="text-sm text-foreground/70 mt-1">{check.explanation}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
