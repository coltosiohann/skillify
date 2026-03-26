import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import LessonView from "./LessonView";
import type { LessonNavItem } from "@/components/lesson/LessonProgressPanel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; lessonId: string }>;
}

export default async function LessonPage({ params }: Props) {
  const { id: courseId, lessonId } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch current lesson with module + course info
  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, modules(course_id, title, order_index, courses(user_id, title))")
    .eq("id", lessonId)
    .single();

  if (!lesson) redirect(`/courses/${courseId}`);

  const lessonAny = lesson as unknown as {
    id: string;
    title: string;
    content_markdown: string;
    content_json: unknown;
    resources_json: { type: string; title: string; url: string }[] | null;
    xp_reward: number;
    estimated_minutes: number;
    difficulty: string;
    order_index: number;
    modules: {
      course_id: string;
      title: string;
      order_index: number;
      courses: { user_id: string; title: string };
    };
  };
  const mod = lessonAny.modules;
  if (mod?.courses?.user_id !== user.id) redirect("/dashboard");

  // Fetch all modules with lessons for this course (for navigation)
  const { data: allModules } = await supabase
    .from("modules")
    .select("id, title, order_index, lessons(id, title, order_index)")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  // Fetch all user progress for this course
  const allLessonIds: string[] = [];
  const orderedLessons: { id: string; title: string; moduleTitle: string; moduleIndex: number }[] = [];

  for (const m of (allModules ?? []).sort((a, b) => a.order_index - b.order_index)) {
    const lessons = ((m as unknown as { lessons: { id: string; title: string; order_index: number }[] }).lessons ?? [])
      .sort((a, b) => a.order_index - b.order_index);
    for (const l of lessons) {
      allLessonIds.push(l.id);
      orderedLessons.push({
        id: l.id,
        title: l.title,
        moduleTitle: m.title,
        moduleIndex: m.order_index,
      });
    }
  }

  // Fetch progress for all lessons
  const { data: progressRows } = await supabase
    .from("progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .in("lesson_id", allLessonIds.length > 0 ? allLessonIds : ["__none__"]);

  const completedSet = new Set((progressRows ?? []).map((p) => p.lesson_id));

  // Build nav items
  const navItems: LessonNavItem[] = orderedLessons.map((l) => ({
    id: l.id,
    title: l.title,
    completed: completedSet.has(l.id),
    moduleTitle: l.moduleTitle,
    moduleIndex: l.moduleIndex,
  }));

  // Find prev/next
  const currentIdx = orderedLessons.findIndex((l) => l.id === lessonId);
  const prevLessonId = currentIdx > 0 ? orderedLessons[currentIdx - 1].id : null;
  const nextLessonId =
    currentIdx < orderedLessons.length - 1
      ? orderedLessons[currentIdx + 1].id
      : null;

  return (
    <LessonView
      lesson={{
        id: lessonAny.id,
        title: lessonAny.title,
        content_markdown: lessonAny.content_markdown,
        content_json: lessonAny.content_json as import("@/lib/types/lesson-content").LessonContent | null,
        resources_json: lessonAny.resources_json,
        xp_reward: lessonAny.xp_reward,
        estimated_minutes: lessonAny.estimated_minutes ?? 5,
        difficulty: lessonAny.difficulty ?? "standard",
      }}
      courseId={courseId}
      moduleTitle={mod?.title ?? ""}
      courseTitle={mod?.courses?.title ?? ""}
      isCompleted={completedSet.has(lessonId)}
      userId={user.id}
      prevLessonId={prevLessonId}
      nextLessonId={nextLessonId}
      currentIndex={currentIdx}
      totalLessons={orderedLessons.length}
      allLessons={navItems}
    />
  );
}
