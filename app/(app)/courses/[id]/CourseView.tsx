"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Circle, Clock, Zap, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Lesson {
  id: string;
  title: string;
  order_index: number;
  xp_reward: number;
  content_markdown: string;
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
}

const levelColors: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  intermediate: "bg-blue-100 text-blue-700 border-blue-200",
  advanced: "bg-violet-100 text-violet-700 border-violet-200",
};

export default function CourseView({ course, modules, completedLessonIds }: Props) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map((m) => m.id))
  );

  const allLessons = modules.flatMap((m) => m.lessons ?? []);
  const completedCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length;
  const progressPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;
  const totalXP = allLessons.reduce((sum, l) => sum + (l.xp_reward ?? 50), 0);

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function isModuleUnlocked(_index: number) {
    return true;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-[#4c1d95] rounded-3xl p-7 mb-6 text-white shadow-xl shadow-primary/25"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-white/60 text-sm font-medium mb-1">{course.domain}</p>
            <h1 className="font-heading text-2xl font-extrabold leading-tight">{course.title}</h1>
          </div>
          <Badge className={`capitalize border ${levelColors[course.detected_level] ?? ""} flex-shrink-0`}>
            {course.detected_level}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mb-5 text-sm">
          <div className="flex items-center gap-1.5 text-white/70">
            <BookOpen className="w-4 h-4" />
            {modules.length} modules
          </div>
          <div className="flex items-center gap-1.5 text-white/70">
            <Clock className="w-4 h-4" />
            {course.duration_weeks} weeks · {course.minutes_per_day} min/day
          </div>
          <div className="flex items-center gap-1.5 text-amber-300">
            <Zap className="w-4 h-4" />
            {totalXP.toLocaleString()} total XP
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-white/70">Progress</span>
            <span className="font-bold">{completedCount}/{allLessons.length} lessons · {progressPct}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
        </div>
      </motion.div>

      {/* Modules */}
      <div className="space-y-3">
        {modules.map((mod, modIndex) => {
          const lessons = (mod.lessons ?? []).sort((a, b) => a.order_index - b.order_index);
          const modCompleted = lessons.filter((l) => completedLessonIds.has(l.id)).length;
          const isExpanded = expandedModules.has(mod.id);

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
                {/* Number badge */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                  modCompleted === lessons.length && lessons.length > 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-primary/10 text-primary"
                }`}>
                  {modCompleted === lessons.length && lessons.length > 0 ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    modIndex + 1
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{mod.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {modCompleted}/{lessons.length} lessons · Week {modIndex + 1}
                  </p>
                </div>

                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>

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
                        <span className={`flex-1 text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {lessonIndex + 1}. {lesson.title}
                        </span>
                        <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
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
