export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, extProfileRes, subRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, plan, total_xp, current_streak, courses_generated_this_month, created_at, notification_preferences")
      .eq("id", user.id)
      .single(),
    // weekly_xp_goal added in migration 006 — fetch separately so base query never fails
    supabase
      .from("profiles")
      .select("weekly_xp_goal")
      .eq("id", user.id)
      .single(),
    supabase
      .from("subscriptions")
      .select("status, plan, interval, current_period_end, cancel_at_period_end, trial_end")
      .eq("user_id", user.id)
      .in("status", ["trialing", "active", "past_due"])
      .maybeSingle(),
  ]);

  return (
    <SettingsClient
      profile={profileRes.data ? { ...profileRes.data, weekly_xp_goal: (extProfileRes.data as { weekly_xp_goal?: number } | null)?.weekly_xp_goal ?? 200 } as never : null}
      email={user.email ?? ""}
      userId={user.id}
      subscription={subRes.data ?? null}
    />
  );
}
