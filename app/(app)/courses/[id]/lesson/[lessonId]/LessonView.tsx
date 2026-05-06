"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Bookmark,
  WifiOff,
  PlayCircle,
  FileText,
  BookOpen,
  Wrench,
  GraduationCap,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { LessonContent } from "@/lib/types/lesson-content";
import LessonStepper from "@/components/lesson/LessonStepper";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LessonProgressPanel, {
  type LessonNavItem,
} from "@/components/lesson/LessonProgressPanel";
import LessonNotes from "@/components/lesson/LessonNotes";
import { logError } from "@/lib/logger";

interface Resource {
  type: string;
  title: string;
  url?: string;
  search_query?: string;
}

function resolveResourceHref(r: Resource): string {
  if (r.url && r.url !== "#") return r.url;
  const q = r.search_query ?? r.title;
  const enc = encodeURIComponent(q);
  switch (r.type) {
    case "video":   return `https://www.youtube.com/results?search_query=${enc}`;
    case "docs":    return `https://www.google.com/search?q=${enc}+official+documentation`;
    case "tool":    return `https://www.google.com/search?q=${enc}+official+site`;
    default:        return `https://www.google.com/search?q=${enc}`;
  }
}

interface Lesson {
  id: string;
  title: string;
  content_markdown: string;
  content_json: LessonContent | null;
  resources_json: Resource[] | null;
  xp_reward: number;
  estimated_minutes: number;
  difficulty: string;
}

interface Props {
  lesson: Lesson;
  courseId: string;
  moduleId: string;
  currentModuleLessonIds: string[];
  moduleTitle: string;
  courseTitle: string;
  isCompleted: boolean;
  isBookmarked: boolean;
  initialNote: string;
  userId: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
  currentIndex: number;
  totalLessons: number;
  allLessons: LessonNavItem[];
}

const resourceTypeConfig: Record<string, { icon: React.ReactNode; label: string; bg: string; color: string }> = {
  video:   { icon: <PlayCircle style={{ width: "16px", height: "16px", color: "oklch(0.60 0.20 25)" }} />,   label: "Video",   bg: "oklch(0.60 0.20 25 / 0.12)",  color: "oklch(0.60 0.20 25)" },
  article: { icon: <FileText   style={{ width: "16px", height: "16px", color: "var(--blue)" }} />,            label: "Article", bg: "var(--blue-muted)",            color: "var(--blue)" },
  docs:    { icon: <BookOpen   style={{ width: "16px", height: "16px", color: "var(--muted-foreground)" }} />, label: "Docs",    bg: "var(--muted)",                 color: "var(--muted-foreground)" },
  tool:    { icon: <Wrench     style={{ width: "16px", height: "16px", color: "var(--gold)" }} />,            label: "Tool",    bg: "var(--gold-muted)",            color: "var(--gold)" },
  course:  { icon: <GraduationCap style={{ width: "16px", height: "16px", color: "oklch(0.72 0.18 290)" }} />, label: "Course", bg: "oklch(0.55 0.2 290 / 0.15)",  color: "oklch(0.72 0.18 290)" },
};

function getPlatformLabel(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("developer.mozilla.org")) return "MDN";
    if (host.includes("react.dev")) return "React Docs";
    if (host.includes("docs.python.org")) return "Python Docs";
    if (host.includes("docs.swift.org")) return "Swift Docs";
    if (host.includes("developer.apple.com")) return "Apple Developer";
    if (host.includes("docs.microsoft.com") || host.includes("learn.microsoft.com")) return "Microsoft Learn";
    if (host.includes("github.com")) return "GitHub";
    if (host.includes("medium.com")) return "Medium";
    if (host.includes("dev.to")) return "DEV";
    if (host.includes("stackoverflow.com")) return "Stack Overflow";
    if (host.includes("npmjs.com")) return "npm";
    if (host.includes("freecodecamp.org")) return "freeCodeCamp";
    if (host.includes("w3schools.com")) return "W3Schools";
    if (host.includes("google.com")) return null;
    const root = host.split(".")[0];
    return root.charAt(0).toUpperCase() + root.slice(1);
  } catch {
    return null;
  }
}

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 style={{ fontFamily: "var(--font-bricolage)", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.4px", marginTop: "24px", marginBottom: "12px", color: "var(--foreground)" }}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 style={{ fontFamily: "var(--font-bricolage)", fontSize: "20px", fontWeight: 700, marginTop: "24px", marginBottom: "10px", color: "var(--foreground)" }}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 style={{ fontFamily: "var(--font-bricolage)", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.2px", marginTop: "20px", marginBottom: "8px", color: "var(--foreground)" }}>{children}</h3>
        ),
        p: ({ children }) => (
          <p style={{ marginBottom: "16px", lineHeight: 1.8, fontSize: "16px", color: "var(--foreground)" }}>{children}</p>
        ),
        ul: ({ children }) => <ul style={{ margin: "0 0 16px 20px" }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ listStyle: "decimal", margin: "0 0 16px 20px" }}>{children}</ol>,
        li: ({ children }) => (
          <li style={{ marginBottom: "5px", fontSize: "15px", color: "var(--foreground)", lineHeight: 1.7 }}>{children}</li>
        ),
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <pre style={{ background: "oklch(0.07 0.012 255)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "20px 24px", margin: "18px 0", fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace", fontSize: "14px", lineHeight: 1.7, overflowX: "auto" }}>
              <code>{children}</code>
            </pre>
          ) : (
            <code style={{ background: "var(--blue-muted)", color: "var(--blue)", padding: "2px 6px", borderRadius: "5px", fontSize: "14px", fontFamily: "monospace" }} {...props}>{children}</code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote style={{ borderLeft: "4px solid var(--blue-border)", paddingLeft: "16px", margin: "16px 0", color: "var(--muted-foreground)", fontStyle: "italic" }}>{children}</blockquote>
        ),
        table: ({ children }) => (
          <div style={{ overflowX: "auto", margin: "16px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead style={{ background: "var(--muted)" }}>{children}</thead>,
        th: ({ children }) => (
          <th style={{ border: "1px solid var(--border)", padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>{children}</th>
        ),
        td: ({ children }) => (
          <td style={{ border: "1px solid var(--border)", padding: "8px 12px", color: "var(--foreground)" }}>{children}</td>
        ),
        strong: ({ children }) => <strong style={{ fontWeight: 600, color: "var(--foreground)" }}>{children}</strong>,
        em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", textDecoration: "underline" }}>{children}</a>
        ),
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt ?? ""} style={{ borderRadius: "var(--radius-xl)", maxWidth: "100%", margin: "16px 0" }} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function LessonView({
  lesson,
  courseId,
  moduleId,
  currentModuleLessonIds,
  moduleTitle,
  courseTitle,
  isCompleted: initialCompleted,
  isBookmarked: initialBookmarked,
  initialNote,
  userId,
  prevLessonId,
  nextLessonId,
  currentIndex,
  totalLessons,
  allLessons,
}: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [allSectionsViewed, setAllSectionsViewed] = useState(false);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const lessonStartTime = useRef(Date.now());
  const supabase = createClient();
  const router = useRouter();

  async function toggleBookmark() {
    if (bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        await supabase.from("bookmarks").delete().eq("user_id", userId).eq("lesson_id", lesson.id);
        setBookmarked(false);
        toast.success("Bookmark removed");
      } else {
        await supabase.from("bookmarks").insert({ user_id: userId, lesson_id: lesson.id } as never);
        setBookmarked(true);
        toast.success("Lesson bookmarked!");
      }
    } catch (err) {
      logError("lesson/bookmark", err);
      toast.error("Failed to update bookmark");
    } finally {
      setBookmarkLoading(false);
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [lesson.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prevLessonId) router.push(`/courses/${courseId}/lesson/${prevLessonId}`);
      if (e.key === "ArrowRight" && nextLessonId) router.push(`/courses/${courseId}/lesson/${nextLessonId}`);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevLessonId, nextLessonId, courseId, router]);

  const resources = Array.isArray(lesson.resources_json) ? (lesson.resources_json as Resource[]) : [];
  const hasStructuredContent = lesson.content_json?.sections && lesson.content_json.sections.length > 0;
  const handleAllSectionsViewed = useCallback(() => setAllSectionsViewed(true), []);

  async function markComplete() {
    if (completed || loading) return;
    setLoading(true);
    try {
      const { error: progressErr } = await supabase
        .from("progress")
        .insert({ user_id: userId, lesson_id: lesson.id } as never);
      if (progressErr && progressErr.code !== "23505") throw progressErr;

      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp, current_streak, last_active_date, streak_freeze_used_at, streak_freeze_count, total_minutes_learned")
        .eq("id", userId)
        .single();

      const today = new Date().toISOString().split("T")[0];
      const lastActive = (profile as unknown as { last_active_date: string | null })?.last_active_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
      const profileAny = profile as unknown as {
        last_active_date: string | null;
        streak_freeze_used_at: string | null;
        streak_freeze_count: number;
        total_minutes_learned: number;
      };
      let newStreak = profile?.current_streak ?? 0;
      let freezeUpdate: Record<string, unknown> = {};

      if (lastActive === today) {
        // already active today
      } else if (lastActive === yesterday) {
        newStreak = newStreak + 1;
      } else if (lastActive === twoDaysAgo) {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const freezeUsedAt = profileAny.streak_freeze_used_at;
        const freezeUsedThisWeek = freezeUsedAt && new Date(freezeUsedAt) >= weekStart;
        if (!freezeUsedThisWeek) {
          newStreak = newStreak + 1;
          freezeUpdate = {
            streak_freeze_used_at: yesterday,
            streak_freeze_count: (profileAny.streak_freeze_count ?? 0) + 1,
          };
          toast("Streak freeze used! 🧊", { description: "You missed a day — your streak was protected. 1 freeze per week." });
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const minutesSpent = Math.min(120, Math.round((Date.now() - lessonStartTime.current) / 60000));

      await supabase.from("profiles").update({
        total_xp: (profile?.total_xp ?? 0) + lesson.xp_reward,
        current_streak: newStreak,
        last_active_date: today,
        total_minutes_learned: (profileAny?.total_minutes_learned ?? 0) + minutesSpent,
        ...freezeUpdate,
      } as never).eq("id", userId);

      const completedIds = new Set(allLessons.filter((l) => l.completed).map((l) => l.id));
      completedIds.add(lesson.id);
      if (completedIds.size === allLessons.length) {
        await supabase.from("courses").update({ status: "completed" }).eq("id", courseId);
      }

      const moduleCompletedIds = new Set(
        allLessons
          .filter((l) => currentModuleLessonIds.includes(l.id) && (l.completed || l.id === lesson.id))
          .map((l) => l.id)
      );
      const isLastInModule = currentModuleLessonIds.every((id) => moduleCompletedIds.has(id));

      setCompleted(true);

      if (newStreak === 7) toast.success(`🔥 7-day streak! You're on fire!`, { duration: 4000 });
      else if (newStreak === 30) toast.success(`🏆 30-day streak! Incredible dedication!`, { duration: 5000 });
      else if (newStreak === 3) toast.success(`⚡ 3-day streak! Keep it going!`, { duration: 3000 });
      else if (lastActive !== today && newStreak > 1) toast.success(`+${lesson.xp_reward} XP! 🔥 ${newStreak}-day streak!`);
      else toast.success(`+${lesson.xp_reward} XP earned!`);

      router.refresh();

      if (isLastInModule) {
        setTimeout(() => {
          toast("Module complete! Take the quiz to earn bonus XP 🧠", { icon: "🎯" });
          router.push(`/courses/${courseId}/quiz?moduleId=${moduleId}`);
        }, 1500);
      } else if (nextLessonId) {
        setTimeout(() => {
          toast("Continuing to next lesson...", { icon: "➡️" });
          router.push(`/courses/${courseId}/lesson/${nextLessonId}`);
        }, 1500);
      } else {
        toast.success("Course complete! Amazing work! 🎉");
      }
    } catch (err) {
      console.error("markComplete error:", err);
      toast.error("Failed to mark complete");
    } finally {
      setLoading(false);
    }
  }

  const panel: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xl)",
  };

  const canComplete = !completed && !loading && !(!!hasStructuredContent && !allSectionsViewed && !initialCompleted);

  return (
    <div style={{ paddingRight: "0" }} className="lg:pr-72">
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px", flexWrap: "wrap" }}>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "var(--muted-foreground)", transition: "color 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}
          >Dashboard</Link>
          <span>/</span>
          <Link href={`/courses/${courseId}`} style={{ textDecoration: "none", color: "var(--muted-foreground)", transition: "color 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}
          >{courseTitle}</Link>
          <span>/</span>
          <span style={{ color: "var(--foreground)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "clamp(120px, 30vw, 260px)" }}>{lesson.title}</span>
        </div>

        {/* Module tag + action row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--muted-foreground)" }}>
            <BookOpen style={{ width: "13px", height: "13px" }} />
            <span>{moduleTitle}</span>
            <span style={{ color: "var(--border)" }}>·</span>
            <span>Lesson {currentIndex + 1} of {totalLessons}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {completed && (
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: "var(--emerald)", background: "var(--emerald-muted)", padding: "4px 10px", borderRadius: "99px" }}>
                <CheckCircle style={{ width: "12px", height: "12px" }} /> Completed
              </span>
            )}
            <button
              onClick={toggleBookmark}
              disabled={bookmarkLoading}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
              style={{
                width: "32px", height: "32px", borderRadius: "9px", border: "1px solid var(--border)",
                background: bookmarked ? "var(--blue-muted)" : "var(--card)",
                display: "grid", placeItems: "center", cursor: "pointer", transition: "border-color 0.2s",
              }}
            >
              <Bookmark style={{ width: "14px", height: "14px", color: bookmarked ? "var(--blue)" : "var(--muted-foreground)", fill: bookmarked ? "var(--blue)" : "none" }} />
            </button>
            <button
              onClick={() => {
                if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({ type: "CACHE_LESSON", url: window.location.href });
                  setSavedOffline(true);
                  toast.success("Lesson saved for offline reading!");
                } else {
                  toast("Offline saving not available", { description: "Service worker not active yet. Reload and try again." });
                }
              }}
              aria-label="Save for offline"
              style={{
                width: "32px", height: "32px", borderRadius: "9px", border: "1px solid var(--border)",
                background: savedOffline ? "var(--blue-muted)" : "var(--card)",
                display: "grid", placeItems: "center", cursor: "pointer",
              }}
            >
              <WifiOff style={{ width: "14px", height: "14px", color: savedOffline ? "var(--blue)" : "var(--muted-foreground)" }} />
            </button>
          </div>
        </div>

        {/* Lesson eyebrow */}
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "10px" }}>
          {moduleTitle} · Lesson {currentIndex + 1} of {totalLessons}
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: "var(--font-bricolage)", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.8px", lineHeight: 1.15, marginBottom: "14px", color: "var(--foreground)" }}
        >
          {lesson.title}
        </motion.h1>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
          {lesson.estimated_minutes > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--muted-foreground)" }}>
              ⏱ {lesson.estimated_minutes} min read
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--muted-foreground)" }}>
            ⚡ +{lesson.xp_reward} XP
          </span>
          {lesson.difficulty && lesson.difficulty !== "standard" && (
            <span style={{
              fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "99px", textTransform: "capitalize",
              background: lesson.difficulty === "easy" ? "var(--emerald-muted)" : lesson.difficulty === "challenging" ? "oklch(0.55 0.2 290 / 0.15)" : "var(--blue-muted)",
              color: lesson.difficulty === "easy" ? "var(--emerald)" : lesson.difficulty === "challenging" ? "oklch(0.72 0.18 290)" : "var(--blue)",
            }}>
              {lesson.difficulty}
            </span>
          )}
        </div>

        {/* Content */}
        {hasStructuredContent ? (
          <LessonStepper content={lesson.content_json!} onAllSectionsViewed={handleAllSectionsViewed} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ ...panel, padding: "32px", marginBottom: "20px" }}
          >
            <MarkdownRenderer content={lesson.content_markdown} />
          </motion.div>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ ...panel, padding: "24px", marginBottom: "20px" }}
          >
            <h3 style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "15px", marginBottom: "14px" }}>Further Reading</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {resources.map((r, i) => {
                const href = resolveResourceHref(r);
                const cfg = resourceTypeConfig[r.type] ?? {
                  icon: <ExternalLink style={{ width: "16px", height: "16px", color: "var(--muted-foreground)" }} />,
                  label: r.type, bg: "var(--muted)", color: "var(--muted-foreground)",
                };
                const platform = getPlatformLabel(href);
                return (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "12px 14px", borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--border)", textDecoration: "none",
                      transition: "border-color 0.2s, background 0.2s",
                    }}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--blue-border)"; el.style.background = "var(--blue-muted)"; }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.background = "transparent"; }}
                  >
                    <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: cfg.bg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                      {platform && <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "1px" }}>{platform}</div>}
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "99px", background: cfg.bg, color: cfg.color, flexShrink: 0, textTransform: "capitalize" }}>
                      {cfg.label}
                    </span>
                    <ExternalLink style={{ width: "13px", height: "13px", color: "var(--muted-foreground)", flexShrink: 0 }} />
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Notes */}
        <LessonNotes lessonId={lesson.id} userId={userId} initialNote={initialNote} />

        {/* Mark Complete */}
        <div style={{ marginBottom: "28px" }}>
          <button
            onClick={markComplete}
            disabled={!canComplete}
            style={{
              width: "100%", height: "48px", borderRadius: "12px",
              fontSize: "14px", fontWeight: 600, fontFamily: "inherit",
              border: "none", cursor: canComplete ? "pointer" : "default",
              background: completed ? "var(--emerald)" : canComplete ? "var(--blue)" : "var(--muted)",
              color: (completed || canComplete) ? "#fff" : "var(--muted-foreground)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "background 0.2s", opacity: !canComplete && !completed ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!canComplete) return;
              (e.currentTarget as HTMLElement).style.background = completed ? "var(--emerald)" : "var(--blue-hover)";
            }}
            onMouseLeave={(e) => {
              if (!canComplete) return;
              (e.currentTarget as HTMLElement).style.background = completed ? "var(--emerald)" : "var(--blue)";
            }}
          >
            {loading ? (
              <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            ) : completed ? (
              <><CheckCircle style={{ width: "16px", height: "16px" }} /> Completed!</>
            ) : hasStructuredContent && !allSectionsViewed ? (
              "Complete all sections to finish"
            ) : (
              <><CheckCircle style={{ width: "16px", height: "16px" }} /> Mark as Complete &amp; Continue</>
            )}
          </button>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
          <Link href={prevLessonId ? `/courses/${courseId}/lesson/${prevLessonId}` : `/courses/${courseId}`} style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", borderRadius: "10px",
              fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
              background: "var(--card)", border: "1px solid var(--border)",
              color: "var(--foreground)", cursor: "pointer", transition: "border-color 0.2s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--blue-border)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
            >
              ← {prevLessonId ? "Previous" : "Course"}
            </button>
          </Link>
          <div style={{ flex: 1, textAlign: "center", fontSize: "13px", color: "var(--muted-foreground)" }}>
            {currentIndex + 1} / {totalLessons}
          </div>
          <Link href={nextLessonId ? `/courses/${courseId}/lesson/${nextLessonId}` : `/courses/${courseId}`} style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", borderRadius: "10px",
              fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
              background: completed && nextLessonId ? "var(--blue)" : "var(--card)",
              border: `1px solid ${completed && nextLessonId ? "transparent" : "var(--border)"}`,
              color: completed && nextLessonId ? "#fff" : "var(--foreground)",
              cursor: "pointer", transition: "background 0.2s, border-color 0.2s",
            }}
              onMouseEnter={(e) => {
                if (!(completed && nextLessonId)) (e.currentTarget as HTMLElement).style.borderColor = "var(--blue-border)";
              }}
              onMouseLeave={(e) => {
                if (!(completed && nextLessonId)) (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}
            >
              {nextLessonId ? "Next →" : "Back to Course"}
            </button>
          </Link>
        </div>

      </div>

      <LessonProgressPanel lessons={allLessons} currentLessonId={lesson.id} courseId={courseId} />
    </div>
  );
}
