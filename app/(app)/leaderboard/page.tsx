export const dynamic = "force-dynamic";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LeaderboardClient from "./LeaderboardClient";

const LeaderboardRowSchema = z.object({
  user_id: z.string(),
  weekly_xp: z.number(),
});

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // All-time leaderboard: top 50 by total XP
  const { data: allTime } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, total_xp, current_streak")
    .order("total_xp", { ascending: false })
    .limit(50);

  // Weekly leaderboard: aggregated in SQL via RPC (avoids N+1 JS aggregation)
  const { data: weeklyRows } = await supabase
    .rpc("get_weekly_leaderboard", { limit_count: 50 });

  const weeklyXpMap: Record<string, number> = {};
  for (const row of weeklyRows ?? []) {
    const r = LeaderboardRowSchema.safeParse(row);
    if (r.success) weeklyXpMap[r.data.user_id] = r.data.weekly_xp;
  }

  // Fetch profiles for weekly participants not already in allTime
  const allTimeIds = new Set((allTime ?? []).map((p) => p.id));
  const missingIds = Object.keys(weeklyXpMap).filter((id) => !allTimeIds.has(id));
  const extraProfiles = missingIds.length > 0
    ? (await supabase.from("profiles").select("id, full_name, avatar_url, total_xp, current_streak").in("id", missingIds)).data ?? []
    : [];

  const profileMap = Object.fromEntries(
    [...(allTime ?? []), ...extraProfiles].map((p) => [p.id, p])
  );
  const weekly = Object.entries(weeklyXpMap)
    .map(([uid, xp]) => ({ ...(profileMap[uid] ?? { id: uid, full_name: null, avatar_url: null, total_xp: 0, current_streak: 0 }), weeklyXp: xp }))
    .sort((a, b) => b.weeklyXp - a.weeklyXp)
    .slice(0, 50);

  return (
    <LeaderboardClient
      allTime={(allTime ?? []).map((p) => ({ ...p, weeklyXp: weeklyXpMap[p.id] ?? 0 }))}
      weekly={weekly}
      currentUserId={user.id}
    />
  );
}
