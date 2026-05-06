"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";

export interface Lesson { id: string }
export interface Module { id: string; lessons: Lesson[] }
export interface Course {
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

const FILTERS = ["All", "Active", "Completed", "Paused"] as const;
type Filter = typeof FILTERS[number];

function isValidFilter(v: string | null): v is Filter {
  return FILTERS.includes(v as Filter);
}

const statusPill: Record<string, { label: string; bg: string; color: string }> = {
  active:     { label: "Active",      bg: "var(--emerald-muted)", color: "var(--emerald)" },
  generating: { label: "Generating",  bg: "var(--gold-muted)",    color: "var(--gold)" },
  completed:  { label: "Completed",   bg: "var(--muted)",         color: "var(--muted-foreground)" },
  paused:     { label: "Paused",      bg: "var(--muted)",         color: "var(--muted-foreground)" },
};

const levelPill: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: "var(--emerald-muted)", color: "var(--emerald)" },
  intermediate: { bg: "var(--blue-muted)",    color: "var(--blue)" },
  advanced:     { bg: "oklch(0.55 0.2 290 / 0.15)", color: "oklch(0.72 0.18 290)" },
};

export default function CoursesClient({ courses, completedLessonIds }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filter: Filter = isValidFilter(searchParams.get("filter"))
    ? (searchParams.get("filter") as Filter)
    : "All";
  const search = searchParams.get("search") ?? "";

  const completedSet = new Set(completedLessonIds);

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "All") params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

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

  const panel: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xl)",
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}
      >
        <div>
          <h1 style={{ fontFamily: "var(--font-bricolage)", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>
            My Courses
          </h1>
          <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
            {courses.length} course{courses.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/onboarding">
          <button
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 18px", borderRadius: "10px",
              fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
              background: "var(--blue)", color: "#fff", border: "none",
              cursor: "pointer", transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--blue-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--blue)"; }}
          >
            <span style={{ fontSize: "16px", lineHeight: 1 }}>✦</span>
            New Course
          </button>
        </Link>
      </motion.div>

      {/* Filters + Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setParam("filter", f)}
              style={{
                padding: "6px 14px", borderRadius: "99px",
                fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
                cursor: "pointer", border: "none", transition: "background 0.15s, color 0.15s",
                background: filter === f ? "var(--blue)" : "var(--muted)",
                color: filter === f ? "#fff" : "var(--muted-foreground)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--muted-foreground)" }} />
          <input
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setParam("search", e.target.value)}
            style={{
              paddingLeft: "32px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px",
              borderRadius: "10px", border: "1px solid var(--border)",
              background: "var(--muted)", color: "var(--foreground)",
              fontSize: "13px", fontFamily: "inherit", outline: "none",
              width: "200px", transition: "border-color 0.2s",
            }}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--blue-border)"; }}
            onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--border)"; }}
          />
        </div>
      </motion.div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ ...panel, padding: "64px", textAlign: "center" }}
        >
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📚</div>
          <h3 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "17px", marginBottom: "6px" }}>
            {search ? "No courses found" : "No courses yet"}
          </h3>
          <p style={{ fontSize: "14px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
            {search ? "Try a different search term." : "Create your first AI-generated course to get started."}
          </p>
          {!search && (
            <Link href="/onboarding">
              <button style={{
                padding: "9px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                background: "var(--blue)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit",
              }}>
                Create First Course
              </button>
            </Link>
          )}
        </motion.div>
      )}

      {/* Course grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
        {filtered.map((course, i) => {
          const allLessons = course.modules.flatMap((m) => m.lessons ?? []);
          const completedCount = allLessons.filter((l) => completedSet.has(l.id)).length;
          const total = allLessons.length;
          const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
          const sp = statusPill[course.status] ?? statusPill.active;
          const lp = levelPill[course.detected_level] ?? levelPill.intermediate;

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/courses/${course.id}`} style={{ textDecoration: "none", display: "block" }}>
                <div
                  style={{
                    ...panel, padding: "20px",
                    transition: "border-color 0.2s, transform 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--blue-border)";
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border)";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "13px",
                      background: "var(--blue-muted)", border: "1px solid var(--blue-border)",
                      display: "grid", placeItems: "center", fontSize: "20px", flexShrink: 0,
                    }}>📚</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "3px", fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase" }}>
                        {course.domain}
                      </div>
                      <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "15px", fontWeight: 700, letterSpacing: "-0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {course.title}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", flexShrink: 0 }}>
                      <span style={{
                        fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "99px",
                        background: lp.bg, color: lp.color, textTransform: "capitalize",
                      }}>{course.detected_level}</span>
                      <span style={{
                        fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "99px",
                        background: sp.bg, color: sp.color,
                      }}>{sp.label}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "6px" }}>
                      <span>{completedCount}/{total} lessons</span>
                      <span style={{ fontWeight: 600, color: pct === 100 ? "var(--emerald)" : "var(--foreground)" }}>{pct}%</span>
                    </div>
                    <div style={{ height: "5px", borderRadius: "3px", background: "var(--muted)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: "3px",
                        background: pct === 100 ? "var(--emerald)" : "var(--blue)",
                        width: `${pct}%`, transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", color: "var(--muted-foreground)" }}>
                    <span>⏱ {course.duration_weeks}w · {course.minutes_per_day}min/day</span>
                    <span>📦 {course.modules.length} modules</span>
                    <span style={{ marginLeft: "auto", fontWeight: 600, color: pct === 100 ? "var(--emerald)" : "var(--blue)" }}>
                      {pct === 100 ? "✓ Done" : "Continue →"}
                    </span>
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
