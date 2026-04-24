import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro";

export type SubStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "none";

export type Entitlement = {
  plan: Plan;
  status: SubStatus;
  // Access flags
  canCreateCourse: boolean;
  maxCourses: number;          // -1 = unlimited
  aiCallsPerMonth: number;
  // Banner flags (for UI)
  showTrialBanner: boolean;
  showPastDueBanner: boolean;
  showCancelingBanner: boolean;
  trialEnd: string | null;
  periodEnd: string | null;
};

const FREE_ENTITLEMENT: Entitlement = {
  plan: "free",
  status: "none",
  canCreateCourse: true,
  maxCourses: 1,
  aiCallsPerMonth: 5,
  showTrialBanner: false,
  showPastDueBanner: false,
  showCancelingBanner: false,
  trialEnd: null,
  periodEnd: null,
};

export async function getEntitlement(userId: string): Promise<Entitlement> {
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["trialing", "active", "past_due"])
    .maybeSingle();

  if (!sub) return FREE_ENTITLEMENT;

  const isPro = sub.plan === "pro";

  // past_due: 3-day grace period — still full access, show banner
  const isPastDueInGrace = sub.status === "past_due";

  // active but user hit cancel — access until period_end
  const isCanceling =
    sub.status === "active" && sub.cancel_at_period_end === true;

  const hasProAccess = isPro && (sub.status === "active" || sub.status === "trialing" || isPastDueInGrace);

  return {
    plan: sub.plan as Plan,
    status: sub.status as SubStatus,
    canCreateCourse: hasProAccess,
    maxCourses: hasProAccess ? -1 : 1,
    aiCallsPerMonth: hasProAccess ? 100 : 5,
    showTrialBanner: sub.status === "trialing",
    showPastDueBanner: isPastDueInGrace,
    showCancelingBanner: isCanceling,
    trialEnd: sub.trial_end ?? null,
    periodEnd: sub.current_period_end,
  };
}
