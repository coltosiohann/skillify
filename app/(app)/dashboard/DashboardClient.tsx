"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen, Zap, Flame, PlusCircle, ArrowRight, Play,
  Target, Trophy, CheckCircle2, Sparkles, ChevronRight,
  Code2, Palette, TrendingUp, Globe, Dumbbell, Music,
  Calculator, FlaskConical, Camera, GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentLevel, getLevelProgress } from "@/lib/levels";
import OnboardingTour from "@/components/app/OnboardingTour";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lesson  { id: string; order_index: number; title: string }
interface Module  { id: string; order_index: number; lessons: Lesson[] }
interface Course  {
  id: string; title: string; domain: string; detected_level: string;
  status: string; duration_weeks: number; created_at: string; modules: Module[];
}
interface Profile {
  full_name: string | null; plan: string; total_xp: number;
  current_streak: number; courses_generated_this_month: number;
}
interface ResumeCourse {
  course: Course; pct: number; completedCount: number; totalCount: number;
  nextLessonId: string | null; nextLessonTitle: string | null;
}
interface DashboardVM {
  firstName: string; greeting: string; subline: string;
  xp: number; streak: number; plan: string; coursesGeneratedThisMonth: number;
  currentLevel: ReturnType<typeof getCurrentLevel>;
  levelPct: number; xpInLevel: number; xpNeeded: number;
  weeklyXp: number; weeklyGoal: number; weeklyPct: number; goalDone: boolean;
  activeCourses: Course[]; completedCourses: Course[]; allCourses: Course[];
  nextLesson: { lessonId: string; lessonTitle: string; courseId: string; courseTitle: string; coursePct: number } | null;
  resumeCourses: ResumeCourse[]; completedSet: Set<string>; totalMinutesLearned: number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

function trackEvent(name: string, props?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", name, props);
}

// ─── Domain icon map ──────────────────────────────────────────────────────────

function getDomainIcon(domain: string): LucideIcon {
  const d = domain.toLowerCase();
  if (/python|javascript|typescript|coding|program|software|web|react|node|dev/.test(d)) return Code2;
  if (/design|ui|ux|figma|graphic|art|creative|illustration/.test(d)) return Palette;
  if (/fitness|workout|gym|sport|run|yoga|health|abs|muscle/.test(d)) return Dumbbell;
  if (/music|guitar|piano|drum|sing|audio/.test(d)) return Music;
  if (/language|spanish|french|german|japanese|chinese|english/.test(d)) return Globe;
  if (/math|calculus|algebra|statistics|physics/.test(d)) return Calculator;
  if (/business|marketing|finance|startup|entrepreneur/.test(d)) return TrendingUp;
  if (/science|biology|chemistry|anatomy/.test(d)) return FlaskConical;
  if (/photo|video|film/.test(d)) return Camera;
  if (/education|teaching|coaching|learning/.test(d)) return GraduationCap;
  return BookOpen;
}

// Domain → gradient for thumbnail
function getDomainGradient(domain: string): string {
  const d = domain.toLowerCase();
  if (/python|javascript|typescript|coding|program|software|web|react|node|dev/.test(d)) return "from-blue-500 to-indigo-600";
  if (/design|ui|ux|figma|graphic|art|creative|illustration/.test(d)) return "from-pink-400 to-violet-500";
  if (/fitness|workout|gym|sport|run|yoga|health|abs|muscle/.test(d)) return "from-orange-400 to-red-500";
  if (/music|guitar|piano|drum|sing|audio/.test(d)) return "from-purple-400 to-pink-500";
  if (/language|spanish|french|german|japanese|chinese|english/.test(d)) return "from-teal-400 to-cyan-500";
  if (/math|calculus|algebra|statistics|physics/.test(d)) return "from-sky-400 to-blue-500";
  if (/business|marketing|finance|startup|entrepreneur/.test(d)) return "from-emerald-400 to-teal-500";
  if (/science|biology|chemistry|anatomy/.test(d)) return "from-lime-400 to-green-500";
  return "from-violet-500 to-primary";
}

// ─── Motion helper ────────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const, delay },
});

// ─── ViewModel hook ───────────────────────────────────────────────────────────

function useDashboardViewModel(props: {
  profile: Profile | null; emailFallback: string; courses: Course[];
  completedLessonIds: string[]; weeklyXp: number; weeklyGoal: number; totalMinutesLearned: number;
}): DashboardVM {
  return useMemo(() => {
    const { profile, emailFallback, courses, completedLessonIds, weeklyXp, weeklyGoal, totalMinutesLearned } = props;
    const completedSet   = new Set(completedLessonIds);
    const firstName      = profile?.full_name?.split(" ")[0] ?? emailFallback;
    const hour           = new Date().getHours();
    const greeting       = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const xp             = profile?.total_xp ?? 0;
    const streak         = profile?.current_streak ?? 0;
    const subline        = streak > 0 ? "Keep learning, keep leveling up." : "Ready to learn something new today?";

    const currentLevel   = getCurrentLevel(xp);
    const { pct: levelPct, xpInLevel, xpNeeded } = getLevelProgress(xp);
    const weeklyPct      = Math.min(100, Math.round((weeklyXp / weeklyGoal) * 100));

    const activeCourses    = courses.filter((c) => c.status === "active");
    const completedCourses = courses.filter((c) => c.status === "completed");

    const sortedFlat = (course: Course) =>
      [...(course.modules ?? [])]
        .sort((a, b) => a.order_index - b.order_index)
        .flatMap((m) => [...(m.lessons ?? [])].sort((a, b) => a.order_index - b.order_index));

    let nextLesson: DashboardVM["nextLesson"] = null;
    for (const course of activeCourses) {
      const all  = sortedFlat(course);
      const done = all.filter((l) => completedSet.has(l.id)).length;
      const pct  = all.length > 0 ? Math.round((done / all.length) * 100) : 0;
      const next = all.find((l) => !completedSet.has(l.id));
      if (next) { nextLesson = { lessonId: next.id, lessonTitle: next.title, courseId: course.id, courseTitle: course.title, coursePct: pct }; break; }
    }

    const resumeCourses: ResumeCourse[] = activeCourses.slice(0, 2).map((course) => {
      const all  = sortedFlat(course);
      const done = all.filter((l) => completedSet.has(l.id)).length;
      const pct  = all.length > 0 ? Math.round((done / all.length) * 100) : 0;
      const next = all.find((l) => !completedSet.has(l.id));
      return { course, pct, completedCount: done, totalCount: all.length, nextLessonId: next?.id ?? null, nextLessonTitle: next?.title ?? null };
    });

    return {
      firstName, greeting, subline, xp, streak,
      plan: profile?.plan ?? "free",
      coursesGeneratedThisMonth: profile?.courses_generated_this_month ?? 0,
      currentLevel, levelPct, xpInLevel, xpNeeded,
      weeklyXp, weeklyGoal, weeklyPct, goalDone: weeklyPct >= 100,
      activeCourses, completedCourses, allCourses: courses,
      nextLesson, resumeCourses, completedSet, totalMinutesLearned,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.profile, props.emailFallback, props.courses, props.completedLessonIds, props.weeklyXp, props.weeklyGoal, props.totalMinutesLearned]);
}

// ─── CourseThumbnail ──────────────────────────────────────────────────────────

function CourseThumbnail({ domain, size = "md" }: { domain: string; size?: "sm" | "md" }) {
  const DomainIcon = getDomainIcon(domain);
  const gradient   = getDomainGradient(domain);
  const dim        = size === "sm" ? "w-16 h-16 min-w-[4rem]" : "w-20 h-20 min-w-[5rem]";
  return (
    <div className={`${dim} rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
      <DomainIcon className="w-8 h-8 text-white/85" />
    </div>
  );
}

// ─── ContinueHeroCard ─────────────────────────────────────────────────────────

function ContinueHeroCard({ vm }: { vm: DashboardVM }) {
  const { nextLesson } = vm;
  if (!nextLesson) return null;
  const { lessonTitle, lessonId, courseId, courseTitle, coursePct } = nextLesson;

  return (
    <motion.div {...fadeUp(0.06)}>
      <Link href={`/courses/${courseId}/lesson/${lessonId}`} onClick={() => trackEvent("hero_resume_click", { courseId })}>
        <div className="relative bg-gradient-to-br from-[#5B21B6] via-[#7C3AED] to-[#6D28D9] rounded-3xl p-6 pb-7 shadow-2xl shadow-primary/30 overflow-hidden cursor-pointer group">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

          {/* Top label */}
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Zap className="w-3 h-3 fill-white/80" />
            Continue your progress
          </div>

          {/* Title */}
          <h2 className="font-heading text-2xl font-extrabold text-white leading-tight mb-2 pr-12">
            {courseTitle}
          </h2>
          <p className="text-sm text-white/70 mb-1">{lessonTitle}</p>
          <p className="text-xs text-white/55 mb-5">
            {coursePct}% complete
          </p>

          {/* Progress bar */}
          <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-6">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${coursePct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
            />
          </div>

          {/* CTA button */}
          <motion.div
            className="inline-flex"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex items-center gap-2 bg-white text-primary font-bold text-sm px-5 py-2.5 rounded-full shadow-lg group-hover:shadow-xl transition-shadow">
              <Play className="w-4 h-4 fill-primary" />
              Continue
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── WelcomeHeroCard ──────────────────────────────────────────────────────────

function WelcomeHeroCard() {
  return (
    <motion.div {...fadeUp(0.06)}>
      <Link href="/onboarding" onClick={() => trackEvent("welcome_hero_cta_click")}>
        <div className="relative bg-gradient-to-br from-[#5B21B6] via-[#7C3AED] to-[#6D28D9] rounded-3xl p-6 pb-7 shadow-2xl shadow-primary/30 overflow-hidden cursor-pointer">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="inline-flex items-center gap-1.5 bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3 h-3" />
            AI-powered learning
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-white leading-tight mb-2">Build your first AI course</h2>
          <p className="text-sm text-white/70 mb-6">Tell us what you want to master — we generate a personalised plan in seconds.</p>
          <div className="inline-flex items-center gap-2 bg-white text-primary font-bold text-sm px-5 py-2.5 rounded-full shadow-lg">
            <Sparkles className="w-4 h-4" />
            Get Started
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── AllDoneHeroCard ──────────────────────────────────────────────────────────

function AllDoneHeroCard() {
  return (
    <motion.div {...fadeUp(0.06)}>
      <Link href="/onboarding">
        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 pb-7 shadow-2xl shadow-emerald-500/25 overflow-hidden cursor-pointer">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="inline-flex items-center gap-1.5 bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Trophy className="w-3 h-3" />
            Outstanding work!
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-white leading-tight mb-2">All courses complete!</h2>
          <p className="text-sm text-white/75 mb-6">Keep growing — create a new course to continue your journey.</p>
          <div className="inline-flex items-center gap-2 bg-white text-emerald-600 font-bold text-sm px-5 py-2.5 rounded-full shadow-lg">
            <PlusCircle className="w-4 h-4" />
            Create New Course
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── TodayGoalCard ────────────────────────────────────────────────────────────

function TodayGoalCard({ vm }: { vm: DashboardVM }) {
  const { nextLesson, streak, goalDone, weeklyXp, weeklyGoal } = vm;
  const href = nextLesson
    ? `/courses/${nextLesson.courseId}/lesson/${nextLesson.lessonId}`
    : "/courses";

  return (
    <motion.div {...fadeUp(0.12)}>
      <div className="bg-white dark:bg-card rounded-3xl border border-primary/8 p-5 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          {/* Icon */}
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            {goalDone
              ? <CheckCircle2 className="w-5 h-5 text-primary" />
              : <Target className="w-5 h-5 text-primary" />
            }
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-foreground leading-tight">Today&apos;s Goal</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {goalDone ? "Weekly goal reached!" : "Complete 1 lesson"}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {goalDone ? "Great work this week." : "Keep your streak alive!"}
            </p>
          </div>

          {/* XP badges + streak */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" />
              +10 XP
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-full">
                <Flame className="w-3 h-3" />
                +5 XP
              </div>
            )}
          </div>
        </div>

        {/* Weekly XP mini bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Weekly progress</span>
            <span className={`font-semibold ${goalDone ? "text-emerald-600" : "text-primary"}`}>
              {weeklyXp.toLocaleString("en-US")} / {weeklyGoal.toLocaleString("en-US")} XP
            </span>
          </div>
          <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${goalDone ? "bg-emerald-500" : "bg-primary"}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.round((weeklyXp / weeklyGoal) * 100))}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>

        {/* CTA row */}
        <div className="flex items-center gap-3">
          <Link href={href} className="flex-1" onClick={() => trackEvent("goal_start_now_click")}>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button className="w-full rounded-full bg-primary hover:bg-[#6d28d9] text-white font-bold gap-2 cursor-pointer shadow-md shadow-primary/25 h-11">
                Start Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </Link>
          {/* Streak badge */}
          {streak > 0 && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
              className="flex flex-col items-center justify-center w-16 h-11 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 flex-shrink-0"
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] font-bold text-orange-600 leading-tight">{streak} day</span>
              <span className="text-[9px] text-orange-400 leading-tight">streak</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── ProgressCard ("Your Progress") ──────────────────────────────────────────

function ProgressCard({ vm }: { vm: DashboardVM }) {
  const { xp, currentLevel, levelPct, xpInLevel, xpNeeded, streak, activeCourses } = vm;
  const LevelIcon = currentLevel.icon;

  return (
    <motion.div {...fadeUp(0.18)} data-tour="dashboard-stats">
      <div className="bg-white dark:bg-card rounded-3xl border border-primary/8 p-5 shadow-sm">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <p className="font-heading font-bold text-foreground underline decoration-2 decoration-primary/30 underline-offset-2">Your Progress</p>
          <div className={`flex items-center gap-1.5 bg-gradient-to-r ${currentLevel.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
            <LevelIcon className="w-3 h-3" />
            {currentLevel.name}
          </div>
        </div>

        {/* XP large display */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="font-heading text-3xl font-extrabold text-primary">
              {xpInLevel.toLocaleString("en-US")}
            </span>
            <span className="text-base font-semibold text-muted-foreground">
              / {xpNeeded > 0 ? xpNeeded.toLocaleString("en-US") : "∞"} XP
            </span>
          </div>
          {/* Level bar */}
          <div className="h-2.5 bg-primary/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${currentLevel.color} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${levelPct}%` }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-4 pt-3 border-t border-primary/6">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-foreground">{streak}-day streak</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary/70" />
            <span className="text-sm font-semibold text-foreground">{activeCourses.length} active course{activeCourses.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-bold text-primary">
              {xp.toLocaleString("en-US")} total XP
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ContinueLearningSection ──────────────────────────────────────────────────

function ContinueLearningSection({ vm }: { vm: DashboardVM }) {
  const { resumeCourses } = vm;
  if (resumeCourses.length === 0) return null;

  return (
    <motion.div {...fadeUp(0.26)}>
      <div className="flex items-center justify-between mb-3" data-tour="dashboard-courses">
        <h2 className="font-heading font-bold text-lg text-foreground">Continue Learning</h2>
        <Link href="/courses">
          <Button variant="ghost" size="sm" className="text-primary gap-1 cursor-pointer text-sm font-semibold h-8 px-3 hover:bg-primary/8">
            View all <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {resumeCourses.map((data, i) => (
          <ContinueCourseCard key={data.course.id} data={data} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

function ContinueCourseCard({ data, index }: { data: ResumeCourse; index: number }) {
  const { course, pct, completedCount, totalCount, nextLessonId, nextLessonTitle } = data;
  const href = nextLessonId
    ? `/courses/${course.id}/lesson/${nextLessonId}`
    : `/courses/${course.id}`;

  return (
    <motion.div {...fadeUp(0.3 + index * 0.08)}>
      <div className="bg-white dark:bg-card rounded-3xl border border-primary/8 p-4 shadow-sm hover:shadow-md hover:shadow-primary/8 transition-shadow duration-200">
        <div className="flex items-start gap-4 mb-4">
          {/* Thumbnail */}
          <CourseThumbnail domain={course.domain} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-1 truncate">{course.domain}</p>
            <p className="font-heading font-bold text-foreground leading-snug line-clamp-2 mb-1">
              {course.title}
            </p>
            {nextLessonTitle ? (
              <p className="text-xs text-muted-foreground">Next: {nextLessonTitle}</p>
            ) : (
              <p className="text-xs text-emerald-600 font-semibold">All lessons complete!</p>
            )}
          </div>
        </div>

        {/* Progress */}
        {totalCount > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{completedCount}/{totalCount} lessons</span>
              <span className="font-bold text-foreground">{pct}%</span>
            </div>
            <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 + index * 0.08 }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <Link href={href} onClick={() => trackEvent("course_card_resume_click", { courseId: course.id })}>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button className="w-full rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white font-semibold gap-2 cursor-pointer transition-colors h-10 border border-primary/15 hover:border-primary">
              <Play className="w-3.5 h-3.5 fill-current" />
              Continue Learning
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Button>
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── RecommendedSection ───────────────────────────────────────────────────────

const SUGGESTED: Array<{ label: string; desc: string; topic: string; gradient: string; Icon: LucideIcon }> = [
  { label: "AI Marketing for Beginners", desc: "Build in-demand skills and grow your online presence.", topic: "AI marketing for beginners", gradient: "from-amber-400 to-orange-500", Icon: TrendingUp },
  { label: "Python Programming", desc: "Learn to code from scratch with hands-on projects.", topic: "Python programming for beginners", gradient: "from-blue-500 to-indigo-600", Icon: Code2 },
  { label: "UX/UI Design Basics", desc: "Design beautiful interfaces and improve user experience.", topic: "UX UI design fundamentals", gradient: "from-pink-400 to-violet-500", Icon: Palette },
];

function RecommendedSection({ vm }: { vm: DashboardVM }) {
  if (vm.allCourses.length >= 3) return null;
  const featured = SUGGESTED[0];
  const FeaturedIcon = featured.Icon;

  return (
    <motion.div {...fadeUp(0.42)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Recommended for you
        </h2>
        <Button variant="ghost" size="sm" className="text-primary gap-1 cursor-pointer text-sm font-semibold h-8 px-3 hover:bg-primary/8">
          View all <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Featured card — warm amber */}
      <Link href={`/onboarding?topic=${encodeURIComponent(featured.topic)}`} onClick={() => trackEvent("recommended_featured_click", { topic: featured.topic })}>
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 mb-3 cursor-pointer hover:shadow-md hover:shadow-amber-200/50 dark:hover:shadow-amber-900/20 transition-all duration-200"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${featured.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
              <FeaturedIcon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-foreground leading-snug mb-1">{featured.label}</p>
              <p className="text-sm text-muted-foreground">{featured.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Starts in 15 min · 12 lessons
            </span>
          </div>
          <Button className="rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2 cursor-pointer h-10 px-5 shadow-md shadow-amber-300/40">
            Start Course
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── CreateCourseSection ──────────────────────────────────────────────────────

function CreateCourseSection() {
  return (
    <motion.div {...fadeUp(0.5)}>
      <Link href="/onboarding" onClick={() => trackEvent("create_course_cta_click")}>
        <motion.div
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white dark:bg-card rounded-3xl border-2 border-dashed border-primary/25 p-5 flex items-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/3 transition-all duration-200 group"
        >
          <motion.div
            className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center flex-shrink-0 transition-colors"
            whileHover={{ rotate: 8 }}
          >
            <PlusCircle className="w-7 h-7 text-primary" />
          </motion.div>
          <div className="flex-1">
            <p className="font-heading font-bold text-foreground mb-0.5">Create a New Course</p>
            <p className="text-sm text-muted-foreground">Tell us your goal and AI will build a personalised plan.</p>
          </div>
        </motion.div>
      </Link>
      <div className="mt-3">
        <Link href="/onboarding">
          <Button className="w-full rounded-full bg-primary hover:bg-[#6d28d9] text-white font-bold gap-2 cursor-pointer h-11 shadow-md shadow-primary/25">
            Create Course
            <Sparkles className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── FreePlanBanner ───────────────────────────────────────────────────────────

function FreePlanBanner({ vm }: { vm: DashboardVM }) {
  if (vm.plan !== "free") return null;
  const remaining = Math.max(0, 2 - vm.coursesGeneratedThisMonth);
  return (
    <motion.div {...fadeUp(0.56)}>
      <div className="bg-gradient-to-r from-primary/8 to-violet-100 dark:to-violet-900/20 rounded-3xl border border-primary/15 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm">
            {remaining === 0 ? "You've used your 2 free courses this month." : `${remaining} free course${remaining !== 1 ? "s" : ""} remaining this month.`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Pro for unlimited courses, PDF uploads, and more.</p>
        </div>
        <Link href="/settings?tab=billing">
          <Button size="sm" className="rounded-full bg-primary text-white hover:bg-[#6d28d9] shadow-md shadow-primary/25 whitespace-nowrap cursor-pointer" onClick={() => trackEvent("upgrade_banner_click")}>
            Upgrade to Pro
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardClient(props: {
  profile: Profile | null; emailFallback: string; courses: Course[];
  completedLessonIds: string[]; weeklyXp: number; weeklyGoal: number; totalMinutesLearned: number;
}) {
  const vm = useDashboardViewModel(props);
  const { firstName, greeting, subline, nextLesson, activeCourses, completedCourses, allCourses, streak } = vm;

  const noCourses = allCourses.length === 0;
  const allDone   = !noCourses && activeCourses.length === 0 && completedCourses.length > 0;

  return (
    /* Extend page background to lavender to match reference */
    <div className="max-w-2xl mx-auto">
      {/* Full-bleed lavender tint behind the content */}
      <div className="bg-[#f5f3ff] dark:bg-transparent -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-4 pt-4 md:px-6 md:pt-6 rounded-none pb-1">
        <div className="max-w-2xl mx-auto space-y-4 pb-8">
          <OnboardingTour />

          {/* ── Header ────────────────────────────────────────────────── */}
          <motion.div {...fadeUp(0)} className="flex items-start justify-between pt-1" data-tour="dashboard-greeting">
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-foreground leading-tight">
                {greeting}, {firstName}! 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">{subline}</p>
            </div>
            {streak > 0 && (
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.55 }}
                className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full text-sm font-bold flex-shrink-0 shadow-sm"
              >
                <Flame className="w-4 h-4" />
                {streak}
              </motion.div>
            )}
          </motion.div>

          {/* ── Hero card ──────────────────────────────────────────────── */}
          {nextLesson  ? <ContinueHeroCard vm={vm} />  :
           allDone     ? <AllDoneHeroCard />            :
           noCourses   ? <WelcomeHeroCard />            : null}

          {/* ── Today's Goal ────────────────────────────────────────── */}
          <TodayGoalCard vm={vm} />

          {/* ── Your Progress ───────────────────────────────────────── */}
          <ProgressCard vm={vm} />

          {/* ── Continue Learning ───────────────────────────────────── */}
          <ContinueLearningSection vm={vm} />

          {/* ── Recommended ─────────────────────────────────────────── */}
          <RecommendedSection vm={vm} />

          {/* ── Create New Course ────────────────────────────────────── */}
          <CreateCourseSection />

          {/* ── Free plan banner ─────────────────────────────────────── */}
          <FreePlanBanner vm={vm} />
        </div>
      </div>
    </div>
  );
}
