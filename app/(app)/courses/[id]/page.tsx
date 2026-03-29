import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import CourseView, { Module } from "./CourseView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!course) redirect("/dashboard");

  const { data: modules } = await supabase
    .from("modules")
    .select("*, lessons(*)")
    .eq("course_id", id)
    .order("order_index");

  const { data: progress } = await supabase
    .from("progress")
    .select("lesson_id")
    .eq("user_id", user.id);

  const completedLessonIds = new Set((progress ?? []).map((p) => p.lesson_id));

  // Fetch quiz attempts per module
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, module_id")
    .eq("course_id", id)
    .eq("type", "module");

  const quizAttempts: Record<string, { quizId: string; passed: boolean; score: number }> = {};
  if (quizzes && quizzes.length > 0) {
    const quizIds = quizzes.map((q) => (q as unknown as { id: string }).id);
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("quiz_id, passed, score")
      .eq("user_id", user.id)
      .in("quiz_id", quizIds)
      .order("attempted_at", { ascending: false });

    // Keep only most recent attempt per quiz
    const seen = new Set<string>();
    for (const attempt of attempts ?? []) {
      const a = attempt as unknown as { quiz_id: string; passed: boolean; score: number };
      if (!seen.has(a.quiz_id)) {
        seen.add(a.quiz_id);
        const quiz = quizzes.find((q) => (q as unknown as { id: string }).id === a.quiz_id);
        const moduleId = (quiz as unknown as { module_id: string })?.module_id;
        if (moduleId) quizAttempts[moduleId] = { quizId: a.quiz_id, passed: a.passed, score: a.score };
      }
    }
  }

  return (
    <CourseView
      course={course}
      modules={(modules ?? []) as unknown as Module[]}
      completedLessonIds={completedLessonIds}
      quizAttempts={quizAttempts}
    />
  );
}
