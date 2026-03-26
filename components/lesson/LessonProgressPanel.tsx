"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, List, X, ChevronRight } from "lucide-react";
import Link from "next/link";

export interface LessonNavItem {
  id: string;
  title: string;
  completed: boolean;
  moduleTitle: string;
  moduleIndex: number;
}

interface Props {
  lessons: LessonNavItem[];
  currentLessonId: string;
  courseId: string;
}

export default function LessonProgressPanel({ lessons, currentLessonId, courseId }: Props) {
  const [open, setOpen] = useState(false);

  const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
  const completedCount = lessons.filter((l) => l.completed).length;

  // Group lessons by module
  const moduleGroups: { title: string; lessons: LessonNavItem[] }[] = [];
  for (const lesson of lessons) {
    const existing = moduleGroups.find((g) => g.title === lesson.moduleTitle);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      moduleGroups.push({ title: lesson.moduleTitle, lessons: [lesson] });
    }
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed right-0 top-16 bottom-0 w-72 border-l border-primary/8 bg-card/80 backdrop-blur-sm overflow-y-auto z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Course Progress
            </span>
            <span className="text-xs font-bold text-primary">
              {completedCount}/{lessons.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-primary/10 rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0}%` }}
            />
          </div>

          {moduleGroups.map((group, gi) => (
            <div key={gi} className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.lessons.map((lesson) => {
                  const isCurrent = lesson.id === currentLessonId;
                  return (
                    <Link
                      key={lesson.id}
                      href={`/courses/${courseId}/lesson/${lesson.id}`}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-primary/5 text-foreground/70"
                      }`}
                    >
                      {lesson.completed ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      ) : isCurrent ? (
                        <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-primary/25 flex-shrink-0" />
                      )}
                      <span className="truncate text-xs">{lesson.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile floating button + sheet */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center cursor-pointer hover:bg-[#6d28d9] transition-colors"
          aria-label="Show lesson progress"
        >
          <List className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-[10px] font-bold text-white flex items-center justify-center">
            {currentIndex + 1}
          </span>
        </button>

        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 bg-black/40 z-40"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[70vh] overflow-y-auto shadow-2xl"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-heading font-bold text-foreground">Lesson Progress</h3>
                      <p className="text-xs text-muted-foreground">
                        {completedCount} of {lessons.length} completed
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="w-8 h-8 rounded-lg hover:bg-primary/5 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {moduleGroups.map((group, gi) => (
                    <div key={gi} className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        {group.title}
                      </p>
                      <div className="space-y-1">
                        {group.lessons.map((lesson) => {
                          const isCurrent = lesson.id === currentLessonId;
                          return (
                            <Link
                              key={lesson.id}
                              href={`/courses/${courseId}/lesson/${lesson.id}`}
                              onClick={() => setOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                                isCurrent
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "hover:bg-primary/5 text-foreground/70"
                              }`}
                            >
                              {lesson.completed ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              ) : isCurrent ? (
                                <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-primary/20 flex-shrink-0" />
                              )}
                              <span className="truncate">{lesson.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
