export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuizLoader from "./QuizLoader";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ moduleId?: string }>;
}

export default async function QuizPage({ params, searchParams }: Props) {
  const { id: courseId } = await params;
  const { moduleId } = await searchParams;

  if (!moduleId) redirect(`/courses/${courseId}`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify course ownership
  const { data: course } = await supabase
    .from("courses")
    .select("user_id, title")
    .eq("id", courseId)
    .single();
  if (!course || course.user_id !== user.id) redirect("/dashboard");

  // Get module title
  const { data: module } = await supabase
    .from("modules")
    .select("title")
    .eq("id", moduleId)
    .single();

  // Check for existing quiz attempt
  const { data: existingQuiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("module_id", moduleId)
    .eq("type", "module")
    .maybeSingle();

  let existingAttempt: { score: number; passed: boolean; xp_awarded: number; answers_json: Record<string, string> } | null = null;
  if (existingQuiz) {
    const { data: attempt } = await supabase
      .from("quiz_attempts")
      .select("score, passed, xp_awarded, answers_json")
      .eq("quiz_id", existingQuiz.id)
      .eq("user_id", user.id)
      .order("attempted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    existingAttempt = attempt ? { ...attempt, answers_json: (attempt.answers_json ?? {}) as Record<string, string> } : null;
  }

  return (
    <QuizLoader
      courseId={courseId}
      moduleId={moduleId}
      moduleTitle={module?.title ?? "Module"}
      courseTitle={(course as unknown as { title: string }).title}
      userId={user.id}
      existingAttempt={existingAttempt}
    />
  );
}
