export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CoursesClient, { Course } from "./CoursesClient";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all courses with their modules and lessons for progress calc
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id, title, domain, detected_level, status, duration_weeks,
      minutes_per_day, learning_style, created_at,
      modules (
        id,
        lessons ( id )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch all completed lesson IDs for this user
  const { data: progressRows } = await supabase
    .from("progress")
    .select("lesson_id")
    .eq("user_id", user.id);

  const completedIds = new Set((progressRows ?? []).map((r) => r.lesson_id));

  return (
    <CoursesClient
      courses={(courses ?? []) as unknown as Course[]}
      completedLessonIds={Array.from(completedIds)}
    />
  );
}
