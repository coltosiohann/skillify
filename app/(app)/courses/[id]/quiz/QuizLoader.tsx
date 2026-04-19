"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, CheckCircle, XCircle, RotateCcw, Zap, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import QuizPlayer from "@/components/quiz/QuizPlayer";

interface Question {
  id: string;
  question: string;
  options_json: string[];
  correct_answer: string;
  explanation: string;
  order_index: number;
}

interface ExistingAttempt {
  score: number;
  passed: boolean;
  xp_awarded: number;
  answers_json: Record<string, string>;
}

interface Props {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  courseTitle: string;
  userId: string;
  existingAttempt: ExistingAttempt | null;
}

export default function QuizLoader({ courseId, moduleId, moduleTitle, courseTitle, userId, existingAttempt }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [retaking, setRetaking] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, moduleId }),
      });
      const data = await res.json();
      if (res.status === 429) throw new Error("AI is busy — please try again in a moment.");
      if (res.status === 503) throw new Error("AI service is temporarily unavailable. Try again in 30 seconds.");
      if (!res.ok) throw new Error(data.error ?? "Failed to generate quiz. Please try again.");
      setQuizId(data.quizId);
      setQuestions(data.questions);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Check your connection and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, moduleId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
        >
          <Brain className="w-6 h-6 text-primary" />
        </motion.div>
        <p className="font-semibold text-foreground mb-1">Generating your quiz…</p>
        <p className="text-sm text-muted-foreground">AI is creating questions based on your lessons</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="font-heading font-bold text-foreground mb-2">Quiz generation failed</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">{error}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={load} className="rounded-xl bg-primary text-white hover:bg-[#4338CA] gap-2 cursor-pointer">
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
          <Link href={`/courses/${courseId}`}>
            <Button variant="outline" className="rounded-xl cursor-pointer">Back to Course</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show previous result if already attempted and not retaking
  if (existingAttempt && !retaking) {
    const scorePct = questions.length > 0
      ? Math.round((existingAttempt.score / questions.length) * 100)
      : 0;

    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {courseTitle}
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className={`w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center ${existingAttempt.passed ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
            {existingAttempt.passed
              ? <CheckCircle className="w-10 h-10 text-emerald-600" />
              : <XCircle className="w-10 h-10 text-amber-600" />}
          </div>

          <h2 className="font-heading text-2xl font-extrabold text-foreground mb-1">
            {existingAttempt.passed ? "Quiz Completed!" : "Quiz Attempted"}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {moduleTitle}
          </p>

          <div className="glass-card rounded-3xl p-6 border border-primary/10 mb-6">
            <div className={`text-5xl font-extrabold font-heading mb-1 ${existingAttempt.passed ? "text-emerald-600" : "text-amber-600"}`}>
              {scorePct}%
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {existingAttempt.score}/{questions.length} correct
            </p>
            <div className="h-2.5 bg-primary/10 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-700 ${existingAttempt.passed ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${scorePct}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-amber-600 font-semibold text-sm">
              <Zap className="w-4 h-4" />
              {existingAttempt.xp_awarded} XP earned
            </div>
          </div>

          {/* Per-question breakdown */}
          {questions.length > 0 && (
            <div className="space-y-2 text-left mb-6">
              {questions.map((q, i) => {
                const userAnswer = existingAttempt.answers_json?.[q.id];
                const correct = userAnswer === q.correct_answer;
                return (
                  <div
                    key={q.id}
                    className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${correct ? "border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30" : "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/30"}`}
                  >
                    {correct ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${correct ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}>
                        Q{i + 1}: {q.question}
                      </p>
                      {!correct && (
                        <p className="text-xs text-muted-foreground mt-0.5">Correct: {q.correct_answer}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3">
            <Link href={`/courses/${courseId}`} className="flex-1">
              <Button variant="outline" className="w-full rounded-xl border-primary/15 cursor-pointer">
                Back to Course
              </Button>
            </Link>
            <Button
              onClick={() => setRetaking(true)}
              className="flex-1 rounded-xl bg-primary hover:bg-[#4338CA] text-white shadow-md shadow-primary/25 gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Retake
            </Button>
          </div>

          {!existingAttempt.passed && (
            <p className="text-xs text-muted-foreground mt-3">Retake to improve your score. XP awarded on first pass only.</p>
          )}
          {existingAttempt.passed && (
            <p className="text-xs text-muted-foreground mt-3">Retaking won't award additional XP.</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-xl mx-auto px-4 pt-6">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {courseTitle}
        </Link>
      </div>
      <QuizPlayer
        quizId={quizId!}
        questions={questions}
        moduleTitle={moduleTitle}
        courseId={courseId}
        userId={userId}
        xpReward={existingAttempt ? 0 : 150}
        isRetake={!!existingAttempt}
      />
    </div>
  );
}
