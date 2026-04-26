export const dynamic = "force-dynamic";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bookmark, BookOpen, ArrowRight } from "lucide-react";

const BookmarkLessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  estimated_minutes: z.number(),
  difficulty: z.string(),
  xp_reward: z.number(),
  modules: z.object({
    title: z.string(),
    courses: z.object({ id: z.string(), title: z.string(), user_id: z.string() }),
  }),
});

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select(`
      id,
      created_at,
      lessons!inner(
        id,
        title,
        estimated_minutes,
        difficulty,
        xp_reward,
        modules!inner(
          title,
          courses!inner(id, title, user_id)
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = (bookmarks ?? []).flatMap((b) => {
    const lesson = BookmarkLessonSchema.safeParse(b.lessons);
    if (!lesson.success) return [];
    return [{
      bookmarkId: b.id,
      lessonId: lesson.data.id,
      lessonTitle: lesson.data.title,
      estimatedMinutes: lesson.data.estimated_minutes,
      difficulty: lesson.data.difficulty,
      xpReward: lesson.data.xp_reward,
      moduleTitle: lesson.data.modules.title,
      courseId: lesson.data.modules.courses.id,
      courseTitle: lesson.data.modules.courses.title,
    }];
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bookmark className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Bookmarks</h1>
          <p className="text-sm text-muted-foreground">{items.length} saved lesson{items.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-primary/15 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-heading font-bold text-lg text-foreground mb-2">No bookmarks yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Click the bookmark icon on any lesson to save it here for later.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.bookmarkId}
              href={`/courses/${item.courseId}/lesson/${item.lessonId}`}
              className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-primary/8 hover:border-primary/20 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{item.lessonTitle}</p>
                <p className="text-xs text-muted-foreground truncate">{item.courseTitle} · {item.moduleTitle}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.estimatedMinutes > 0 && (
                  <span className="text-xs text-muted-foreground">{item.estimatedMinutes}m</span>
                )}
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
