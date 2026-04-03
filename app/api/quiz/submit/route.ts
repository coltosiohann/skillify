import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const SubmitSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.record(z.string().uuid(), z.string()),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Validate input
  let body: z.infer<typeof SubmitSchema>;
  try {
    body = SubmitSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { quizId, answers } = body;

  // Fetch quiz from DB to verify it exists and get xp_reward
  const { data: quiz, error: quizErr } = await supabase
    .from("quizzes")
    .select("id, xp_reward, course_id")
    .eq("id", quizId)
    .single();

  if (quizErr || !quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  // Verify the user owns the course
  if (!quiz.course_id) {
    return NextResponse.json({ error: "Quiz has no associated course" }, { status: 400 });
  }
  const { data: course } = await supabase
    .from("courses")
    .select("user_id")
    .eq("id", quiz.course_id)
    .single();

  if (course?.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch questions server-side — client cannot tamper with correct_answer
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, correct_answer")
    .eq("quiz_id", quizId);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "No questions found" }, { status: 404 });
  }

  // Check if this is a retake
  const { data: existingAttempt } = await supabase
    .from("quiz_attempts")
    .select("id")
    .eq("quiz_id", quizId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isRetake = !!existingAttempt;

  // Calculate score server-side
  const score = questions.filter((q) => answers[q.id] === q.correct_answer).length;
  const passed = score >= Math.ceil(questions.length * 0.6);
  const xpAwarded = isRetake ? 0 : passed ? quiz.xp_reward : Math.floor(quiz.xp_reward * 0.25);

  // Save attempt
  const { error: attemptErr } = await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    quiz_id: quizId,
    score,
    answers_json: answers,
    passed,
    xp_awarded: xpAwarded,
  } as never);

  if (attemptErr) {
    return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 });
  }

  // Award XP server-side
  if (!isRetake && xpAwarded > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp")
      .eq("id", user.id)
      .single();

    await supabase
      .from("profiles")
      .update({ total_xp: (profile?.total_xp ?? 0) + xpAwarded } as never)
      .eq("id", user.id);
  }

  return NextResponse.json({ score, passed, xpAwarded, total: questions.length, isRetake });
}
