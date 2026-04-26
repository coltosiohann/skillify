export const dynamic = "force-dynamic";
import { z } from "zod";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

const WeeklyProgressRowSchema = z.object({
  lessons: z.object({ xp_reward: z.number() }).nullable(),
});

// Cache stable per-user data for 60 seconds to reduce DB load on repeat visits.
function getDashboardData(userId: string, weekStartIso: string) {
  return unstable_cache(
    async () => {
      const admin = createAdminClient();
      return Promise.all([
        admin
          .from("profiles")
          .select("full_name, plan, total_xp, current_streak, courses_generated_this_month, weekly_xp_goal, total_minutes_learned")
          .eq("id", userId)
          .single(),
        admin
          .from("courses")
          .select(`
            id, title, domain, detected_level, status, duration_weeks, created_at,
            modules (
              id,
              order_index,
              lessons ( id, order_index, title )
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(6),
        admin.from("progress").select("lesson_id").eq("user_id", userId),
        admin
          .from("progress")
          .select("lesson_id, lessons!inner(xp_reward)")
          .eq("user_id", userId)
          .gte("completed_at", weekStartIso),
        admin
          .from("quiz_attempts")
          .select("xp_awarded")
          .eq("user_id", userId)
          .gte("attempted_at", weekStartIso),
        admin
          .from("subscriptions")
          .select("status, plan, trial_end, current_period_end, cancel_at_period_end")
          .eq("user_id", userId)
          .in("status", ["trialing", "active", "past_due"])
          .maybeSingle(),
      ]);
    },
    [`dashboard-${userId}-${weekStartIso}`],
    { revalidate: 60, tags: [`user-${userId}`] }
  )();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  const [profileRes, coursesRes, progressRes, weeklyProgressRes, weeklyQuizRes, subRes] =
    await getDashboardData(user.id, weekStart.toISOString());

  const completedIds = new Set((progressRes.data ?? []).map((p) => p.lesson_id));

  const weeklyLessonXp = (weeklyProgressRes.data ?? []).reduce((sum, p) => {
    const row = WeeklyProgressRowSchema.safeParse(p);
    return sum + (row.success ? (row.data.lessons?.xp_reward ?? 0) : 0);
  }, 0);
  const weeklyQuizXp = (weeklyQuizRes.data ?? []).reduce((sum, q) => sum + (q.xp_awarded ?? 0), 0);
  const weeklyXp = weeklyLessonXp + weeklyQuizXp;
  const weeklyGoal = (profileRes.data as { weekly_xp_goal?: number } | null)?.weekly_xp_goal ?? 200;
  const totalMinutesLearned = (profileRes.data as { total_minutes_learned?: number } | null)?.total_minutes_learned ?? 0;

  const emailFallback = user.email?.split("@")[0] ?? "Learner";

  return (
    <DashboardClient
      profile={profileRes.data}
      emailFallback={emailFallback}
      courses={(coursesRes.data ?? []) as never}
      completedLessonIds={Array.from(completedIds)}
      weeklyXp={weeklyXp}
      weeklyGoal={weeklyGoal}
      totalMinutesLearned={totalMinutesLearned}
      subscription={subRes.data ?? null}
    />
  );
}
