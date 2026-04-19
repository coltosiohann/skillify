"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardData } from "@/app/(app)/onboarding/page";

interface Question {
  id: number;
  question: string;
  options: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

type LoadState = "loading" | "ready" | "evaluating" | "done" | "error" | "skip";

const levelColors = {
  beginner: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-700",
    text: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  intermediate: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-700 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  },
  advanced: {
    bg: "bg-violet-50 dark:bg-violet-900/20",
    border: "border-violet-200 dark:border-violet-700",
    text: "text-violet-700 dark:text-violet-400",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  },
};

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
  onBack: () => void;
}

export default function Step3Assessment({ data, onNext, onBack }: Props) {
  const [state, setState] = useState<LoadState>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<{ level: "beginner" | "intermediate" | "advanced"; summary: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/ai/assess?domain=${encodeURIComponent(data.domain)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load questions");
        setQuestions(json.questions ?? []);
        setState("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load questions");
        setState("error");
      }
    }
    fetchQuestions();
  }, [data.domain]);

  async function handleAnswer(option: string) {
    const newAnswers = { ...answers, [questions[current].id]: option };
    setAnswers(newAnswers);

    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      // All answered — evaluate
      setState("evaluating");
      try {
        const res = await fetch("/api/ai/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: data.domain, questions, answers: newAnswers }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Evaluation failed");
        setResult({ level: json.level, summary: json.summary });
        setState("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Evaluation failed");
        setState("error");
      }
    }
  }

  function handleSkip() {
    onNext({ detectedLevel: "beginner" });
  }

  function handleContinue() {
    onNext({ detectedLevel: result?.level ?? "beginner" });
  }

  const q = questions[current];

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
          What&apos;s your{" "}
          <span className="text-gradient">current level?</span>
        </h1>
        <p className="text-muted-foreground">
          A quick quiz helps us personalize your course perfectly.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-8 shadow-xl shadow-primary/10">
        {/* Loading */}
        {state === "loading" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">
              Generating questions for <span className="font-semibold text-foreground">{data.domain}</span>...
            </p>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground mb-1">Couldn&apos;t load questions</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Add your ANTHROPIC_API_KEY or OPENAI_API_KEY to .env.local
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={onBack} className="gap-2 rounded-xl border-primary/15 cursor-pointer flex-1">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={handleSkip} className="rounded-xl bg-primary text-white hover:bg-[#4338CA] cursor-pointer flex-1">
                Skip — I&apos;ll start as Beginner
              </Button>
            </div>
          </div>
        )}

        {/* Quiz */}
        {state === "ready" && q && (
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-muted-foreground">
                  Question {current + 1} of {questions.length}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  q.difficulty === "beginner"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                    : q.difficulty === "intermediate"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
                }`}>
                  {q.difficulty}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-primary/10 rounded-full mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: `${(current / questions.length) * 100}%` }}
                  animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              <p className="font-semibold text-foreground text-lg mb-5">{q.question}</p>

              <div className="flex flex-col gap-2.5">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAnswer(opt)}
                    className="w-full text-left px-4 py-3.5 rounded-xl border border-primary/15 hover:border-primary hover:bg-primary/5 transition-all duration-150 text-sm font-medium text-foreground cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={current === 0 ? onBack : () => setCurrent((c) => c - 1)}
                  className="gap-2 rounded-xl border-primary/15 hover:bg-primary/5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="rounded-xl border-primary/15 hover:bg-primary/5 cursor-pointer flex-1 text-muted-foreground"
                >
                  Skip quiz
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Evaluating */}
        {state === "evaluating" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Analyzing your answers...</p>
          </div>
        )}

        {/* Result */}
        {state === "done" && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className={`flex flex-col items-center gap-4 p-6 rounded-2xl border ${levelColors[result.level].bg} ${levelColors[result.level].border} mb-6`}>
              <CheckCircle className={`w-10 h-10 ${levelColors[result.level].text}`} />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/70 mb-1">Your level</p>
                <p className={`text-3xl font-extrabold font-heading capitalize ${levelColors[result.level].text}`}>
                  {result.level}
                </p>
                <p className={`text-sm mt-2 ${levelColors[result.level].text} opacity-80`}>
                  {result.summary}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setState("ready"); setCurrent(0); setAnswers({}); setResult(null); }}
                className="gap-2 rounded-xl border-primary/15 hover:bg-primary/5 cursor-pointer"
              >
                Retake
              </Button>
              <Button
                onClick={handleContinue}
                className="gap-2 rounded-xl bg-primary text-white hover:bg-[#4338CA] shadow-md shadow-primary/25 cursor-pointer flex-1"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
