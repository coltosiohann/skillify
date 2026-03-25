import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import LessonView from "./LessonView";

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

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, modules(course_id, title, order_index, courses(user_id, title))")
    .eq("id", lessonId)
    .single();

  if (!lesson) redirect(`/courses/${courseId}`);

  // Supabase types don't infer nested joins — cast fully
  const lessonAny = lesson as unknown as {
    id: string;
    title: string;
    content_markdown: string;
    resources_json: { type: string; title: string; url: string }[] | null;
    xp_reward: number;
    modules: { course_id: string; title: string; order_index: number; courses: { user_id: string; title: string } };
  };
  const mod = lessonAny.modules;
  if (mod?.courses?.user_id !== user.id) redirect("/dashboard");

  const { data: progress } = await supabase
    .from("progress")
    .select("id")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .single();

  return (
    <LessonView
      lesson={lessonAny}
      courseId={courseId}
      moduleTitle={mod?.title ?? ""}
      courseTitle={mod?.courses?.title ?? ""}
      isCompleted={!!progress}
      userId={user.id}
    />
  );
}
