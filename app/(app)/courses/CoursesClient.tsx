"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen, PlusCircle, Search, Clock, Zap, CheckCircle,
  Circle, MoreHorizontal, ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Lesson { id: string }
interface Module { id: string; lessons: Lesson[] }
interface Course {
  id: string;
  title: string;
  domain: string;
  detected_level: string;
  status: string;
  duration_weeks: number;
  minutes_per_day: number;
  learning_style: string;
  created_at: string;
  modules: Module[];
}

interface Props {
  courses: Course[];
  completedLessonIds: string[];
}

const levelColors: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  intermediate: "bg-blue-100 text-blue-700 border-blue-200",
  advanced: "bg-violet-100 text-violet-700 border-violet-200",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  generating: { label: "Generating", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-600" },
  paused: { label: "Paused", color: "bg-orange-100 text-orange-700" },
};

const FILTERS = ["All", "Active", "Completed", "Paused"] as const;
type Filter = typeof FILTERS[number];

export default function CoursesClient({ courses, completedLessonIds }: Props) {
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const completedSet = new Set(completedLessonIds);

  const filtered = courses.filter((c) => {
    const matchFilter =
      filter === "All" ||
      (filter === "Active" && (c.status === "active" || c.status === "generating")) ||
      (filter === "Completed" && c.status === "completed") ||
      (filter === "Paused" && c.status === "paused");
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.domain.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-foreground">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{courses.length} course{courses.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link href="/onboarding">
          <Button className="gap-2 rounded-xl bg-primary hover:bg-[#6d28d9] text-white shadow-md shadow-primary/25 cursor-pointer">
            <PlusCircle className="w-4 h-4" />
            New Course
          </Button>
        </Link>
      </motion.div>

      {/* Filters + Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                filter === f
                  ? "bg-primary text-white shadow-sm shadow-primary/25"
                  : "bg-primary/8 text-primary hover:bg-primary/15"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl bg-muted border-0 focus-visible:ring-primary/20 text-sm w-full sm:w-56"
          />
        </div>
      </motion.div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-heading font-bold text-lg text-foreground mb-2">
            {search ? "No courses found" : "No courses yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {search ? "Try a different search term." : "Create your first AI-generated course to get started."}
          </p>
          {!search && (
            <Link href="/onboarding">
              <Button className="gap-2 rounded-xl bg-primary hover:bg-[#6d28d9] text-white cursor-pointer">
                <PlusCircle className="w-4 h-4" /> Create First Course
              </Button>
            </Link>
          )}
        </motion.div>
      )}

      {/* Course grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((course, i) => {
          const allLessons = course.modules.flatMap((m) => m.lessons ?? []);
          const completedCount = allLessons.filter((l) => completedSet.has(l.id)).length;
          const total = allLessons.length;
          const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
          const status = statusConfig[course.status] ?? statusConfig.active;

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/courses/${course.id}`} className="block group cursor-pointer">
                <div className="glass-card rounded-2xl p-5 border border-primary/10 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/8 transition-all">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{course.domain}</p>
                      <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <Badge className={`text-xs capitalize border ${levelColors[course.detected_level] ?? ""}`}>
                        {course.detected_level}
                      </Badge>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{completedCount}/{total} lessons</span>
                      <span className="font-medium text-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: pct === 100 ? "#10b981" : "var(--primary)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.duration_weeks}w · {course.minutes_per_day}min/day
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {course.modules.length} modules
                    </span>
                    {pct === 100 && (
                      <span className="ml-auto flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle className="w-3 h-3" /> Done
                      </span>
                    )}
                    {pct < 100 && (
                      <span className="ml-auto flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                        Continue <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
