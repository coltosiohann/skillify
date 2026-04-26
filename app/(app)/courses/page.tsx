export const dynamic = "force-dynamic";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import CoursesClient, { Course } from "./CoursesClient";

function getCoursesData(userId: string) {
  return unstable_cache(
    async () => {
      const admin = createAdminClient();
      return Promise.all([
        admin
          .from("courses")
          .select(`
            id, title, domain, detected_level, status, duration_weeks,
            minutes_per_day, learning_style, created_at,
            modules (
              id,
              lessons ( id )
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        admin.from("progress").select("lesson_id").eq("user_id", userId),
      ]);
    },
    [`courses-${userId}`],
    { revalidate: 60, tags: [`user-${userId}`] }
  )();
}

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [coursesRes, progressRes] = await getCoursesData(user.id);

  const completedIds = new Set((progressRes.data ?? []).map((r) => r.lesson_id));

  return (
    <CoursesClient
      courses={(coursesRes.data ?? []) as unknown as Course[]}
      completedLessonIds={Array.from(completedIds)}
    />
  );
}
