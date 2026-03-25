export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, coursesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, plan, total_xp, current_streak, courses_generated_this_month")
      .eq("id", user.id)
      .single(),
    supabase
      .from("courses")
      .select("id, title, domain, detected_level, status, duration_weeks, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return (
    <DashboardClient
      profile={profileRes.data}
      courses={coursesRes.data ?? []}
    />
  );
}
