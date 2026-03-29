"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, Zap, Flame, PlusCircle, ArrowRight, Clock, Star, Play, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentLevel, getLevelProgress } from "@/lib/levels";
import OnboardingTour from "@/components/app/OnboardingTour";

interface Lesson { id: string; order_index: number }
interface Module { id: string; order_index: number; lessons: Lesson[] }
interface Course {
  id: string;
  title: string;
  domain: string;
  detected_level: string;
  status: string;
  duration_weeks: number;
  created_at: string;
  modules: Module[];
}

interface Profile {
  full_name: string | null;
  plan: string;
  total_xp: number;
  current_streak: number;
  courses_generated_this_month: number;
}

const levelColor: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  advanced: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

const statusColor: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  generating: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  completed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  paused: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

// Domain → emoji map for course cards (#23)
function domainIcon(domain: string): string {
  const d = domain.toLowerCase();
  if (/python|javascript|typescript|coding|program|software|web|react|node|dev/.test(d)) return "💻";
  if (/design|ui|ux|figma|graphic|art|creative|illustration/.test(d)) return "🎨";
  if (/fitness|workout|gym|sport|run|yoga|health/.test(d)) return "💪";
  if (/music|guitar|piano|drum|sing|audio/.test(d)) return "🎵";
  if (/language|spanish|french|german|japanese|chinese|english/.test(d)) return "🌍";
  if (/math|calculus|algebra|statistics|physics/.test(d)) return "📐";
  if (/cooking|food|chef|recipe|baking/.test(d)) return "🍳";
  if (/business|marketing|finance|startup|entrepreneur/.test(d)) return "📈";
  if (/science|biology|chemistry|anatomy/.test(d)) return "🔬";
  if (/history|geography|social/.test(d)) return "🏛️";
  if (/photo|video|film/.test(d)) return "📸";
  return "📚";
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const, delay },
});

export default function DashboardClient({
  profile,
  emailFallback,
  courses,
  completedLessonIds,
  weeklyXp,
  weeklyGoal,
  totalMinutesLearned,
}: {
  profile: Profile | null;
  emailFallback: string;
  courses: Course[];
  completedLessonIds: string[];
  weeklyXp: number;
  weeklyGoal: number;
  totalMinutesLearned: number;
}) {
  const completedSet = new Set(completedLessonIds);
  const firstName = profile?.full_name?.split(" ")[0] ?? emailFallback;
  const xp = profile?.total_xp ?? 0;
  const streak = profile?.current_streak ?? 0;
  const activeCourses = courses.filter((c) => c.status === "active" || c.status === "generating");

  // #6 — use shared level system
  const currentLevel = getCurrentLevel(xp);
  const { pct: levelPct, xpInLevel, xpNeeded } = getLevelProgress(xp);

  // #17 — find next incomplete lesson across all active courses
  const nextLesson = (() => {
    for (const course of courses) {
      if (course.status !== "active") continue;
      const sorted = [...(course.modules ?? [])]
        .sort((a, b) => a.order_index - b.order_index)
        .flatMap((m) =>
          [...(m.lessons ?? [])].sort((a, b) => a.order_index - b.order_index)
        );
      const incomplete = sorted.find((l) => !completedSet.has(l.id));
      if (incomplete) return { lessonId: incomplete.id, courseId: course.id, courseTitle: course.title };
    }
    return null;
  })();

  const totalMinutes = totalMinutesLearned;
  const timeLabel = totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    : `${totalMinutes}m`;

  const stats = [
    { label: "Total XP", value: xp.toLocaleString(), sub: "experience points", icon: Zap, color: "bg-primary/10 text-primary" },
    { label: "Current Streak", value: `${streak} days`, sub: streak > 0 ? "Keep it up!" : "Start today!", icon: Flame, color: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" },
    { label: "Time Learned", value: timeLabel, sub: "total study time", icon: Timer, color: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400" },
    { label: "Completed", value: courses.filter((c) => c.status === "completed").length.toString(), sub: "courses finished", icon: Star, color: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <OnboardingTour />
      {/* Greeting */}
      <motion.div {...fadeUp(0)} data-tour="dashboard-greeting">
        <h1 className="font-heading text-3xl font-extrabold text-foreground mb-1">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground">
          {streak > 0
            ? `You're on a ${streak}-day streak. Keep it up!`
            : "Ready to learn something new today?"}
        </p>
      </motion.div>

      {/* #17 — Continue where you left off */}
      {nextLesson && (
        <motion.div {...fadeUp(0.05)}>
          <Link href={`/courses/${nextLesson.courseId}/lesson/${nextLesson.lessonId}`}>
            <div className="bg-gradient-to-r from-primary to-violet-600 rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 cursor-pointer group">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 font-medium mb-0.5">Continue Learning</p>
                <p className="text-sm font-semibold text-white truncate">{nextLesson.courseTitle}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-tour="dashboard-stats">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeUp(0.05 + i * 0.07)}>
            <div className="bg-card rounded-2xl border border-primary/8 p-5 shadow-sm hover:shadow-md hover:shadow-primary/6 transition-all duration-200">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="font-heading font-extrabold text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              <p className="text-xs text-muted-foreground/60">{s.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* #6 — Fixed XP level bar using shared system + #20 Weekly XP goal */}
      <motion.div {...fadeUp(0.3)}>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Level progress */}
          <div className="bg-card rounded-2xl border border-primary/8 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-foreground text-sm">Level Progress</p>
                <p className="text-xs text-muted-foreground">{currentLevel.name}</p>
              </div>
              <span className="text-sm font-bold text-primary">
                {xpNeeded > 0 ? `${xpInLevel.toLocaleString()} / ${xpNeeded.toLocaleString()} XP` : "Max Level!"}
              </span>
            </div>
            <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${levelPct}%` }} />
            </div>
          </div>

          {/* Weekly XP goal ring */}
          <div data-tour="dashboard-weekly-goal">
            <WeeklyXpGoal weeklyXp={weeklyXp} weeklyGoal={weeklyGoal} />
          </div>
        </div>
      </motion.div>

      {/* Courses */}
      <motion.div {...fadeUp(0.35)} data-tour="dashboard-courses">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-xl text-foreground">My Courses</h2>
          <Link href="/courses">
            <Button variant="ghost" size="sm" className="text-primary gap-1 cursor-pointer">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {courses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course, i) => {
              // #9 — compute progress per course
              const allLessons = (course.modules ?? []).flatMap((m) => m.lessons ?? []);
              const completedCount = allLessons.filter((l) => completedSet.has(l.id)).length;
              const totalCount = allLessons.length;
              const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <motion.div key={course.id} {...fadeUp(0.35 + i * 0.07)}>
                  <Link href={`/courses/${course.id}`}>
                    <div className="bg-card rounded-2xl border border-primary/8 p-5 shadow-sm hover:shadow-md hover:shadow-primary/8 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full flex flex-col">
                      {/* #23 — domain icon */}
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-lg">
                        {domainIcon(course.domain)}
                      </div>
                      <div className="flex-1">
                        <p className="font-heading font-bold text-foreground text-sm leading-snug mb-2 line-clamp-2">
                          {course.title}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">{course.domain}</p>
                      </div>
                      {/* #9 — progress bar */}
                      {totalCount > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{completedCount}/{totalCount} lessons</span>
                            <span className="text-xs font-medium text-primary">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor[course.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {course.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${levelColor[course.detected_level] ?? "bg-gray-100"}`}>
                          {course.detected_level}
                        </span>
                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {course.duration_weeks}w
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}

            {/* New course card */}
            <motion.div {...fadeUp(0.35 + courses.length * 0.07)}>
              <Link href="/onboarding">
                <div className="rounded-2xl border-2 border-dashed border-primary/20 p-5 flex flex-col items-center justify-center text-center h-full min-h-[160px] hover:border-primary/40 hover:bg-primary/3 transition-all duration-200 cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center mb-3 transition-colors">
                    <PlusCircle className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-sm text-foreground mb-1">New Course</p>
                  <p className="text-xs text-muted-foreground">AI builds your path in seconds</p>
                </div>
              </Link>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Free plan banner */}
      {profile?.plan === "free" && (
        <motion.div {...fadeUp(0.5)}>
          <div className="bg-gradient-to-r from-primary/8 to-violet-100 dark:to-violet-900/20 rounded-2xl border border-primary/15 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">
                {profile.courses_generated_this_month >= 2
                  ? "You've used your 2 free courses this month."
                  : `${2 - profile.courses_generated_this_month} free course${2 - profile.courses_generated_this_month !== 1 ? "s" : ""} remaining this month.`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upgrade to Pro for unlimited courses, PDF uploads, and more.
              </p>
            </div>
            <Link href="/settings?tab=billing">
              <Button size="sm" className="rounded-full bg-primary text-white hover:bg-[#6d28d9] shadow-md shadow-primary/25 whitespace-nowrap cursor-pointer">
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function WeeklyXpGoal({ weeklyXp, weeklyGoal }: { weeklyXp: number; weeklyGoal: number }) {
  const pct = Math.min(100, Math.round((weeklyXp / weeklyGoal) * 100));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const done = pct >= 100;

  return (
    <div className="bg-card rounded-2xl border border-primary/8 p-5 shadow-sm flex items-center gap-5">
      <div className="relative flex-shrink-0">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-primary/10" />
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={done ? "text-emerald-500" : "text-primary"}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-extrabold font-heading ${done ? "text-emerald-600" : "text-primary"}`}>{pct}%</span>
        </div>
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">Weekly XP Goal</p>
        <p className="text-xs text-muted-foreground mt-0.5">{weeklyXp.toLocaleString()} / {weeklyGoal.toLocaleString()} XP this week</p>
        {done ? (
          <p className="text-xs text-emerald-600 font-medium mt-1">Goal reached! 🎉</p>
        ) : (
          <p className="text-xs text-muted-foreground/70 mt-1">{(weeklyGoal - weeklyXp).toLocaleString()} XP to go</p>
        )}
        <p className="text-xs text-muted-foreground/50 mt-1">Change goal in Settings</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/15 p-12 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <BookOpen className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-heading font-bold text-xl text-foreground mb-2">No courses yet</h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">
        Tell us what you want to learn and we&apos;ll build a personalized course in seconds.
      </p>
      <Link href="/onboarding">
        <Button className="rounded-full bg-primary text-white gap-2 hover:bg-[#6d28d9] shadow-md shadow-primary/25 cursor-pointer">
          <PlusCircle className="w-4 h-4" />
          Create Your First Course
        </Button>
      </Link>
    </div>
  );
}
