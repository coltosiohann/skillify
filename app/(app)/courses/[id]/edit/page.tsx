export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CourseEditor from "./CourseEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, domain, detected_level, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!course) redirect("/dashboard");

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, description, order_index, lessons(id, title, order_index, estimated_minutes, xp_reward)")
    .eq("course_id", id)
    .order("order_index");

  return (
    <CourseEditor
      course={course as { id: string; title: string; domain: string; detected_level: string; status: string }}
      modules={(modules ?? []) as unknown as import("./CourseEditor").EditorModule[]}
    />
  );
}
