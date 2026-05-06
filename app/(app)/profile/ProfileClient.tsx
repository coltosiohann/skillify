"use client";

import { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { getCurrentLevel, getNextLevel, LEVELS } from "@/lib/levels";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  total_xp: number;
  current_streak: number;
  courses_generated_this_month: number;
  created_at: string;
}
interface Course {
  id: string; title: string; status: string;
  domain: string; detected_level: string; created_at: string;
}
interface ProgressRow { lesson_id: string; completed_at: string; }
interface Props {
  profile: Profile | null; email: string;
  courses: Course[]; progress: ProgressRow[];
}

const badgeDefs = [
  { id: "first_lesson",    emoji: "⚡", name: "First Steps",      desc: "Complete your first lesson",  req: (s: Stats) => s.lessons >= 1 },
  { id: "first_course",    emoji: "🔥", name: "On Fire",          desc: "Maintain a 3-day streak",      req: (s: Stats) => s.streak >= 3 },
  { id: "lessons_10",      emoji: "📚", name: "Dedicated",        desc: "Complete 10 lessons",           req: (s: Stats) => s.lessons >= 10 },
  { id: "xp_500",          emoji: "🎖", name: "Power Up",         desc: "Earn 500 XP",                  req: (s: Stats) => s.xp >= 500 },
  { id: "streak_7",        emoji: "🗓", name: "Week Warrior",     desc: "Maintain a 7-day streak",       req: (s: Stats) => s.streak >= 7 },
  { id: "course_complete", emoji: "🎓", name: "Graduate",         desc: "Complete a full course",        req: (s: Stats) => s.completed >= 1 },
  { id: "xp_5000",         emoji: "🏆", name: "XP Legend",        desc: "Earn 5,000 XP",                req: (s: Stats) => s.xp >= 5000 },
  { id: "courses_10",      emoji: "👑", name: "Unstoppable",      desc: "Create 10 courses",             req: (s: Stats) => s.total >= 10 },
  { id: "lessons_50",      emoji: "🧠", name: "Knowledge Seeker", desc: "Complete 50 lessons",           req: (s: Stats) => s.lessons >= 50 },
  { id: "streak_30",       emoji: "🌟", name: "Monthly Master",   desc: "Maintain a 30-day streak",      req: (s: Stats) => s.streak >= 30 },
  { id: "courses_3",       emoji: "🚀", name: "Course Collector", desc: "Create 3 courses",              req: (s: Stats) => s.total >= 3 },
  { id: "xp_1000",         emoji: "💎", name: "Diamond Mind",     desc: "Earn 1,000 XP",                req: (s: Stats) => s.xp >= 1000 },
];

interface Stats { xp: number; streak: number; lessons: number; completed: number; total: number }
type Tab = "badges" | "courses" | "activity";

function heatmapColor(level: number) {
  if (level === 0) return "var(--muted)";
  if (level === 1) return "oklch(0.53 0.23 256 / 0.25)";
  if (level === 2) return "oklch(0.53 0.23 256 / 0.5)";
  if (level === 3) return "oklch(0.53 0.23 256 / 0.75)";
  return "var(--blue)";
}

export default function ProfileClient({ profile, email, courses, progress }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("badges");
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const xp = profile?.total_xp ?? 0;
  const streak = profile?.current_streak ?? 0;
  const lessons = progress.length;
  const completed = courses.filter((c) => c.status === "completed").length;
  const total = courses.length;

  const currentLevel = getCurrentLevel(xp);
  const nextLevel = getNextLevel(xp);
  const levelPct = nextLevel
    ? Math.min(100, Math.round(((xp - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100))
    : 100;
  const LevelIcon = currentLevel.icon;

  const joinDate = new Date(profile?.created_at ?? Date.now())
    .toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const initials = (profile?.full_name ?? email)
    ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "SK";

  const stats: Stats = { xp, streak, lessons, completed, total };
  const badges = badgeDefs.map((b) => ({ ...b, earned: b.req(stats) }));
  const earnedCount = badges.filter((b) => b.earned).length;

  // Build activity heatmap (last 12 weeks = 84 days)
  const heatmapCols = useMemo(() => {
    const today = new Date();
    const counts: Record<string, number> = {};
    progress.forEach((p) => {
      const key = new Date(p.completed_at).toISOString().slice(0, 10);
      counts[key] = (counts[key] ?? 0) + 1;
    });
    const cells = Array.from({ length: 84 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (83 - i));
      const key = d.toISOString().slice(0, 10);
      const n = counts[key] ?? 0;
      const level = n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4;
      return { date: key, level };
    });
    const cols: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));
    return cols;
  }, [progress]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }
    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const cacheBusted = `${publicUrl}?t=${Date.now()}`;
      const { error: updateErr } = await supabase
        .from("profiles").update({ avatar_url: cacheBusted } as never)
        .eq("id", user.id);
      if (updateErr) throw updateErr;
      setAvatarUrl(cacheBusted);
      toast.success("Avatar updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles")
        .update({ full_name: fullName.trim() || null })
        .eq("id", (await supabase.auth.getUser()).data.user!.id);
      if (error) throw error;
      setSaved(true);
      toast.success("Profile saved!");
      setTimeout(() => setSaved(false), 2000);
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }

  const panel: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xl)",
    padding: "18px",
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: "22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-bricolage)", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>
            Profile
          </h1>
          <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
            Your learning identity and stats
          </p>
        </div>
        <button
          onClick={() => setEditOpen((o) => !o)}
          style={{
            padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
            background: "var(--card)", border: "1px solid var(--border)",
            color: "var(--foreground)", cursor: "pointer", fontFamily: "inherit",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--blue-border)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
        >
          Edit Profile
        </button>
      </div>

      <div className="layout-profile">

        {/* ── Left column ── */}
        <div>
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-2xl)", padding: "28px", textAlign: "center",
          }}>
            {/* Avatar */}
            <div style={{ position: "relative", display: "inline-block", marginBottom: "14px" }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl} alt="avatar"
                  style={{ width: "80px", height: "80px", borderRadius: "50%", border: "3px solid var(--blue-border)", objectFit: "cover" }}
                />
              ) : (
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  background: "var(--blue-muted)", border: "3px solid var(--blue-border)",
                  display: "grid", placeItems: "center",
                  fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: "28px", color: "var(--blue)",
                }}>
                  {initials}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Change avatar"
                style={{
                  position: "absolute", bottom: "-2px", right: "-2px",
                  width: "26px", height: "26px", borderRadius: "50%",
                  background: "var(--blue)", border: "2px solid var(--background)",
                  display: "grid", placeItems: "center", cursor: "pointer", fontSize: "11px",
                }}
              >
                {uploadingAvatar ? "…" : "📷"}
              </button>
            </div>

            <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.4px", marginBottom: "3px" }}>
              {profile?.full_name ?? "No name set"}
            </div>
            <div style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "14px" }}>
              {email} · Member since {joinDate}
            </div>

            {/* Level badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <div style={{
                background: "var(--gold-muted)", border: "1px solid var(--gold-border)",
                borderRadius: "10px", padding: "6px 14px",
                fontSize: "13px", fontWeight: 700, color: "var(--gold)",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <LevelIcon style={{ width: "14px", height: "14px" }} />
                {currentLevel.name}
              </div>
            </div>

            {/* 2×2 stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "16px 0" }}>
              {[
                { val: xp.toLocaleString("en-US"), lbl: "Total XP",    gold: true },
                { val: `🔥 ${streak}`,              lbl: "Day Streak",  gold: true },
                { val: String(lessons),             lbl: "Lessons Done", gold: false },
                { val: String(completed),           lbl: "Courses Done", gold: false },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--background)", borderRadius: "var(--radius-lg)", padding: "12px", textAlign: "center" }}>
                  <div style={{
                    fontFamily: "var(--font-bricolage)", fontSize: "22px", fontWeight: 800,
                    letterSpacing: "-1px", marginBottom: "2px",
                    color: s.gold ? "var(--gold)" : "var(--foreground)",
                  }}>
                    {s.val}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* XP progress bar */}
            <div style={{ background: "var(--background)", borderRadius: "var(--radius-xl)", padding: "16px", marginTop: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                <span style={{ fontWeight: 700 }}>{currentLevel.name}</span>
                <span style={{ color: "var(--muted-foreground)", fontSize: "12px" }}>
                  {nextLevel
                    ? `${(nextLevel.min - xp).toLocaleString("en-US")} XP to ${nextLevel.name}`
                    : "Max level reached"}
                </span>
              </div>
              <div style={{ height: "8px", borderRadius: "4px", background: "var(--muted)", overflow: "hidden" }}>
                <motion.div
                  style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(90deg, var(--blue), var(--gold))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${levelPct}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted-foreground)", marginTop: "5px" }}>
                {LEVELS.slice(0, 4).map((l) => (
                  <span key={l.name}>{l.name}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Edit profile form (collapsible) */}
          {editOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ ...panel, marginTop: "16px" }}
            >
              <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}>
                Edit Profile
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "12px", color: "var(--muted-foreground)", display: "block", marginBottom: "4px" }}>Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: "10px",
                    border: "1px solid var(--border)", background: "var(--background)",
                    color: "var(--foreground)", fontSize: "13px", fontFamily: "inherit",
                    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--blue-border)"; }}
                  onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "var(--border)"; }}
                />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: "var(--muted-foreground)", display: "block", marginBottom: "4px" }}>Email</label>
                <input
                  value={email}
                  disabled
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: "10px",
                    border: "1px solid var(--border)", background: "var(--muted)",
                    color: "var(--muted-foreground)", fontSize: "13px", fontFamily: "inherit",
                    cursor: "not-allowed", boxSizing: "border-box",
                  }}
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  width: "100%", padding: "10px", borderRadius: "10px",
                  fontSize: "13px", fontWeight: 600, fontFamily: "inherit", border: "none",
                  background: saved ? "var(--emerald)" : "var(--blue)",
                  color: "#fff", cursor: saving ? "wait" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
              </button>
            </motion.div>
          )}
        </div>

        {/* ── Right column ── */}
        <div>
          {/* Tab bar */}
          <div style={{
            display: "flex", gap: "2px",
            background: "var(--muted)", borderRadius: "var(--radius-lg)", padding: "3px",
            marginBottom: "20px",
          }}>
            {(["badges", "courses", "activity"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  flex: 1, padding: "7px 0", textAlign: "center",
                  fontSize: "13px", fontWeight: 600, borderRadius: "9px",
                  cursor: "pointer", fontFamily: "inherit", border: "none",
                  background: activeTab === t ? "var(--card)" : "transparent",
                  color: activeTab === t ? "var(--foreground)" : "var(--muted-foreground)",
                  boxShadow: activeTab === t ? "0 1px 4px oklch(0 0 0 / 0.12)" : "none",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {t === "badges" ? "Badges" : t === "courses" ? "Completed Courses" : "Activity"}
              </button>
            ))}
          </div>

          {/* ── Badges tab ── */}
          {activeTab === "badges" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "15px" }}>Earned Badges</span>
                <span style={{
                  background: "var(--gold-muted)", border: "1px solid var(--gold-border)",
                  borderRadius: "99px", padding: "3px 10px", fontSize: "12px", fontWeight: 600, color: "var(--gold)",
                }}>
                  {earnedCount} / {badges.length} unlocked
                </span>
              </div>
              <div className="grid-badges-4">
                {badges.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.03 + i * 0.025 }}
                    style={{
                      background: badge.earned ? "var(--gold-muted)" : "var(--card)",
                      border: `1px solid ${badge.earned ? "var(--gold-border)" : "var(--border)"}`,
                      borderRadius: "var(--radius-xl)", padding: "16px 10px",
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
                      el.style.borderColor = "var(--gold)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(0)";
                      el.style.borderColor = badge.earned ? "var(--gold-border)" : "var(--border)";
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
          )}

          {/* ── Completed Courses tab ── */}
          {activeTab === "courses" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "15px" }}>Completed Courses</span>
                <span style={{
                  background: "var(--emerald-muted)", border: "1px solid oklch(0.63 0.15 162 / 0.35)",
                  borderRadius: "99px", padding: "3px 10px", fontSize: "12px", fontWeight: 600, color: "var(--emerald)",
                }}>
                  {completed} course{completed !== 1 ? "s" : ""}
                </span>
              </div>
              {completed === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>🎓</div>
                  <p style={{ fontSize: "14px", color: "var(--muted-foreground)", marginBottom: "14px" }}>No completed courses yet</p>
                  <Link href="/courses">
                    <button style={{
                      padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                      background: "var(--blue)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit",
                    }}>
                      Browse courses
                    </button>
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {courses.filter((c) => c.status === "completed").map((c) => (
                    <Link key={c.id} href={`/courses/${c.id}`} style={{ textDecoration: "none" }}>
                      <div
                        style={{
                          display: "flex", alignItems: "center", gap: "14px",
                          background: "var(--card)", border: "1px solid var(--border)",
                          borderRadius: "var(--radius-xl)", padding: "16px",
                          transition: "border-color 0.2s", cursor: "pointer",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--blue-border)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                      >
                        <div style={{
                          width: "44px", height: "44px", borderRadius: "12px",
                          background: "var(--blue-muted)", display: "grid", placeItems: "center",
                          fontSize: "20px", flexShrink: 0,
                        }}>📚</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "15px", fontWeight: 700, letterSpacing: "-0.2px", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.title}
                          </div>
                          <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "var(--muted-foreground)" }}>
                            <span>{c.domain}</span>
                            <span>{c.detected_level}</span>
                            <span>🎓 Certificate earned</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "11px", color: "var(--muted-foreground)" }}>
                            {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Activity heatmap tab ── */}
          {activeTab === "activity" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "15px" }}>Learning Activity</span>
                <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Last 12 weeks</span>
              </div>
              <div style={{ ...panel, overflowX: "auto" }}>
                <div style={{ display: "flex", gap: "3px", minWidth: "fit-content" }}>
                  {heatmapCols.map((col, ci) => (
                    <div key={ci} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      {col.map((cell, ri) => (
                        <div
                          key={ri}
                          title={`${cell.date}: ${cell.level} lesson${cell.level !== 1 ? "s" : ""}`}
                          style={{
                            width: "13px", height: "13px", borderRadius: "3px",
                            background: heatmapColor(cell.level),
                            transition: "transform 0.15s",
                            cursor: "default",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.35)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", fontSize: "11px", color: "var(--muted-foreground)" }}>
                  <span>Less</span>
                  {[0, 1, 2, 3, 4].map((l) => (
                    <div key={l} style={{ width: "12px", height: "12px", borderRadius: "3px", background: heatmapColor(l) }} />
                  ))}
                  <span>More</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
