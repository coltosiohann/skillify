export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CertificateView from "./CertificateView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [courseRes, profileRes] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, domain, detected_level, duration_weeks, status, created_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, total_xp")
      .eq("id", user.id)
      .single(),
  ]);

  if (!courseRes.data) redirect("/dashboard");

  // Verify completion from progress records (handles courses completed before status tracking)
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id")
    .in(
      "module_id",
      (
        await supabase.from("modules").select("id").eq("course_id", id)
      ).data?.map((m) => m.id) ?? []
    );

  const { data: progress } = await supabase
    .from("progress")
    .select("lesson_id, completed_at")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  const completedIds = new Set((progress ?? []).map((p) => p.lesson_id));
  const totalLessons = allLessons?.length ?? 0;
  const allDone = totalLessons > 0 && (allLessons ?? []).every((l) => completedIds.has(l.id));

  if (!allDone) {
    redirect(`/courses/${id}`);
  }

  // Backfill status = "completed" if it was never set
  if (courseRes.data.status !== "completed") {
    await supabase
      .from("courses")
      .update({ status: "completed" } as never)
      .eq("id", id);
  }

  const completedAt = progress?.[0]?.completed_at ?? courseRes.data.created_at;

  return (
    <CertificateView
      course={courseRes.data}
      recipientName={profileRes.data?.full_name ?? "Learner"}
      totalXp={profileRes.data?.total_xp ?? 0}
      completedAt={completedAt}
    />
  );
}
