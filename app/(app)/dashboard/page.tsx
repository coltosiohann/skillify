export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  const [profileRes, coursesRes, progressRes, weeklyProgressRes, weeklyQuizRes] = await Promise.all([
    // Single profile query — Supabase returns null for missing columns, never throws on unknown fields
    supabase
      .from("profiles")
      .select("full_name, plan, total_xp, current_streak, courses_generated_this_month, weekly_xp_goal, total_minutes_learned")
      .eq("id", user.id)
      .single(),
    supabase
      .from("courses")
      .select(`
        id, title, domain, detected_level, status, duration_weeks, created_at,
        modules (
          id,
          order_index,
          lessons ( id, order_index, title )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("progress")
      .select("lesson_id")
      .eq("user_id", user.id),
    supabase
      .from("progress")
      .select("lesson_id, lessons!inner(xp_reward)")
      .eq("user_id", user.id)
      .gte("completed_at", weekStart.toISOString()),
    supabase
      .from("quiz_attempts")
      .select("xp_awarded")
      .eq("user_id", user.id)
      .gte("attempted_at", weekStart.toISOString()),
  ]);

  const completedIds = new Set((progressRes.data ?? []).map((p) => p.lesson_id));

  // Calculate this week's XP from lessons + quizzes
  const weeklyLessonXp = (weeklyProgressRes.data ?? []).reduce((sum, p) => {
    const lesson = p.lessons as unknown as { xp_reward: number } | null;
    return sum + (lesson?.xp_reward ?? 0);
  }, 0);
  const weeklyQuizXp = (weeklyQuizRes.data ?? []).reduce((sum, q) => sum + (q.xp_awarded ?? 0), 0);
  const weeklyXp = weeklyLessonXp + weeklyQuizXp;
  const weeklyGoal = (profileRes.data as { weekly_xp_goal?: number } | null)?.weekly_xp_goal ?? 200;
  const totalMinutesLearned = (profileRes.data as { total_minutes_learned?: number } | null)?.total_minutes_learned ?? 0;

  // Use email local-part as name fallback when full_name is null
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
    />
  );
}
