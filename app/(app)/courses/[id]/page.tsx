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

  return (
    <CourseView
      course={course}
      modules={(modules ?? []) as unknown as Module[]}
      completedLessonIds={completedLessonIds}
    />
  );
}
