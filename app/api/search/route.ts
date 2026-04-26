import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const LessonWithModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  module_id: z.string(),
  modules: z.object({
    course_id: z.string(),
    courses: z.object({
      id: z.string(),
      title: z.string(),
      user_id: z.string(),
    }),
  }),
});

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

  const lessons = (lessonsRes.data ?? []).flatMap((l) => {
    const parsed = LessonWithModuleSchema.safeParse(l);
    if (!parsed.success) return [];
    return [{
      id: parsed.data.id,
      title: parsed.data.title,
      courseId: parsed.data.modules.courses.id,
      courseTitle: parsed.data.modules.courses.title,
    }];
  });

  return NextResponse.json({ courses: coursesRes.data ?? [], lessons });
}
