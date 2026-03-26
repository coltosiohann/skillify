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
      className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-6 my-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
          <Brain className="w-4 h-4 text-violet-600" />
        </div>
        <span className="text-sm font-semibold text-violet-700">Quick Check</span>
      </div>

      <p className="font-semibold text-foreground mb-4">{check.question}</p>

      <div className="space-y-2">
        {check.options.map((option, i) => {
          let style = "border-primary/15 hover:border-primary/30 hover:bg-primary/5";
          if (answered) {
            if (i === check.correct_index) {
              style = "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-600";
            } else if (i === selected) {
              style = "border-red-400 bg-red-50 dark:bg-red-900/30 dark:border-red-600";
            } else {
              style = "border-primary/10 opacity-50";
            }
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`w-full text-left p-3.5 rounded-xl border transition-all text-sm cursor-pointer ${style} ${
                !answered ? "active:scale-[0.98]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${answered && i === check.correct_index ? 'border-emerald-500 text-emerald-600' :
                    answered && i === selected ? 'border-red-500 text-red-600' : 'border-primary/30 text-primary/60'}">
                  {answered && i === check.correct_index ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : answered && i === selected ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span className={answered && i === check.correct_index ? "font-medium text-emerald-700" : ""}>
                  {option}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {answered && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`mt-4 p-4 rounded-xl ${isCorrect ? "bg-emerald-100 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}
        >
          <div className="flex items-start gap-2">
            {isCorrect ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className={`text-sm font-semibold ${isCorrect ? "text-emerald-700" : "text-amber-700"}`}>
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
