"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, ChevronDown, Pencil } from "lucide-react";
import Link from "next/link";

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

export default function CourseView({ course, modules, completedLessonIds, quizAttempts = {} }: Props) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map((m) => m.id))
  );

  const sortedModules = [...modules].sort((a, b) => a.order_index - b.order_index);
  const allLessons = sortedModules.flatMap((m) => (m.lessons ?? []).sort((a, b) => a.order_index - b.order_index));
  const completedCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length;
  const progressPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;
  const totalXP = allLessons.reduce((s, l) => s + (l.xp_reward ?? 50), 0);
  const earnedXP = allLessons.filter((l) => completedLessonIds.has(l.id)).reduce((s, l) => s + (l.xp_reward ?? 50), 0);
  const totalMinutes = allLessons.reduce((s, l) => s + (l.estimated_minutes ?? 5), 0);
  const remainingMinutes = allLessons.filter((l) => !completedLessonIds.has(l.id)).reduce((s, l) => s + (l.estimated_minutes ?? 5), 0);

  const firstIncomplete = allLessons.find((l) => !completedLessonIds.has(l.id));

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const panel: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xl)",
    padding: "18px",
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Breadcrumb row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--muted-foreground)" }}>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "var(--muted-foreground)", transition: "color 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}
          >Dashboard</Link>
          <span>/</span>
          <Link href="/courses" style={{ textDecoration: "none", color: "var(--muted-foreground)", transition: "color 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}
          >My Courses</Link>
          <span>/</span>
          <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{course.title}</span>
        </div>
        <Link href={`/courses/${course.id}/edit`} style={{ textDecoration: "none" }}>
          <button style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 14px", borderRadius: "9px", fontSize: "12px", fontWeight: 600,
            background: "var(--card)", border: "1px solid var(--border)",
            color: "var(--muted-foreground)", cursor: "pointer", fontFamily: "inherit",
            transition: "border-color 0.2s, color 0.2s",
          }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--blue-border)"; el.style.color = "var(--foreground)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.color = "var(--muted-foreground)"; }}
          >
            <Pencil style={{ width: "12px", height: "12px" }} />
            Edit Course
          </button>
        </Link>
      </div>

      {/* Course hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-2xl)", padding: "28px", marginBottom: "22px",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Blue gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, var(--blue-muted), transparent 55%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: "20px" }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "18px",
            background: "var(--blue)", display: "grid", placeItems: "center",
            fontSize: "28px", flexShrink: 0,
          }}>📚</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "5px" }}>
              {course.domain} · {course.detected_level}
            </div>
            <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "10px" }}>
              {course.title}
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "14px" }}>
              <span>📚 {allLessons.length} lessons</span>
              <span>⏱ {Math.round(totalMinutes / 60 * 10) / 10} hrs total</span>
              <span>⚡ {totalXP.toLocaleString()} XP</span>
              <span>📦 {modules.length} modules</span>
              <span>🏆 Certificate on completion</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "oklch(0.53 0.23 256 / 0.15)", overflow: "hidden" }}>
                <motion.div
                  style={{ height: "100%", borderRadius: "3px", background: "var(--blue)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--blue)", flexShrink: 0 }}>
                {progressPct}% complete
              </span>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            {firstIncomplete ? (
              <Link href={`/courses/${course.id}/lesson/${firstIncomplete.id}`} style={{ textDecoration: "none" }}>
                <button style={{
                  padding: "10px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
                  background: "var(--blue)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.2s",
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--blue-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--blue)"; }}
                >
                  {completedCount > 0 ? "Continue →" : "Start →"}
                </button>
              </Link>
            ) : allLessons.length > 0 ? (
              <Link href={`/courses/${course.id}/certificate`} style={{ textDecoration: "none" }}>
                <button style={{
                  padding: "10px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
                  background: "var(--gold-muted)", color: "var(--gold)", border: "1px solid var(--gold-border)",
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  🏆 Certificate
                </button>
              </Link>
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* Main grid: modules + sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start" }}>

        {/* Module list */}
        <div>
          {sortedModules.map((mod, modIndex) => {
            const lessons = [...(mod.lessons ?? [])].sort((a, b) => a.order_index - b.order_index);
            const modCompleted = lessons.filter((l) => completedLessonIds.has(l.id)).length;
            const isExpanded = expandedModules.has(mod.id);
            const isAllDone = modCompleted === lessons.length && lessons.length > 0;
            const isInProgress = modCompleted > 0 && !isAllDone;
            const modMinutes = lessons.reduce((s, l) => s + (l.estimated_minutes ?? 5), 0);
            const attempt = quizAttempts[mod.id];

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: modIndex * 0.04 }}
                style={{
                  background: "var(--card)",
                  border: `1px solid ${isExpanded ? "var(--blue-border)" : "var(--border)"}`,
                  borderRadius: "var(--radius-xl)",
                  marginBottom: "10px", overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Module header */}
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "12px",
                    padding: "16px 20px", cursor: "pointer", background: "transparent",
                    border: "none", textAlign: "left", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--blue-muted)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div style={{
                    width: "30px", height: "30px", borderRadius: "9px",
                    display: "grid", placeItems: "center",
                    fontSize: "12px", fontWeight: 800, flexShrink: 0,
                    background: isAllDone ? "var(--emerald-muted)" : isInProgress ? "var(--blue-muted)" : "var(--muted)",
                    border: `1.5px solid ${isAllDone ? "var(--emerald-border, oklch(0.63 0.15 162 / 0.35))" : isInProgress ? "var(--blue-border)" : "var(--border)"}`,
                    color: isAllDone ? "var(--emerald)" : isInProgress ? "var(--blue)" : "var(--muted-foreground)",
                  }}>
                    {isAllDone ? "✓" : modIndex + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "15px", fontWeight: 700, letterSpacing: "-0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--foreground)" }}>
                      {mod.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                      {modCompleted}/{lessons.length} lessons · ~{modMinutes} min
                    </div>
                  </div>
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "99px",
                    marginRight: "8px",
                    background: isAllDone ? "var(--emerald-muted)" : isInProgress ? "var(--blue-muted)" : "var(--muted)",
                    color: isAllDone ? "var(--emerald)" : isInProgress ? "var(--blue)" : "var(--muted-foreground)",
                  }}>
                    {isAllDone ? "Complete" : isInProgress ? "In Progress" : "Not started"}
                  </span>
                  <ChevronDown style={{
                    width: "14px", height: "14px", color: "var(--muted-foreground)", flexShrink: 0,
                    transition: "transform 0.2s",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  }} />
                </button>

                {/* Quiz banner */}
                {isAllDone && isExpanded && (
                  <div style={{
                    padding: "10px 20px",
                    borderTop: `1px solid ${attempt?.passed ? "oklch(0.63 0.15 162 / 0.2)" : "var(--border)"}`,
                    background: attempt?.passed ? "var(--emerald-muted)" : attempt ? "var(--gold-muted)" : "var(--blue-muted)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600,
                      color: attempt?.passed ? "var(--emerald)" : attempt ? "var(--gold)" : "var(--blue)" }}>
                      <Brain style={{ width: "14px", height: "14px" }} />
                      {attempt?.passed
                        ? `Quiz Passed · ${attempt.score}/5 correct`
                        : attempt
                        ? "Quiz not passed yet"
                        : "Take Module Quiz · +150 XP"}
                    </div>
                    <Link href={`/courses/${course.id}/quiz?moduleId=${mod.id}`} style={{ textDecoration: "none" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--blue)", cursor: "pointer" }}>
                        {attempt?.passed ? "Retake" : "Take Quiz →"}
                      </span>
                    </Link>
                  </div>
                )}

                {/* Lessons */}
                {isExpanded && lessons.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    {lessons.map((lesson) => {
                      const done = completedLessonIds.has(lesson.id);
                      const isCurrent = firstIncomplete?.id === lesson.id;
                      return (
                        <Link
                          key={lesson.id}
                          href={`/courses/${course.id}/lesson/${lesson.id}`}
                          style={{ textDecoration: "none", display: "block" }}
                        >
                          <div
                            style={{
                              display: "flex", alignItems: "center", gap: "12px",
                              padding: "11px 20px",
                              borderBottom: "1px solid var(--border)",
                              background: isCurrent ? "var(--blue-muted)" : "transparent",
                              cursor: "pointer", transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (!isCurrent) (e.currentTarget as HTMLElement).style.background = "var(--muted)";
                            }}
                            onMouseLeave={(e) => {
                              if (!isCurrent) (e.currentTarget as HTMLElement).style.background = "transparent";
                            }}
                          >
                            {/* Check circle */}
                            <div style={{
                              width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                              display: "grid", placeItems: "center", fontSize: "10px",
                              background: done ? "var(--emerald)" : "transparent",
                              border: `2px solid ${done ? "var(--emerald)" : isCurrent ? "var(--blue)" : "var(--border)"}`,
                              color: "#fff",
                              boxShadow: isCurrent && !done ? "0 0 0 3px var(--blue-muted)" : "none",
                            }}>
                              {done ? "✓" : ""}
                            </div>
                            <div style={{
                              flex: 1, fontSize: "13px", fontWeight: isCurrent ? 600 : 500,
                              color: done ? "var(--muted-foreground)" : "var(--foreground)",
                              textDecoration: done ? "line-through" : "none",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {lesson.title}
                            </div>
                            <span style={{
                              fontSize: "10px", color: "var(--muted-foreground)",
                              background: "var(--muted)", padding: "2px 7px", borderRadius: "99px",
                              marginRight: "4px", flexShrink: 0,
                            }}>Lesson</span>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--gold)", flexShrink: 0 }}>
                              +{lesson.xp_reward} XP
                            </span>
                            {lesson.estimated_minutes > 0 && (
                              <span style={{ fontSize: "11px", color: "var(--muted-foreground)", marginLeft: "8px", flexShrink: 0 }}>
                                {lesson.estimated_minutes} min
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* XP Breakdown */}
          <div style={panel}>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "14px", marginBottom: "14px" }}>XP Breakdown</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {sortedModules.map((mod) => {
                const lessons = mod.lessons ?? [];
                const modXP = lessons.reduce((s, l) => s + (l.xp_reward ?? 50), 0);
                const modCompletedXP = lessons.filter((l) => completedLessonIds.has(l.id)).reduce((s, l) => s + (l.xp_reward ?? 50), 0);
                const isAllDone = modCompletedXP === modXP && lessons.length > 0;
                const isPartial = modCompletedXP > 0 && !isAllDone;
                return (
                  <div key={mod.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px", opacity: modCompletedXP === 0 ? 0.4 : 1 }}>
                    <span style={{ color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: "8px" }}>
                      {mod.title.replace(/^Module \d+:\s*/, "")}
                      {isAllDone ? " ✓" : isPartial ? " (partial)" : ""}
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--gold)", flexShrink: 0 }}>
                      +{modCompletedXP > 0 ? modCompletedXP : modXP} XP
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingTop: "10px", borderTop: "1px solid var(--border)", marginTop: "8px",
              fontFamily: "var(--font-bricolage)", fontWeight: 700,
            }}>
              <span>Total earned</span>
              <span style={{ fontSize: "18px", color: "var(--gold)" }}>{earnedXP.toLocaleString()} / {totalXP.toLocaleString()} XP</span>
            </div>
          </div>

          {/* Your Progress */}
          <div style={panel}>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}>Your Progress</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
              <span>Overall</span>
              <strong>{progressPct}%</strong>
            </div>
            <div style={{ height: "8px", borderRadius: "4px", background: "var(--muted)", overflow: "hidden", marginBottom: "12px" }}>
              <motion.div
                style={{ height: "100%", borderRadius: "4px", background: "var(--blue)" }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ background: "var(--emerald-muted)", border: "1px solid oklch(0.63 0.15 162 / 0.3)", borderRadius: "99px", padding: "3px 9px", fontSize: "11px", fontWeight: 600, color: "var(--emerald)" }}>
                ✓ {completedCount} done
              </span>
              <span style={{ background: "var(--blue-muted)", border: "1px solid var(--blue-border)", borderRadius: "99px", padding: "3px 9px", fontSize: "11px", fontWeight: 600, color: "var(--blue)" }}>
                {allLessons.length - completedCount} remaining
              </span>
              {remainingMinutes > 0 && (
                <span style={{ background: "var(--gold-muted)", border: "1px solid var(--gold-border)", borderRadius: "99px", padding: "3px 9px", fontSize: "11px", fontWeight: 600, color: "var(--gold)" }}>
                  ⏱ ~{remainingMinutes} min left
                </span>
              )}
            </div>
          </div>

          {/* Certificate */}
          <div style={panel}>
            <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}>Completion Certificate</div>
            <div style={{
              background: "var(--background)", borderRadius: "var(--radius-lg)",
              padding: "14px", textAlign: "center",
              border: `1px dashed ${progressPct === 100 ? "var(--gold-border)" : "var(--border)"}`,
            }}>
              <div style={{ fontSize: "28px", marginBottom: "6px" }}>🎓</div>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Certificate of Completion</div>
              <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                {progressPct === 100
                  ? "Your certificate is ready!"
                  : "Finish all modules to earn your shareable certificate"}
              </div>
              {progressPct === 100 && (
                <Link href={`/courses/${course.id}/certificate`} style={{ textDecoration: "none" }}>
                  <button style={{
                    marginTop: "10px", padding: "7px 16px", borderRadius: "8px",
                    fontSize: "12px", fontWeight: 600, background: "var(--gold-muted)",
                    border: "1px solid var(--gold-border)", color: "var(--gold)",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    View Certificate →
                  </button>
                </Link>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "14px", marginBottom: "4px" }}>
              <span>Course progress</span>
              <strong>{progressPct}%</strong>
            </div>
            <div style={{ height: "5px", borderRadius: "3px", background: "var(--muted)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: "3px", background: "var(--blue)", width: `${progressPct}%`, transition: "width 0.5s" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
