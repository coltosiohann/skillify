import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/provider";
import { getQuizGeneratorPrompt } from "@/lib/prompts/quiz-generator";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const RequestSchema = z.object({
  courseId: z.string().uuid(),
  moduleId: z.string().uuid(),
});

const QuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  correct_index: z.number().int().min(0),
  explanation: z.string().default(""),
});

const QuizResponseSchema = z.object({
  questions: z.array(QuestionSchema).min(1).max(20),
});

export async function POST(req: NextRequest) {
  let courseId: string, moduleId: string;
  try {
    const parsed = RequestSchema.parse(await req.json());
    courseId = parsed.courseId;
    moduleId = parsed.moduleId;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 20 quiz generations per hour
  const rl = await checkRateLimit(user.id, { limit: 20, windowSec: 3600, prefix: "quiz" });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before generating more quizzes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  // Verify course ownership
  const { data: course } = await supabase
    .from("courses")
    .select("user_id")
    .eq("id", courseId)
    .single();
  if (course?.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Return existing quiz if already generated
  const { data: existing } = await supabase
    .from("quizzes")
    .select("id")
    .eq("module_id", moduleId)
    .eq("type", "module")
    .maybeSingle();

  if (existing) {
    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", existing.id)
      .order("order_index");
    return NextResponse.json({ quizId: existing.id, questions: questions ?? [] });
  }

  // Fetch module title + lessons
  const { data: module } = await supabase
    .from("modules")
    .select("title")
    .eq("id", moduleId)
    .single();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("title, content_markdown")
    .eq("module_id", moduleId)
    .order("order_index");

  if (!lessons || lessons.length === 0) {
    return NextResponse.json({ error: "No lessons found for this module" }, { status: 404 });
  }

  // Generate questions via AI
  const prompt = getQuizGeneratorPrompt({
    moduleTitle: module?.title ?? "Module",
    lessons: lessons.map((l) => ({ title: l.title, content: l.content_markdown ?? "" })),
  });

  let raw: string;
  try {
    raw = await generateText(prompt, "You are an expert educator. Return only valid JSON — no markdown, no extra text.");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  let parsed: z.infer<typeof QuizResponseSchema>;
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    parsed = QuizResponseSchema.parse(JSON.parse(cleaned));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "AI returned invalid quiz structure", details: err.flatten() }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  // Insert quiz
  const { data: quiz, error: quizErr } = await supabase
    .from("quizzes")
    .insert({
      course_id: courseId,
      module_id: moduleId,
      type: "module",
      xp_reward: 150,
    } as never)
    .select()
    .single();

  if (quizErr || !quiz) {
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }

  // Insert questions
  const questionRows = (parsed.questions ?? []).map((q, i) => ({
    quiz_id: (quiz as { id: string }).id,
    question: q.question,
    options_json: q.options,
    correct_answer: q.options[q.correct_index] ?? q.options[0],
    explanation: q.explanation ?? "",
    order_index: i,
  }));

  await supabase.from("quiz_questions").insert(questionRows as never);

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", (quiz as { id: string }).id)
    .order("order_index");

  return NextResponse.json({ quizId: (quiz as { id: string }).id, questions: questions ?? [] });
}
