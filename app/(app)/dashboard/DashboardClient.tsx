"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen, Zap, Flame, PlusCircle, ArrowRight,
  Code2, Palette, TrendingUp, Globe, Dumbbell, Music,
  Calculator, FlaskConical, Camera, GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  lessonsCompleted: number;
}

function trackEvent(name: string, props?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", name, props);
}

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

function getDomainColor(domain: string): { hue: number; label: string } {
  const d = domain.toLowerCase();
  if (/python|javascript|typescript|coding|program|software|web|react|node|dev/.test(d)) return { hue: 256, label: "JavaScript" };
  if (/design|ui|ux|figma|graphic|art|creative|illustration/.test(d)) return { hue: 295, label: "Design" };
  if (/fitness|workout|gym|sport|run|yoga|health/.test(d)) return { hue: 20, label: "Fitness" };
  if (/music|guitar|piano|drum|sing|audio/.test(d)) return { hue: 310, label: "Music" };
  if (/language|spanish|french|german|japanese|chinese|english/.test(d)) return { hue: 185, label: "Language" };
  if (/math|calculus|algebra|statistics|physics/.test(d)) return { hue: 210, label: "Math" };
  if (/business|marketing|finance|startup|entrepreneur/.test(d)) return { hue: 75, label: "Finance" };
  if (/science|biology|chemistry|anatomy/.test(d)) return { hue: 140, label: "Science" };
  return { hue: 256, label: domain };
}

// ─── ViewModel ───────────────────────────────────────────────────────────────

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
    const subline        = streak > 0
      ? `You're on a ${streak}-day streak. ${Math.max(0, weeklyGoal - weeklyXp)} XP to reach your weekly goal.`
      : "Ready to learn something new today?";

    const currentLevel   = getCurrentLevel(xp);
    const { pct: levelPct, xpInLevel, xpNeeded } = getLevelProgress(xp);
    const weeklyPct      = Math.min(100, Math.round((weeklyXp / weeklyGoal) * 100));

    const activeCourses    = courses.filter((c) => c.status === "active");
    const completedCourses = courses.filter((c) => c.status === "completed");
    const lessonsCompleted = completedLessonIds.length;

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
      lessonsCompleted,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.profile, props.emailFallback, props.courses, props.completedLessonIds, props.weeklyXp, props.weeklyGoal, props.totalMinutesLearned]);
}

// ─── Shared panel style ───────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-xl)",
  padding: "18px",
};

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon, iconBg, value, label, delta,
}: { icon: string; iconBg: string; value: string | number; label: string; delta?: string }) {
  return (
    <div
      style={{ ...panel, transition: "border-color 0.2s, transform 0.2s" }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--blue-border)"; el.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", display: "grid", placeItems: "center", fontSize: "16px", background: iconBg }}>
          {icon}
        </div>
        {delta && <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--emerald)" }}>{delta}</span>}
      </div>
      <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "28px", fontWeight: 800, letterSpacing: "-1px", marginBottom: "2px" }}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </div>
      <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{label}</div>
    </div>
  );
}

// ─── ContinueBanner ───────────────────────────────────────────────────────────

function ContinueBanner({ vm }: { vm: DashboardVM }) {
  const { nextLesson } = vm;
  if (!nextLesson) return null;
  const { lessonTitle, lessonId, courseId, courseTitle, coursePct } = nextLesson;

  return (
    <Link href={`/courses/${courseId}/lesson/${lessonId}`} onClick={() => trackEvent("hero_resume_click", { courseId })}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: "20px",
          background: "var(--card2, var(--card))",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          padding: "20px 24px",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--blue-border)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
      >
        {/* Blue gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, var(--blue-muted), transparent 55%)", pointerEvents: "none" }} />

        <div style={{
          width: "52px", height: "52px", borderRadius: "14px",
          background: "var(--blue)", display: "grid", placeItems: "center",
          fontSize: "24px", flexShrink: 0, zIndex: 1,
        }}>
          ⚛
        </div>

        <div style={{ flex: 1, zIndex: 1 }}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "3px" }}>
            Continue where you left off
          </div>
          <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px", marginBottom: "2px" }}>
            {courseTitle}
          </div>
          <div style={{ fontSize: "13px", color: "oklch(0.65 0.15 256)", marginBottom: "10px" }}>
            Next: {lessonTitle}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "var(--muted)", overflow: "hidden" }}>
              <motion.div
                style={{ height: "100%", borderRadius: "3px", background: "var(--blue)" }}
                initial={{ width: 0 }}
                animate={{ width: `${coursePct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--blue)" }}>{coursePct}%</span>
          </div>
        </div>

        <div
          style={{
            flexShrink: 0, zIndex: 1,
            background: "var(--blue)", color: "#fff",
            borderRadius: "var(--radius-lg)", padding: "8px 16px",
            fontSize: "13px", fontWeight: 600, border: "none",
            display: "flex", alignItems: "center", gap: "6px",
          }}
        >
          Continue <ArrowRight style={{ width: "14px", height: "14px" }} />
        </div>
      </div>
    </Link>
  );
}

// ─── CourseCard ───────────────────────────────────────────────────────────────

function CourseCard({ data }: { data: ResumeCourse }) {
  const { course, pct, completedCount, totalCount, nextLessonId, nextLessonTitle } = data;
  const href = nextLessonId ? `/courses/${course.id}/lesson/${nextLessonId}` : `/courses/${course.id}`;
  const { hue, label } = getDomainColor(course.domain);
  const DomainIcon = getDomainIcon(course.domain);

  return (
    <Link href={href} onClick={() => trackEvent("course_card_click", { courseId: course.id })}>
      <div
        style={{
          ...panel,
          overflow: "hidden",
          cursor: "pointer",
          transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--blue-border)"; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 8px 28px oklch(0 0 0 / 0.12)"; }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
      >
        {/* Header area with colored background */}
        <div style={{
          height: "80px", display: "flex", alignItems: "flex-end", padding: "12px",
          position: "relative", overflow: "hidden",
          background: `linear-gradient(135deg, oklch(0.18 0.04 ${hue}), oklch(0.12 0.02 ${hue}))`,
        }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 70% 30%, oklch(0.53 0.23 ${hue} / 0.25), transparent 60%)` }} />
          <DomainIcon style={{ width: "24px", height: "24px", color: "rgba(255,255,255,0.8)", position: "relative", zIndex: 1 }} />
        </div>

        <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "4px" }}>
            {label}
          </div>
          <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "14px", fontWeight: 700, letterSpacing: "-0.2px", marginBottom: "8px", lineHeight: 1.3, flex: 1 }}>
            {course.title}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "8px" }}>
            <span>📚 {totalCount} lessons</span>
            <span>{completedCount}/{totalCount}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span style={{ color: "var(--muted-foreground)" }}>{nextLessonTitle ? `Next: ${nextLessonTitle.slice(0, 20)}…` : "All done!"}</span>
            <strong style={{ color: "var(--foreground)" }}>{pct}%</strong>
          </div>
          <div style={{ height: "4px", borderRadius: "2px", background: "var(--muted)", overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", borderRadius: "2px", background: "var(--blue)" }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── NewCourseCard ────────────────────────────────────────────────────────────

function NewCourseCard() {
  return (
    <Link href="/onboarding" onClick={() => trackEvent("new_course_click")}>
      <div
        style={{
          ...panel,
          border: "2px dashed var(--border)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "8px", cursor: "pointer", padding: "24px",
          textAlign: "center",
          transition: "border-color 0.2s, background 0.2s",
          minHeight: "190px",
        }}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--blue-border)"; el.style.background = "var(--blue-muted)"; }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.background = "var(--card)"; }}
      >
        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--muted)", display: "grid", placeItems: "center", fontSize: "20px" }}>
          ✦
        </div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted-foreground)" }}>Generate new course</div>
        <div style={{ fontSize: "11px", color: "var(--muted-foreground)", opacity: 0.7 }}>AI-powered · 30 seconds</div>
      </div>
    </Link>
  );
}

// ─── StreakPanel ──────────────────────────────────────────────────────────────

function StreakPanel({ streak }: { streak: number }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date().getDay(); // 0=Sun, 1=Mon ...
  const todayIdx = today === 0 ? 6 : today - 1; // convert to Mon=0 ... Sun=6

  return (
    <div style={panel}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "14px" }}>Daily Streak</span>
        <span className="chip-streak">🔥 On Fire</span>
      </div>
      <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "42px", fontWeight: 800, letterSpacing: "-2px", textAlign: "center", color: "var(--gold)" }}>
        {streak}
      </div>
      <div style={{ textAlign: "center", fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "14px" }}>
        days in a row
      </div>
      <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
        {days.map((d, i) => {
          const isToday = i === todayIdx;
          const isDone = i < todayIdx && streak > 0;
          return (
            <div
              key={i}
              style={{
                width: "28px", height: "28px", borderRadius: "8px",
                display: "grid", placeItems: "center",
                fontSize: "9px", fontWeight: 700,
                background: isToday ? "var(--blue-muted)" : isDone ? "var(--gold-muted)" : "var(--muted)",
                border: `1px solid ${isToday ? "var(--blue-border)" : isDone ? "var(--gold-border)" : "var(--border)"}`,
                color: isToday ? "var(--blue)" : isDone ? "var(--gold)" : "var(--muted-foreground)",
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WeeklyXpPanel ────────────────────────────────────────────────────────────

const barHeights = [70, 45, 90, 55, 80, 25, 50];
const barDays = ["M", "T", "W", "T", "F", "S", "S"];

function WeeklyXpPanel({ weeklyXp, weeklyGoal }: { weeklyXp: number; weeklyGoal: number }) {
  const pct = Math.min(100, Math.round((weeklyXp / weeklyGoal) * 100));
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <div style={panel}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "14px" }}>Weekly XP</span>
        <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{weeklyXp} / {weeklyGoal}</span>
      </div>

      <div style={{ marginTop: "10px", marginBottom: "4px", display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
        <span style={{ color: "var(--muted-foreground)" }}>Weekly goal</span>
        <strong style={{ color: "var(--blue)" }}>{pct}%</strong>
      </div>
      <div style={{ height: "5px", borderRadius: "3px", background: "var(--muted)", overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", borderRadius: "3px", background: "var(--blue)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
      </div>

      {/* Bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "56px", margin: "12px 0 6px" }}>
        {barHeights.map((h, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
            <div style={{ width: "100%", height: "56px", background: "var(--muted)", borderRadius: "4px 4px 0 0", position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: `${h}%`, borderRadius: "4px 4px 0 0",
                background: "var(--blue)",
                opacity: i === todayIdx ? 1 : 0.6,
              }} />
            </div>
            <span style={{
              fontSize: "9px", fontWeight: 600,
              color: i === todayIdx ? "var(--blue)" : "var(--muted-foreground)",
            }}>
              {barDays[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ActivityPanel ────────────────────────────────────────────────────────────

interface ActivityItem { dot: string; text: React.ReactNode; time: string }

function ActivityPanel({ recentItems }: { recentItems: ActivityItem[] }) {
  return (
    <div style={panel}>
      <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}>
        Recent Activity
      </div>
      {recentItems.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "7px 0",
            borderBottom: i < recentItems.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, background: item.dot }} />
          <div style={{ fontSize: "12px", color: "var(--muted-foreground)", flex: 1, lineHeight: 1.4 }}>
            {item.text}
          </div>
          <div style={{ fontSize: "10px", color: "var(--muted-foreground)", flexShrink: 0 }}>{item.time}</div>
        </div>
      ))}
    </div>
  );
}

// ─── FreePlanBanner ───────────────────────────────────────────────────────────

function FreePlanBanner({ vm }: { vm: DashboardVM }) {
  if (vm.plan !== "free") return null;
  const remaining = Math.max(0, 2 - vm.coursesGeneratedThisMonth);
  return (
    <div
      style={{
        background: "var(--blue-muted)",
        border: "1px solid var(--blue-border)",
        borderRadius: "var(--radius-xl)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap" as const,
        marginBottom: "24px",
      }}
    >
      <div>
        <p style={{ fontWeight: 600, fontSize: "14px" }}>
          {remaining === 0 ? "You've used your 2 free courses this month." : `${remaining} free course${remaining !== 1 ? "s" : ""} remaining this month.`}
        </p>
        <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "2px" }}>
          Upgrade to Pro for unlimited courses, PDF uploads, and more.
        </p>
      </div>
      <Link href="/settings?tab=billing">
        <button
          style={{
            background: "var(--blue)", color: "#fff",
            borderRadius: "var(--radius-lg)", padding: "8px 16px",
            fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          onClick={() => trackEvent("upgrade_banner_click")}
        >
          Upgrade to Pro
        </button>
      </Link>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardClient(props: {
  profile: Profile | null; emailFallback: string; courses: Course[];
  completedLessonIds: string[]; weeklyXp: number; weeklyGoal: number; totalMinutesLearned: number;
  subscription?: { status: string; plan: string; trial_end: string | null; current_period_end: string; cancel_at_period_end: boolean } | null;
}) {
  const vm = useDashboardViewModel(props);
  const { firstName, greeting, subline, xp, streak, weeklyXp, weeklyGoal, resumeCourses, lessonsCompleted, completedCourses } = vm;

  const activityItems: ActivityItem[] = resumeCourses.length > 0 ? [
    { dot: "var(--emerald)", text: <span>Completed <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>latest lesson</strong></span>, time: "2h ago" },
    { dot: "var(--blue)", text: <span>Earned <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>+80 XP</strong> this session</span>, time: "2h ago" },
    { dot: "var(--gold)", text: <span>Unlocked badge <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>On Fire 🔥</strong></span>, time: "1d ago" },
    { dot: "var(--emerald)", text: <span>Completed <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>a module</strong></span>, time: "2d ago" },
  ] : [
    { dot: "var(--blue)", text: <span>Welcome to <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>Skillify</strong>!</span>, time: "just now" },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <OnboardingTour />

      {/* Page header */}
      <div style={{ marginBottom: "22px" }} data-tour="dashboard-greeting">
        <h1 style={{ fontFamily: "var(--font-bricolage)", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>{subline}</p>
      </div>

      {/* Free plan banner */}
      <FreePlanBanner vm={vm} />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "22px" }} data-tour="dashboard-stats">
        <StatCard icon="⚡" iconBg="var(--blue-muted)" value={xp} label="Total XP" delta="+12%" />
        <StatCard icon="🔥" iconBg="var(--gold-muted)" value={streak} label="Day Streak" delta={streak > 0 ? `Best: ${streak}` : undefined} />
        <StatCard icon="✓" iconBg="var(--emerald-muted)" value={lessonsCompleted} label="Lessons Done" />
        <StatCard icon="🎓" iconBg="var(--rose-muted, oklch(0.65 0.18 10 / 0.16))" value={completedCourses.length} label="Courses Completed" />
      </div>

      {/* Continue banner */}
      <ContinueBanner vm={vm} />

      {/* Content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 272px", gap: "20px", alignItems: "start" }} data-tour="dashboard-courses">

        {/* Left: courses */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "15px" }}>My Courses</span>
            <Link href="/courses" style={{ fontSize: "13px", color: "var(--blue)", fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {resumeCourses.map((data) => (
              <CourseCard key={data.course.id} data={data} />
            ))}
            {/* Fill remaining with new-course cards if < 2 courses */}
            {resumeCourses.length < 2 && resumeCourses.length > 0 && <NewCourseCard />}
            {resumeCourses.length === 0 ? (
              <>
                <NewCourseCard />
                <NewCourseCard />
                <NewCourseCard />
              </>
            ) : (
              <NewCourseCard />
            )}
          </div>
        </div>

        {/* Right: panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <StreakPanel streak={streak} />
          <WeeklyXpPanel weeklyXp={weeklyXp} weeklyGoal={weeklyGoal} />
          <ActivityPanel recentItems={activityItems} />
        </div>
      </div>
    </div>
  );
}
