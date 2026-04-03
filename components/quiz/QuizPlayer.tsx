"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, ArrowRight, Zap, Trophy, RotateCcw, SkipForward, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  /** Optional per-question timer in seconds. If not provided, no timer is shown. */
  timerSeconds?: number;
}

type Phase = "quiz" | "review" | "results";

export default function QuizPlayer({
  quizId,
  questions,
  moduleTitle,
  courseId,
  xpReward,
  isRetake = false,
  timerSeconds = 30,
}: Props) {
  const [phase, setPhase] = useState<Phase>("quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Server result for display
  const [serverResult, setServerResult] = useState<{
    score: number; total: number; passed: boolean; xpAwarded: number; isRetake: boolean
  } | null>(null);

  const current = questions[currentIndex];
  const isCorrect = selected === current?.correct_answer;
  const isLast = currentIndex === questions.length - 1;

  // ── Timer ─────────────────────────────────────────────────────────────────
  function resetTimer() {
    setTimeLeft(timerSeconds);
  }

  useEffect(() => {
    if (phase !== "quiz" || revealed) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up — auto-skip this question
          handleSkip();
          return timerSeconds;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex, revealed]);

  function handleSelect(option: string) {
    if (revealed) return;
    setSelected(option);
  }

  function handleReveal() {
    if (!selected) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setRevealed(true);
    setAnswers((prev) => ({ ...prev, [current.id]: selected }));
  }

  function handleSkip() {
    if (timerRef.current) clearInterval(timerRef.current);
    setSkipped((prev) => new Set([...prev, current.id]));
    // Record blank answer for skipped
    setAnswers((prev) => ({ ...prev, [current.id]: "" }));
    if (isLast) {
      submitQuiz({ ...answers, [current.id]: "" });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      resetTimer();
    }
  }

  async function handleNext() {
    if (isLast) {
      await submitQuiz({ ...answers, [current.id]: selected ?? "" });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      resetTimer();
    }
  }

  // Keyboard shortcuts: Enter = check/next, 1-4 = select option, S = skip
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase !== "quiz") return;
    if (e.key === "Enter") {
      if (!revealed && selected) handleReveal();
      else if (revealed && !submitting) handleNext();
    }
    if ((e.key === "s" || e.key === "S") && !revealed) {
      handleSkip();
    }
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

  async function submitQuiz(finalAnswers: Record<string, string>) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers: finalAnswers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save quiz result");

      const result = data as { score: number; total: number; passed: boolean; xpAwarded: number; isRetake: boolean };
      setServerResult(result);

      if (!result.isRetake && result.xpAwarded > 0) {
        toast.success(`+${result.xpAwarded} XP earned!`);
      } else if (result.isRetake) {
        toast.success(result.passed ? "Quiz passed! 🎉" : "Keep practicing!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save quiz result");
    } finally {
      setSubmitting(false);
      setPhase("results");
    }
  }

  // ── Review phase (after results, user clicks "Review Answers") ────────────
  if (phase === "review") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto px-4 py-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-xl font-bold text-foreground">Answer Review</h2>
          <button
            onClick={() => setPhase("results")}
            className="ml-auto text-xs text-primary hover:underline cursor-pointer"
          >
            ← Back to results
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => {
            const userAnswer = answers[q.id];
            const wasSkipped = skipped.has(q.id);
            const correct = userAnswer === q.correct_answer;

            return (
              <div
                key={q.id}
                className={`rounded-2xl border p-4 ${
                  wasSkipped
                    ? "border-primary/15 bg-primary/3"
                    : correct
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
                    : "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {wasSkipped ? (
                    <SkipForward className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  ) : correct ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="font-medium text-sm text-foreground">Q{i + 1}: {q.question}</p>
                </div>
                {!wasSkipped && !correct && (
                  <p className="text-xs text-muted-foreground mb-1 ml-6">Your answer: <span className="text-red-600 font-medium">{userAnswer || "—"}</span></p>
                )}
                <p className="text-xs ml-6 mb-1">
                  <span className="text-muted-foreground">Correct: </span>
                  <span className="text-emerald-700 font-medium">{q.correct_answer}</span>
                </p>
                {q.explanation && (
                  <p className="text-xs text-foreground/70 ml-6 mt-1 italic">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        <Link href={`/courses/${courseId}`} className="block mt-6">
          <Button className="w-full h-11 rounded-xl bg-primary hover:bg-[#6d28d9] text-white font-semibold shadow-md shadow-primary/25 cursor-pointer">
            Back to Course
          </Button>
        </Link>
      </motion.div>
    );
  }

  // ── Results phase ─────────────────────────────────────────────────────────
  if (phase === "results") {
    const displayScore = serverResult?.score ?? questions.filter((q) => answers[q.id] === q.correct_answer).length;
    const displayTotal = serverResult?.total ?? questions.length;
    const displayPassed = serverResult?.passed ?? displayScore >= Math.ceil(displayTotal * 0.6);
    const displayPct = Math.round((displayScore / displayTotal) * 100);
    const displayXp = serverResult?.xpAwarded ?? (displayPassed ? xpReward : Math.floor(xpReward * 0.25));
    const skippedCount = skipped.size;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto px-4 py-12 text-center"
      >
        <div className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center ${displayPassed ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
          {displayPassed ? (
            <Trophy className="w-10 h-10 text-emerald-600" />
          ) : (
            <RotateCcw className="w-10 h-10 text-amber-600" />
          )}
        </div>

        <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2">
          {displayPassed ? "Quiz Passed!" : "Keep Practicing"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {displayPassed ? "Great job! You've mastered this module." : "You need 60% to pass. Review the lessons and try again."}
        </p>

        <div className="glass-card rounded-3xl p-6 border border-primary/10 mb-4">
          <div className="text-5xl font-extrabold font-heading mb-1" style={{ color: displayPassed ? "#10b981" : "#f59e0b" }}>
            {displayPct}%
          </div>
          <p className="text-muted-foreground text-sm mb-1">
            {displayScore}/{displayTotal} correct
          </p>
          {skippedCount > 0 && (
            <p className="text-xs text-muted-foreground mb-3">{skippedCount} skipped</p>
          )}

          <div className="h-2.5 bg-primary/10 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-700 ${displayPassed ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${displayPct}%` }}
            />
          </div>

          {!isRetake && (
            <div className="flex items-center justify-center gap-2 text-amber-600 font-semibold">
              <Zap className="w-4 h-4" />
              +{displayXp} XP earned
            </div>
          )}
        </div>

        {/* Review answers button */}
        <button
          onClick={() => setPhase("review")}
          className="w-full mb-3 h-10 rounded-xl border border-primary/20 text-primary text-sm font-medium hover:bg-primary/5 transition-colors cursor-pointer"
        >
          Review Answers
        </button>

        <Link href={`/courses/${courseId}`}>
          <Button className="w-full h-11 rounded-xl bg-primary hover:bg-[#6d28d9] text-white font-semibold shadow-md shadow-primary/25 cursor-pointer">
            Back to Course
          </Button>
        </Link>
      </motion.div>
    );
  }

  // ── Quiz phase ─────────────────────────────────────────────────────────────
  const timerPct = (timeLeft / timerSeconds) * 100;
  const timerColor = timerPct > 50 ? "bg-emerald-500" : timerPct > 25 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-1">Module Quiz · {moduleTitle}</p>
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-foreground">
            Question {currentIndex + 1} of {questions.length}
          </h1>
          <div className="flex items-center gap-3">
            {/* Timer */}
            {!revealed && (
              <span className={`flex items-center gap-1 text-xs font-medium tabular-nums ${timeLeft <= 5 ? "text-red-500" : "text-muted-foreground"}`}>
                <Clock className="w-3.5 h-3.5" />
                {timeLeft}s
              </span>
            )}
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> {xpReward} XP
            </span>
          </div>
        </div>
        {/* Timer bar */}
        {!revealed && (
          <div className="h-1 bg-primary/10 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        )}
        {/* Progress bar */}
        <div className="h-1.5 bg-primary/10 rounded-full mt-1.5 overflow-hidden">
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

          {/* Action buttons */}
          <div className="flex gap-2">
            {!revealed && (
              <button
                type="button"
                onClick={handleSkip}
                className="flex items-center gap-1.5 px-4 h-11 rounded-xl border border-primary/15 text-muted-foreground text-sm font-medium hover:bg-primary/5 hover:text-foreground transition-colors cursor-pointer flex-shrink-0"
                title="Skip (S)"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
            )}
            {!revealed ? (
              <Button
                onClick={handleReveal}
                disabled={!selected}
                className="flex-1 h-11 rounded-xl bg-primary hover:bg-[#6d28d9] text-white font-semibold shadow-md shadow-primary/25 disabled:opacity-50 cursor-pointer"
              >
                Check Answer
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={submitting}
                className="flex-1 h-11 rounded-xl bg-primary hover:bg-[#6d28d9] text-white font-semibold shadow-md shadow-primary/25 gap-2 cursor-pointer"
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
          </div>

          {/* Keyboard hint */}
          <p className="text-xs text-muted-foreground text-center mt-3">
            Press <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">1–{Math.min(4, current?.options_json?.length ?? 4)}</kbd> to select · <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">Enter</kbd> to confirm · <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">S</kbd> to skip
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
