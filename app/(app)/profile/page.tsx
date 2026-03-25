export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, coursesRes, progressRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, plan, total_xp, current_streak, courses_generated_this_month, created_at")
      .eq("id", user.id)
      .single(),
    supabase.from("courses").select("id, title, status, domain, detected_level, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("progress").select("lesson_id, completed_at").eq("user_id", user.id).order("completed_at", { ascending: false }),
  ]);

  return (
    <ProfileClient
      profile={profileRes.data}
      email={user.email ?? ""}
      courses={coursesRes.data ?? []}
      progress={progressRes.data ?? []}
    />
  );
}
