"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Lightbulb, Eye, ChevronDown, ChevronUp } from "lucide-react";
import type { PracticeChallenge } from "@/lib/types/lesson-content";

interface Props {
  challenge: PracticeChallenge;
}

export default function PracticeChallengeCard({ challenge }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [confirmSolution, setConfirmSolution] = useState(false);

  function revealNextHint() {
    setHintsRevealed((h) => Math.min(h + 1, challenge.hints.length));
  }

  function handleShowSolution() {
    if (!confirmSolution) { setConfirmSolution(true); return; }
    setShowSolution(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl overflow-hidden my-6"
    >
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-5 text-left cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center flex-shrink-0">
          <Code2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Practice Challenge</p>
          <p className="text-sm font-bold text-foreground">{challenge.title}</p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          : <ChevronDown className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        }
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-amber-200 dark:border-amber-700/50"
          >
            <div className="p-5 pt-4">
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                {challenge.description}
              </p>

              {/* Hints */}
              {challenge.hints.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Hints ({hintsRevealed}/{challenge.hints.length})
                    </span>
                    {hintsRevealed < challenge.hints.length && (
                      <button
                        type="button"
                        onClick={revealNextHint}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium cursor-pointer"
                      >
                        Show hint
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {challenge.hints.slice(0, hintsRevealed).map((hint, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2 p-2.5 bg-card rounded-lg border border-amber-200 dark:border-amber-700/50"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground/70">{hint}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Solution toggle */}
              {!showSolution ? (
                <button
                  type="button"
                  onClick={handleShowSolution}
                  className={`flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors ${
                    confirmSolution
                      ? "text-red-500 dark:text-red-400 hover:text-red-600"
                      : "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {confirmSolution ? "Are you sure? Click again to reveal" : "Show solution"}
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-amber-200 dark:border-amber-700/50 rounded-xl p-4"
                >
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Solution
                  </p>
                  <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {challenge.solution_markdown}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
