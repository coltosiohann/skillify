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
    .select("full_name, avatar_url, plan, total_xp, current_streak, courses_generated_this_month, created_at")
    .eq("id", user.id)
    .single();

  return (
    <SettingsClient
      profile={profile}
      email={user.email ?? ""}
      userId={user.id}
    />
  );
}
