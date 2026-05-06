"use client";

import { motion } from "framer-motion";
import { getCurrentLevel, getNextLevel, LEVELS } from "@/lib/levels";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
  plan: string;
  created_at: string;
}
interface Course { id: string; status: string }
interface ProgressRow { lesson_id: string; completed_at: string }
interface Props {
  profile: Profile | null;
  courses: Course[];
  progress: ProgressRow[];
}

const badgeDefs = [
  { id: "first_lesson",   emoji: "⚡", name: "First Steps",      desc: "Complete your first lesson",     type: "blue",    req: (s: Stats) => s.lessons >= 1 },
  { id: "first_course",   emoji: "🔥", name: "On Fire",          desc: "Maintain a 3-day streak",         type: "gold",    req: (s: Stats) => s.streak >= 3 },
  { id: "lessons_10",     emoji: "📚", name: "Dedicated",        desc: "Complete 10 lessons",             type: "blue",    req: (s: Stats) => s.lessons >= 10 },
  { id: "xp_500",         emoji: "🎖", name: "Power Up",         desc: "Earn 500 XP",                     type: "gold",    req: (s: Stats) => s.xp >= 500 },
  { id: "streak_7",       emoji: "🗓", name: "Week Warrior",     desc: "Maintain a 7-day streak",         type: "blue",    req: (s: Stats) => s.streak >= 7 },
  { id: "course_complete",emoji: "🎓", name: "Graduate",         desc: "Complete a full course",          type: "blue",    req: (s: Stats) => s.completed >= 1 },
  { id: "xp_5000",        emoji: "🏆", name: "XP Legend",        desc: "Earn 5,000 XP",                   type: "gold",    req: (s: Stats) => s.xp >= 5000 },
  { id: "courses_10",     emoji: "👑", name: "Unstoppable",      desc: "Create 10 courses",               type: "gold",    req: (s: Stats) => s.total >= 10 },
  { id: "lessons_50",     emoji: "🧠", name: "Knowledge Seeker", desc: "Complete 50 lessons",             type: "blue",    req: (s: Stats) => s.lessons >= 50 },
  { id: "streak_30",      emoji: "🌟", name: "Monthly Master",   desc: "Maintain a 30-day streak",        type: "gold",    req: (s: Stats) => s.streak >= 30 },
  { id: "courses_3",      emoji: "🚀", name: "Course Collector", desc: "Create 3 courses",                type: "blue",    req: (s: Stats) => s.total >= 3 },
  { id: "xp_1000",        emoji: "💎", name: "Diamond Mind",     desc: "Earn 1,000 XP",                   type: "blue",    req: (s: Stats) => s.xp >= 1000 },
];

interface Stats { xp: number; streak: number; lessons: number; completed: number; total: number }

function getLevel(xp: number): string {
  if (xp >= 10000) return "Master";
  if (xp >= 5000) return "Expert";
  if (xp >= 2500) return "Scholar";
  if (xp >= 1000) return "Apprentice";
  return "Beginner";
}

export default function AchievementsClient({ profile, courses, progress }: Props) {
  const xp = profile?.total_xp ?? 0;
  const streak = profile?.current_streak ?? 0;
  const lessons = progress.length;
  const completed = courses.filter((c) => c.status === "completed").length;
  const total = courses.length;

  const stats: Stats = { xp, streak, lessons, completed, total };

  const currentLevel = getCurrentLevel(xp);
  const nextLevel = getNextLevel(xp);
  const levelPct = nextLevel
    ? Math.min(100, Math.round(((xp - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100))
    : 100;

  const badges = badgeDefs.map((b) => ({ ...b, earned: b.req(stats) }));
  const earnedCount = badges.filter((b) => b.earned).length;

  const panel: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xl)",
    padding: "18px",
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ fontFamily: "var(--font-bricolage)", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>
          Achievements
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
          {earnedCount}/{badges.length} badges earned
        </p>
      </div>

      {/* Stats row */}
      <div className="grid-stats-4" style={{ marginBottom: "22px" }}>
        {[
          { icon: "⚡", bg: "var(--blue-muted)", val: xp.toLocaleString("en-US"), lbl: "Total XP" },
          { icon: "🔥", bg: "var(--gold-muted)", val: streak, lbl: "Day Streak" },
          { icon: "📚", bg: "var(--emerald-muted)", val: lessons, lbl: "Lessons Done" },
          { icon: "🎓", bg: "var(--rose-muted, oklch(0.65 0.18 10 / 0.16))", val: completed, lbl: "Courses Complete" },
        ].map((s, i) => (
          <div key={i} style={{ ...panel, transition: "border-color 0.2s, transform 0.2s" }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--blue-border)"; el.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.transform = "translateY(0)"; }}
          >
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", display: "grid", placeItems: "center", fontSize: "16px", background: s.bg, marginBottom: "10px" }}>
              {s.icon}
            </div>
            <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "28px", fontWeight: 800, letterSpacing: "-1px", marginBottom: "2px" }}>{s.val}</div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Level card */}
      <div style={{ ...panel, marginBottom: "22px", background: "var(--gold-muted)", border: "1px solid var(--gold-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px",
            background: "oklch(0.76 0.16 75 / 0.3)", border: "2px solid var(--gold-border)",
            display: "grid", placeItems: "center", fontSize: "24px", flexShrink: 0,
          }}>
            🎓
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "18px", fontWeight: 800, letterSpacing: "-0.3px", marginBottom: "3px" }}>
              {currentLevel.name}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "8px" }}>
              {xp.toLocaleString("en-US")} XP
              {nextLevel && ` · ${(nextLevel.min - xp).toLocaleString("en-US")} to ${nextLevel.name}`}
            </div>
            <div style={{ height: "6px", borderRadius: "4px", background: "oklch(0.76 0.16 75 / 0.2)" }}>
              <motion.div
                style={{ height: "100%", borderRadius: "4px", background: "var(--gold)" }}
                initial={{ width: 0 }}
                animate={{ width: `${levelPct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "2px" }}>Progress</div>
            <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "18px", fontWeight: 800, color: "var(--gold)" }}>{levelPct}%</div>
          </div>
        </div>
      </div>

      {/* Level roadmap */}
      <div style={{ ...panel, marginBottom: "22px" }}>
        <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}>Level Roadmap</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {LEVELS.map((level, i) => {
            const LevelIcon = level.icon;
            const isReached = xp >= level.min;
            const isCurrent = currentLevel.name === level.name;
            return (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                  borderRadius: "var(--radius-lg)",
                  background: isCurrent ? "var(--blue-muted)" : "transparent",
                  border: `1px solid ${isCurrent ? "var(--blue-border)" : "transparent"}`,
                }}
              >
                <div style={{
                  width: "30px", height: "30px", borderRadius: "9px", display: "grid", placeItems: "center",
                  background: isReached ? "var(--blue-muted)" : "var(--muted)",
                  border: `1px solid ${isReached ? "var(--blue-border)" : "var(--border)"}`,
                  flexShrink: 0,
                }}>
                  <LevelIcon style={{ width: "14px", height: "14px", color: isReached ? "var(--blue)" : "var(--muted-foreground)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: isReached ? "var(--foreground)" : "var(--muted-foreground)" }}>
                    {level.name}
                    {isCurrent && <span style={{ fontSize: "10px", color: "var(--blue)", marginLeft: "8px", fontWeight: 700 }}>← You are here</span>}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                    {level.max === Infinity ? `${level.min.toLocaleString()}+ XP` : `${level.min.toLocaleString()} – ${level.max.toLocaleString()} XP`}
                  </p>
                </div>
                {isReached && <span style={{ color: "var(--emerald)", fontSize: "14px" }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge grid */}
      <div>
        <h3 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "15px", marginBottom: "14px" }}>Badges</h3>
        <div className="grid-badges-4">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.04 + i * 0.03 }}
              style={{
                background: badge.earned ? (badge.type === "gold" ? "var(--gold-muted)" : "var(--card)") : "var(--background)",
                border: `1px solid ${badge.earned ? (badge.type === "gold" ? "var(--gold-border)" : "var(--blue-border)") : "var(--border)"}`,
                borderRadius: "var(--radius-xl)",
                padding: "16px 10px",
                textAlign: "center",
                opacity: badge.earned ? 1 : 0.35,
                filter: badge.earned ? "none" : "grayscale(0.8)",
                transition: "border-color 0.2s, transform 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                if (!badge.earned) return;
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{badge.emoji}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "3px" }}>{badge.name}</div>
              <div style={{ fontSize: "10px", color: "var(--muted-foreground)", lineHeight: 1.4 }}>{badge.desc}</div>
              {badge.earned && (
                <div style={{ fontSize: "10px", color: "var(--gold)", marginTop: "4px", fontWeight: 600 }}>Earned ✓</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
