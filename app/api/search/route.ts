import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ courses: [], lessons: [] });

  const [coursesRes, lessonsRes] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, domain, detected_level, status")
      .eq("user_id", user.id)
      .ilike("title", `%${q}%`)
      .limit(5),
    supabase
      .from("lessons")
      .select("id, title, module_id, modules!inner(course_id, courses!inner(user_id, id, title))")
      .ilike("title", `%${q}%`)
      .eq("modules.courses.user_id", user.id)
      .limit(5),
  ]);

  const lessons = (lessonsRes.data ?? []).map((l) => {
    const mod = l.modules as unknown as { course_id: string; courses: { id: string; title: string; user_id: string } };
    return {
      id: l.id,
      title: l.title,
      courseId: mod?.courses?.id,
      courseTitle: mod?.courses?.title,
    };
  });

  return NextResponse.json({ courses: coursesRes.data ?? [], lessons });
}
