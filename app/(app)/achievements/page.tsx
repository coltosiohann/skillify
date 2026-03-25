export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AchievementsClient from "./AchievementsClient";

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, coursesRes, progressRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, total_xp, current_streak, plan, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("courses")
      .select("id, status")
      .eq("user_id", user.id),
    supabase
      .from("progress")
      .select("lesson_id, completed_at")
      .eq("user_id", user.id),
  ]);

  return (
    <AchievementsClient
      profile={profileRes.data}
      courses={coursesRes.data ?? []}
      progress={progressRes.data ?? []}
    />
  );
}
