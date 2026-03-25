export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [progressRes, coursesRes] = await Promise.all([
    supabase
      .from("progress")
      .select("lesson_id, completed_at, lessons(title, xp_reward)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(50),
    supabase
      .from("courses")
      .select("id, title, status, created_at, domain")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <NotificationsClient
      progress={(progressRes.data ?? []) as unknown as ProgressWithLesson[]}
      courses={coursesRes.data ?? []}
    />
  );
}

export interface ProgressWithLesson {
  lesson_id: string;
  completed_at: string;
  lessons: { title: string; xp_reward: number } | null;
}
