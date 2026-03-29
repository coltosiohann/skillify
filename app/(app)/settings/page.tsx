export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, plan, total_xp, current_streak, courses_generated_this_month, created_at, notification_preferences")
    .eq("id", user.id)
    .single();

  // weekly_xp_goal added in migration 006 — fetch separately so base query never fails
  const { data: extProfile } = await supabase
    .from("profiles")
    .select("weekly_xp_goal")
    .eq("id", user.id)
    .single();

  return (
    <SettingsClient
      profile={profile ? { ...profile, weekly_xp_goal: (extProfile as { weekly_xp_goal?: number } | null)?.weekly_xp_goal ?? 200 } as never : null}
      email={user.email ?? ""}
      userId={user.id}
    />
  );
}
