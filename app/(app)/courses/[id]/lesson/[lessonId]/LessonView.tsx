"use client";

import { useState, useCallback } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { LessonContent } from "@/lib/types/lesson-content";
import LessonStepper from "@/components/lesson/LessonStepper";
import LessonProgressPanel, {
  type LessonNavItem,
} from "@/components/lesson/LessonProgressPanel";

interface Resource {
  type: string;
  title: string;
  url: string;
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
  moduleTitle: string;
  courseTitle: string;
  isCompleted: boolean;
  userId: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
  currentIndex: number;
  totalLessons: number;
  allLessons: LessonNavItem[];
}

const resourceTypeColors: Record<string, string> = {
  article: "bg-blue-50 text-blue-700 border-blue-200",
  video: "bg-red-50 text-red-700 border-red-200",
  course: "bg-violet-50 text-violet-700 border-violet-200",
  docs: "bg-slate-50 text-slate-700 border-slate-200",
};

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  standard: "bg-blue-100 text-blue-700 border-blue-200",
  challenging: "bg-violet-100 text-violet-700 border-violet-200",
};

// Fallback markdown renderer for legacy lessons
function formatInline(text: string): string {
  return text
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-foreground">$1</strong>'
    )
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /`(.+?)`/g,
      '<code class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
    );
}

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={i} className="text-lg font-bold text-foreground mt-5 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={i} className="text-xl font-bold text-foreground mt-6 mb-3">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      nodes.push(
        <h1
          key={i}
          className="text-2xl font-extrabold text-foreground mt-6 mb-3 font-heading"
        >
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre
          key={i}
          className="bg-[#1e1b4b] text-white/85 rounded-2xl p-4 text-sm font-mono overflow-x-auto my-4 leading-relaxed"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || lines[i].startsWith("* "))
      ) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={i} className="list-none space-y-1.5 my-3">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-foreground/80">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.trim() === "") {
      // skip
    } else {
      nodes.push(
        <p
          key={i}
          className="text-foreground/80 leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
    i++;
  }
  return nodes;
}

export default function LessonView({
  lesson,
  courseId,
  moduleTitle,
  courseTitle,
  isCompleted: initialCompleted,
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
  const supabase = createClient();
  const router = useRouter();

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
        .select("total_xp")
        .eq("id", userId)
        .single();
      await supabase
        .from("profiles")
        .update({ total_xp: (profile?.total_xp ?? 0) + lesson.xp_reward })
        .eq("id", userId);

      setCompleted(true);
      toast.success(`+${lesson.xp_reward} XP earned!`);
      router.refresh();

      // Auto-navigate to next lesson after delay
      if (nextLessonId) {
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
    <div className="max-w-3xl mx-auto px-4 py-8 lg:pr-6 lg:mr-72 lg:ml-0 xl:ml-12">
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
            {renderMarkdown(lesson.content_markdown)}
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
            {resources.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/10 hover:border-primary/30 hover:bg-primary/3 transition-all group cursor-pointer"
              >
                <Badge
                  className={`text-xs border capitalize flex-shrink-0 ${
                    resourceTypeColors[r.type] ??
                    "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {r.type}
                </Badge>
                <span className="text-sm text-foreground group-hover:text-primary transition-colors flex-1 truncate">
                  {r.title}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Mark Complete */}
      <div className="mb-8">
        <Button
          onClick={markComplete}
          disabled={completed || loading || (!!hasStructuredContent && !allSectionsViewed && !initialCompleted)}
          className={`w-full h-12 rounded-xl font-semibold gap-2 cursor-pointer transition-all ${
            completed
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
              : "bg-primary hover:bg-[#6d28d9] text-white shadow-md shadow-primary/25"
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
                  ? "bg-primary hover:bg-[#6d28d9] text-white shadow-md shadow-primary/25 animate-pulse"
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

      {/* Progress panel */}
      <LessonProgressPanel
        lessons={allLessons}
        currentLessonId={lesson.id}
        courseId={courseId}
      />
    </div>
  );
}
