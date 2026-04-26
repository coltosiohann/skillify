"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  BookOpen,
  Zap,
  Clock,
  Target,
  Bookmark,
  WifiOff,
  PlayCircle,
  FileText,
  Wrench,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  url?: string;         // New format: real direct URL (video = YouTube search, docs = official URL, etc.)
  search_query?: string; // Legacy format — resolved below
}

/**
 * Returns the best possible href for a resource.
 * New courses have a real `url`. Legacy DB rows only have `search_query` —
 * those get routed to the most appropriate platform instead of generic Google.
 */
function resolveResourceHref(r: Resource): string {
  // New format — real URL provided by AI
  if (r.url && r.url !== "#") return r.url;

  // Legacy fallback — route to the best platform per type
  const q = r.search_query ?? r.title;
  const enc = encodeURIComponent(q);
  switch (r.type) {
    case "video":
      return `https://www.youtube.com/results?search_query=${enc}`;
    case "docs":
      return `https://www.google.com/search?q=${enc}+official+documentation`;
    case "tool":
      return `https://www.google.com/search?q=${enc}+official+site`;
    case "article":
    default:
      return `https://www.google.com/search?q=${enc}`;
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

const resourceTypeStyles: Record<string, { badge: string; icon: React.ReactNode; label: string }> = {
  video:   { badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",     icon: <PlayCircle className="w-4 h-4 text-red-500" />,    label: "Video" },
  article: { badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",   icon: <FileText className="w-4 h-4 text-blue-500" />,     label: "Article" },
  docs:    { badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700", icon: <BookOpen className="w-4 h-4 text-slate-500" />,    label: "Docs" },
  tool:    { badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800", icon: <Wrench className="w-4 h-4 text-amber-500" />,    label: "Tool" },
  course:  { badge: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800", icon: <GraduationCap className="w-4 h-4 text-violet-500" />, label: "Course" },
};

/** Extract a friendly platform name from a URL for display hints */
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
    if (host.includes("google.com")) return null; // hide google search fallback label
    // For anything else, capitalize the domain root
    const root = host.split(".")[0];
    return root.charAt(0).toUpperCase() + root.slice(1);
  } catch {
    return null;
  }
}

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  standard: "bg-blue-100 text-blue-700 border-blue-200",
  challenging: "bg-violet-100 text-violet-700 border-violet-200",
};

// Fallback markdown renderer using react-markdown + remark-gfm
// Supports headings, lists, code blocks, tables, blockquotes, bold, italic, and more
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-extrabold text-foreground mt-6 mb-3 font-heading">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold text-foreground mt-6 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-bold text-foreground mt-5 mb-2">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-foreground/80 leading-relaxed my-2">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-none space-y-1.5 my-3">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1.5 my-3 text-foreground/80">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="flex items-start gap-2 text-foreground/80">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <span>{children}</span>
          </li>
        ),
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <pre className="bg-[#0F172A] dark:bg-[#020617] text-slate-100 rounded-2xl p-4 text-sm font-mono overflow-x-auto my-4 leading-relaxed">
              <code>{children}</code>
            </pre>
          ) : (
            <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/40 pl-4 my-4 text-foreground/70 italic">{children}</blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-primary/5">{children}</thead>,
        th: ({ children }) => (
          <th className="border border-primary/15 px-3 py-2 text-left font-semibold text-foreground">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border border-primary/10 px-3 py-2 text-foreground/80">{children}</td>
        ),
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">{children}</a>
        ),
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt ?? ""} className="rounded-xl max-w-full my-4" />
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

  // #11 — scroll to top when lesson changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [lesson.id]);

  // #13 — keyboard shortcuts: ArrowLeft = prev, ArrowRight = next
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prevLessonId) {
        router.push(`/courses/${courseId}/lesson/${prevLessonId}`);
      }
      if (e.key === "ArrowRight" && nextLessonId) {
        router.push(`/courses/${courseId}/lesson/${nextLessonId}`);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevLessonId, nextLessonId, courseId, router]);

  const resources = Array.isArray(lesson.resources_json)
    ? (lesson.resources_json as Resource[])
    : [];

  const hasStructuredContent =
    lesson.content_json &&
    lesson.content_json.sections &&
    lesson.content_json.sections.length > 0;

  const handleAllSectionsViewed = useCallback(() => {
    setAllSectionsViewed(true);
  }, []);

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

      // Streak calculation with freeze support
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
        // Already active today, keep streak as-is
      } else if (lastActive === yesterday) {
        newStreak = newStreak + 1;
      } else if (lastActive === twoDaysAgo) {
        // Missed exactly one day — check if freeze is available this week
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const freezeUsedAt = profileAny.streak_freeze_used_at;
        const freezeUsedThisWeek = freezeUsedAt && new Date(freezeUsedAt) >= weekStart;

        if (!freezeUsedThisWeek) {
          // Auto-apply freeze: keep streak going
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

      // Calculate minutes spent on this lesson (capped at 120 min)
      const minutesSpent = Math.min(120, Math.round((Date.now() - lessonStartTime.current) / 60000));

      await supabase
        .from("profiles")
        .update({
          total_xp: (profile?.total_xp ?? 0) + lesson.xp_reward,
          current_streak: newStreak,
          last_active_date: today,
          total_minutes_learned: (profileAny?.total_minutes_learned ?? 0) + minutesSpent,
          ...freezeUpdate,
        } as never)
        .eq("id", userId);

      // Course completion check
      const completedIds = new Set(allLessons.filter((l) => l.completed).map((l) => l.id));
      completedIds.add(lesson.id);
      if (completedIds.size === allLessons.length) {
        await supabase
          .from("courses")
          .update({ status: "completed" })
          .eq("id", courseId);
      }

      // Module completion check
      const moduleCompletedIds = new Set(
        allLessons
          .filter((l) => currentModuleLessonIds.includes(l.id) && (l.completed || l.id === lesson.id))
          .map((l) => l.id)
      );
      const isLastInModule = currentModuleLessonIds.every((id) => moduleCompletedIds.has(id));

      setCompleted(true);

      // Milestone celebrations
      if (newStreak === 7) {
        toast.success(`🔥 7-day streak! You're on fire!`, { duration: 4000 });
      } else if (newStreak === 30) {
        toast.success(`🏆 30-day streak! Incredible dedication!`, { duration: 5000 });
      } else if (newStreak === 3) {
        toast.success(`⚡ 3-day streak! Keep it going!`, { duration: 3000 });
      } else if (lastActive !== today && newStreak > 1) {
        toast.success(`+${lesson.xp_reward} XP! 🔥 ${newStreak}-day streak!`);
      } else {
        toast.success(`+${lesson.xp_reward} XP earned!`);
      }
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

  return (
    <div className="lg:pr-72">
      <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link
          href="/dashboard"
          className="hover:text-foreground transition-colors cursor-pointer"
        >
          Dashboard
        </Link>
        <span>/</span>
        <Link
          href={`/courses/${courseId}`}
          className="hover:text-foreground transition-colors cursor-pointer"
        >
          {courseTitle}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">
          {lesson.title}
        </span>
      </div>

      {/* Module badge + metadata */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <BookOpen className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{moduleTitle}</span>
        <div className="ml-auto flex items-center gap-2">
          {lesson.estimated_minutes > 0 && (
            <Badge
              variant="outline"
              className="text-xs border-primary/15 gap-1"
            >
              <Clock className="w-3 h-3" />
              {lesson.estimated_minutes} min
            </Badge>
          )}
          {lesson.difficulty && lesson.difficulty !== "standard" && (
            <Badge
              className={`text-xs border capitalize ${
                difficultyColors[lesson.difficulty] ?? ""
              }`}
            >
              <Target className="w-3 h-3 mr-1" />
              {lesson.difficulty}
            </Badge>
          )}
          {completed && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              <CheckCircle className="w-3 h-3 mr-1" /> Completed
            </Badge>
          )}
          <button
            onClick={toggleBookmark}
            disabled={bookmarkLoading}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark this lesson"}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              bookmarked
                ? "bg-primary/10 text-primary hover:bg-primary/15"
                : "hover:bg-primary/8 text-muted-foreground hover:text-primary"
            } disabled:opacity-50`}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={() => {
              if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: "CACHE_LESSON",
                  url: window.location.href,
                });
                setSavedOffline(true);
                toast.success("Lesson saved for offline reading!");
              } else {
                toast("Offline saving not available", { description: "Service worker not active yet. Reload and try again." });
              }
            }}
            aria-label="Save for offline reading"
            title="Save for offline"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              savedOffline
                ? "bg-sky-100 text-sky-600 dark:bg-sky-900/30"
                : "hover:bg-primary/8 text-muted-foreground hover:text-sky-600"
            }`}
          >
            <WifiOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-heading text-3xl font-extrabold text-foreground mb-2"
      >
        {lesson.title}
      </motion.h1>
      <div className="flex items-center gap-2 mb-8 text-sm text-amber-600">
        <Zap className="w-4 h-4" />
        <span className="font-medium">{lesson.xp_reward} XP on completion</span>
      </div>

      {/* Content — structured or legacy */}
      {hasStructuredContent ? (
        <LessonStepper
          content={lesson.content_json!}
          onAllSectionsViewed={handleAllSectionsViewed}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-8 mb-6 shadow-lg shadow-primary/5"
        >
          <div className="prose max-w-none">
            <MarkdownRenderer content={lesson.content_markdown} />
          </div>
        </motion.div>
      )}

      {/* Resources */}
      {resources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-3xl p-6 mb-6 shadow-lg shadow-primary/5"
        >
          <h3 className="font-heading font-bold text-foreground mb-4">
            Further Reading
          </h3>
          <div className="space-y-2.5">
            {resources.map((r, i) => {
              const href = resolveResourceHref(r);
              const style = resourceTypeStyles[r.type] ?? {
                badge: "bg-gray-100 text-gray-700 border-gray-200",
                icon: <ExternalLink className="w-4 h-4 text-gray-500" />,
                label: r.type,
              };
              const platform = getPlatformLabel(href);
              return (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/10 hover:border-primary/30 hover:bg-primary/3 transition-all group cursor-pointer"
                >
                  {/* Type icon */}
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                    {style.icon}
                  </div>

                  {/* Title + platform */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {r.title}
                    </p>
                    {platform && (
                      <p className="text-xs text-muted-foreground mt-0.5">{platform}</p>
                    )}
                  </div>

                  {/* Badge + arrow */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`text-xs border capitalize hidden sm:inline-flex ${style.badge}`}>
                      {style.label}
                    </Badge>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </a>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Notes */}
      <LessonNotes lessonId={lesson.id} userId={userId} initialNote={initialNote} />

      {/* Mark Complete */}
      <div className="mb-8">
        <Button
          onClick={markComplete}
          disabled={completed || loading || (!!hasStructuredContent && !allSectionsViewed && !initialCompleted)}
          className={`w-full h-12 rounded-xl font-semibold gap-2 cursor-pointer transition-all ${
            completed
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
              : "bg-primary hover:bg-[#4338CA] text-white shadow-md shadow-primary/25"
          } disabled:opacity-60`}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : completed ? (
            <>
              <CheckCircle className="w-4 h-4" /> Completed!
            </>
          ) : hasStructuredContent && !allSectionsViewed ? (
            <>Complete all sections to finish</>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" /> Mark as Complete
            </>
          )}
        </Button>
      </div>

      {/* Navigation bar */}
      <div className="flex items-center gap-3 border-t border-primary/8 pt-6">
        {prevLessonId ? (
          <Link href={`/courses/${courseId}/lesson/${prevLessonId}`}>
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-primary/15 hover:bg-primary/5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>
          </Link>
        ) : (
          <Link href={`/courses/${courseId}`}>
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-primary/15 hover:bg-primary/5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Course
            </Button>
          </Link>
        )}

        <div className="flex-1 text-center">
          <span className="text-sm text-muted-foreground">
            Lesson {currentIndex + 1} of {totalLessons}
          </span>
        </div>

        {nextLessonId ? (
          <Link href={`/courses/${courseId}/lesson/${nextLessonId}`}>
            <Button
              className={`gap-2 rounded-xl cursor-pointer ${
                completed
                  ? "bg-primary hover:bg-[#4338CA] text-white shadow-md shadow-primary/25 animate-pulse"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Link href={`/courses/${courseId}`}>
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-primary/15 hover:bg-primary/5 cursor-pointer"
            >
              Back to Course
            </Button>
          </Link>
        )}
      </div>

      </div>

      {/* Progress panel — fixed sidebar, outside the constrained width div */}
      <LessonProgressPanel
        lessons={allLessons}
        currentLessonId={lesson.id}
        courseId={courseId}
      />
    </div>
  );
}
