"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, ArrowRight, Zap, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

interface Question {
  id: string;
  question: string;
  options_json: string[];
  correct_answer: string;
  explanation: string;
  order_index: number;
}

interface Props {
  quizId: string;
  questions: Question[];
  moduleTitle: string;
  courseId: string;
  userId: string;
  xpReward: number;
  isRetake?: boolean;
}

type Phase = "quiz" | "results";

export default function QuizPlayer({ quizId, questions, moduleTitle, courseId, userId, xpReward, isRetake = false }: Props) {
  const [phase, setPhase] = useState<Phase>("quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const current = questions[currentIndex];
  const isCorrect = selected === current?.correct_answer;
  const isLast = currentIndex === questions.length - 1;

  function handleSelect(option: string) {
    if (revealed) return;
    setSelected(option);
  }

  function handleReveal() {
    if (!selected) return;
    setRevealed(true);
    setAnswers((prev) => ({ ...prev, [current.id]: selected }));
  }

  // Keyboard shortcuts: Enter = check/next, 1-4 = select option
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase !== "quiz") return;
    if (e.key === "Enter") {
      if (!revealed && selected) handleReveal();
      else if (revealed && !submitting) handleNext();
    }
    // 1-4 keys to pick options
    const idx = parseInt(e.key) - 1;
    if (!revealed && idx >= 0 && idx < (current?.options_json?.length ?? 0)) {
      handleSelect(current.options_json[idx]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, revealed, selected, submitting, current, currentIndex]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  async function handleNext() {
    if (isLast) {
      await submitQuiz({ ...answers, [current.id]: selected ?? "" });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  }

  async function submitQuiz(finalAnswers: Record<string, string>) {
    setSubmitting(true);
    const score = questions.filter((q) => finalAnswers[q.id] === q.correct_answer).length;
    const passed = score >= Math.ceil(questions.length * 0.6);
    // No XP on retakes
    const xpAwarded = isRetake ? 0 : passed ? xpReward : Math.floor(xpReward * 0.25);

    try {
      await supabase.from("quiz_attempts").insert({
        user_id: userId,
        quiz_id: quizId,
        score,
        answers_json: finalAnswers,
        passed,
        xp_awarded: xpAwarded,
      } as never);

      if (!isRetake && xpAwarded > 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_xp")
          .eq("id", userId)
          .single();
        await supabase
          .from("profiles")
          .update({ total_xp: (profile?.total_xp ?? 0) + xpAwarded } as never)
          .eq("id", userId);
        toast.success(`+${xpAwarded} XP earned!`);
      } else if (isRetake) {
        toast.success(passed ? "Quiz passed! 🎉" : "Keep practicing!");
      }
    } catch {
      toast.error("Failed to save quiz result");
    } finally {
      setSubmitting(false);
      setPhase("results");
    }
  }

  const score = questions.filter((q) => answers[q.id] === q.correct_answer).length;
  const passed = score >= Math.ceil(questions.length * 0.6);
  const scorePct = Math.round((score / questions.length) * 100);

  if (phase === "results") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto px-4 py-12 text-center"
      >
        <div className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center ${passed ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
          {passed ? (
            <Trophy className="w-10 h-10 text-emerald-600" />
          ) : (
            <RotateCcw className="w-10 h-10 text-amber-600" />
          )}
        </div>

        <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2">
          {passed ? "Quiz Passed!" : "Keep Practicing"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {passed ? "Great job! You've mastered this module." : "You need 60% to pass. Review the lessons and try again."}
        </p>

        <div className="glass-card rounded-3xl p-6 border border-primary/10 mb-6">
          <div className="text-5xl font-extrabold font-heading mb-1" style={{ color: passed ? "#10b981" : "#f59e0b" }}>
            {scorePct}%
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {score}/{questions.length} correct
          </p>

          <div className="h-2.5 bg-primary/10 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-700 ${passed ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${scorePct}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-amber-600 font-semibold">
            <Zap className="w-4 h-4" />
            +{passed ? xpReward : Math.floor(xpReward * 0.25)} XP earned
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-2 text-left mb-6">
          {questions.map((q, i) => {
            const correct = answers[q.id] === q.correct_answer;
            return (
              <div key={q.id} className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${correct ? "border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30" : "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/30"}`}>
                {correct ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${correct ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}>Q{i + 1}: {q.question}</p>
                  {!correct && (
                    <p className="text-xs text-muted-foreground mt-0.5">Correct: {q.correct_answer}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Link href={`/courses/${courseId}`}>
          <Button className="w-full h-11 rounded-xl bg-primary hover:bg-[#6d28d9] text-white font-semibold shadow-md shadow-primary/25 cursor-pointer">
            Back to Course
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-1">Module Quiz · {moduleTitle}</p>
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-foreground">
            Question {currentIndex + 1} of {questions.length}
          </h1>
          <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> {xpReward} XP
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-primary/10 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          {/* Question */}
          <div className="glass-card rounded-2xl p-6 border border-primary/10 mb-4">
            <p className="font-semibold text-foreground text-base leading-relaxed">
              {current?.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5 mb-4">
            {(current?.options_json ?? []).map((option, i) => {
              const letter = ["A", "B", "C", "D"][i];
              let style = "border-primary/15 hover:border-primary/40 hover:bg-primary/3";
              if (revealed) {
                if (option === current.correct_answer) {
                  style = "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600";
                } else if (option === selected) {
                  style = "border-red-400 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600";
                } else {
                  style = "border-primary/8 opacity-50";
                }
              } else if (selected === option) {
                style = "border-primary bg-primary/8";
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={revealed}
                  aria-pressed={selected === option}
                  aria-label={`Option ${letter}: ${option}${revealed && option === current.correct_answer ? " — Correct" : revealed && option === selected && option !== current.correct_answer ? " — Incorrect" : ""}`}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${style} disabled:cursor-default`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    revealed && option === current.correct_answer
                      ? "bg-emerald-200 text-emerald-700"
                      : revealed && option === selected && option !== current.correct_answer
                        ? "bg-red-200 text-red-700"
                        : selected === option
                          ? "bg-primary text-white"
                          : "bg-primary/10 text-primary"
                  }`}>
                    {letter}
                  </span>
                  <span className="text-sm font-medium flex-1">{option}</span>
                  {revealed && option === current.correct_answer && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                  )}
                  {revealed && option === selected && option !== current.correct_answer && (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border mb-4 ${isCorrect ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700" : "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700"}`}
            >
              <p className={`text-xs font-semibold mb-1 ${isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                {isCorrect ? "Correct!" : "Not quite"}
              </p>
              <p className="text-sm text-foreground/80">{current?.explanation}</p>
            </motion.div>
          )}

          {/* Action button */}
          {!revealed ? (
            <Button
              onClick={handleReveal}
              disabled={!selected}
              className="w-full h-11 rounded-xl bg-primary hover:bg-[#6d28d9] text-white font-semibold shadow-md shadow-primary/25 disabled:opacity-50 cursor-pointer"
            >
              Check Answer
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-primary hover:bg-[#6d28d9] text-white font-semibold shadow-md shadow-primary/25 gap-2 cursor-pointer"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLast ? (
                "Finish Quiz"
              ) : (
                <>Next <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
