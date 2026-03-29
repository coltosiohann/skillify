"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  Target,
  Brain,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Lesson {
  id: string;
  title: string;
  order_index: number;
  xp_reward: number;
  content_markdown: string;
  estimated_minutes: number;
  difficulty: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  duration_days: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  domain: string;
  detected_level: string;
  duration_weeks: number;
  minutes_per_day: number;
  learning_style: string;
  status: string;
}

interface Props {
  course: Course;
  modules: Module[];
  completedLessonIds: Set<string>;
  quizAttempts: Record<string, { quizId: string; passed: boolean; score: number }>;
}

const levelColors: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  intermediate: "bg-blue-100 text-blue-700 border-blue-200",
  advanced: "bg-violet-100 text-violet-700 border-violet-200",
};

const difficultyBadge: Record<string, string> = {
  easy: "text-emerald-600",
  standard: "text-blue-600",
  challenging: "text-violet-600",
};

export default function CourseView({
  course,
  modules,
  completedLessonIds,
  quizAttempts = {},
}: Props) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map((m) => m.id))
  );

  const allLessons = modules.flatMap((m) => m.lessons ?? []);
  const completedCount = allLessons.filter((l) =>
    completedLessonIds.has(l.id)
  ).length;
  const progressPct =
    allLessons.length > 0
      ? Math.round((completedCount / allLessons.length) * 100)
      : 0;
  const totalXP = allLessons.reduce((sum, l) => sum + (l.xp_reward ?? 50), 0);
  const totalMinutes = allLessons.reduce(
    (sum, l) => sum + (l.estimated_minutes ?? 5),
    0
  );
  const remainingMinutes = allLessons
    .filter((l) => !completedLessonIds.has(l.id))
    .reduce((sum, l) => sum + (l.estimated_minutes ?? 5), 0);

  // Find first incomplete lesson for "Continue Learning"
  const sortedLessons = modules
    .sort((a, b) => a.order_index - b.order_index)
    .flatMap((m) =>
      (m.lessons ?? [])
        .sort((a, b) => a.order_index - b.order_index)
        .map((l) => ({ ...l, moduleId: m.id }))
    );
  const firstIncomplete = sortedLessons.find(
    (l) => !completedLessonIds.has(l.id)
  );

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back + Edit row */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <Link href={`/courses/${course.id}/edit`}>
          <Button variant="outline" size="sm" className="rounded-xl border-primary/15 gap-1.5 cursor-pointer text-xs">
            <Pencil className="w-3.5 h-3.5" />
            Edit Course
          </Button>
        </Link>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-[#4c1d95] rounded-3xl p-7 mb-6 text-white shadow-xl shadow-primary/25"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-white/60 text-sm font-medium mb-1">
              {course.domain}
            </p>
            <h1 className="font-heading text-2xl font-extrabold leading-tight">
              {course.title}
            </h1>
          </div>
          <Badge
            className={`capitalize border ${
              levelColors[course.detected_level] ?? ""
            } flex-shrink-0`}
          >
            {course.detected_level}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mb-5 text-sm">
          <div className="flex items-center gap-1.5 text-white/70">
            <BookOpen className="w-4 h-4" />
            {modules.length} modules · {allLessons.length} lessons
          </div>
          <div className="flex items-center gap-1.5 text-white/70">
            <Clock className="w-4 h-4" />
            {remainingMinutes > 0
              ? `~${remainingMinutes} min remaining`
              : `${totalMinutes} min total`}
          </div>
          <div className="flex items-center gap-1.5 text-amber-300">
            <Zap className="w-4 h-4" />
            {totalXP.toLocaleString()} total XP
          </div>
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-white/70">Progress</span>
            <span className="font-bold">
              {completedCount}/{allLessons.length} lessons · {progressPct}%
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Continue Learning button */}
        {firstIncomplete && (
          <Link href={`/courses/${course.id}/lesson/${firstIncomplete.id}`}>
            <Button className="bg-white text-primary hover:bg-white/90 font-semibold rounded-xl gap-2 shadow-md cursor-pointer">
              {completedCount > 0 ? "Continue Learning" : "Start Learning"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
        {!firstIncomplete && allLessons.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <CheckCircle className="w-5 h-5" />
              Course completed!
            </div>
            <Link href={`/courses/${course.id}/certificate`}>
              <Button className="bg-amber-400 hover:bg-amber-300 text-amber-900 font-semibold rounded-xl gap-2 shadow-md cursor-pointer text-sm">
                🏆 View Certificate
              </Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Modules */}
      <div className="space-y-3">
        {modules
          .sort((a, b) => a.order_index - b.order_index)
          .map((mod, modIndex) => {
            const lessons = (mod.lessons ?? []).sort(
              (a, b) => a.order_index - b.order_index
            );
            const modCompleted = lessons.filter((l) =>
              completedLessonIds.has(l.id)
            ).length;
            const isExpanded = expandedModules.has(mod.id);
            const modMinutes = lessons.reduce(
              (s, l) => s + (l.estimated_minutes ?? 5),
              0
            );

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: modIndex * 0.05 }}
                className="glass-card rounded-2xl overflow-hidden border border-primary/10 transition-all"
              >
                {/* Module header */}
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-primary/3 cursor-pointer"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      modCompleted === lessons.length && lessons.length > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {modCompleted === lessons.length && lessons.length > 0 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      modIndex + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {mod.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {modCompleted}/{lessons.length} lessons · ~{modMinutes} min
                    </p>
                  </div>

                  {/* Mini progress bar */}
                  {lessons.length > 0 && (
                    <div className="w-16 h-1.5 bg-primary/10 rounded-full overflow-hidden flex-shrink-0 hidden sm:block">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{
                          width: `${(modCompleted / lessons.length) * 100}%`,
                        }}
                      />
                    </div>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                {/* Quiz status — visible when module is fully complete */}
                {modCompleted === lessons.length && lessons.length > 0 && isExpanded && (() => {
                  const attempt = quizAttempts[mod.id];
                  if (attempt?.passed) {
                    return (
                      <div className="px-5 py-3 border-t border-emerald-100 bg-emerald-50/60 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                          <CheckCircle className="w-4 h-4" />
                          Quiz Passed · {attempt.score}/5 correct
                        </div>
                        <Link href={`/courses/${course.id}/quiz?moduleId=${mod.id}`} className="text-xs text-emerald-600 hover:underline cursor-pointer">
                          Retake
                        </Link>
                      </div>
                    );
                  }
                  if (attempt && !attempt.passed) {
                    return (
                      <div className="px-5 py-3 border-t border-amber-100 bg-amber-50/60 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                          <Brain className="w-4 h-4" />
                          Quiz not passed yet
                        </div>
                        <Link href={`/courses/${course.id}/quiz?moduleId=${mod.id}`}>
                          <button type="button" className="text-xs font-semibold text-primary hover:text-[#6d28d9] transition-colors cursor-pointer">
                            Retake Quiz
                          </button>
                        </Link>
                      </div>
                    );
                  }
                  return (
                    <div className="px-5 py-3 border-t border-primary/8 bg-primary/3">
                      <Link href={`/courses/${course.id}/quiz?moduleId=${mod.id}`}>
                        <button type="button" className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-[#6d28d9] transition-colors cursor-pointer">
                          <Brain className="w-4 h-4" />
                          Take Module Quiz · +150 XP
                        </button>
                      </Link>
                    </div>
                  );
                })()}

                {/* Lessons */}
                {isExpanded && (
                  <div className="border-t border-primary/8">
                    {lessons.map((lesson, lessonIndex) => {
                      const done = completedLessonIds.has(lesson.id);
                      return (
                        <Link
                          key={lesson.id}
                          href={`/courses/${course.id}/lesson/${lesson.id}`}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-primary/3 transition-colors border-b border-primary/5 last:border-0 cursor-pointer group"
                        >
                          {done ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-primary/30 flex-shrink-0 group-hover:text-primary/60 transition-colors" />
                          )}
                          <span
                            className={`flex-1 text-sm ${
                              done
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {lessonIndex + 1}. {lesson.title}
                          </span>

                          {/* Difficulty indicator */}
                          {lesson.difficulty &&
                            lesson.difficulty !== "standard" && (
                              <Target
                                className={`w-3 h-3 flex-shrink-0 ${
                                  difficultyBadge[lesson.difficulty] ?? ""
                                }`}
                              />
                            )}

                          {/* Time */}
                          {lesson.estimated_minutes > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {lesson.estimated_minutes}m
                            </span>
                          )}

                          {/* XP */}
                          <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5 flex-shrink-0">
                            <Zap className="w-3 h-3" />
                            {lesson.xp_reward}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}
