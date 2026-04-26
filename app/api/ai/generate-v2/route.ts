import { NextRequest } from "next/server";
import { z } from "zod";
import { generateText } from "@/lib/ai/provider";
import {
  getCourseOutlinePrompt,
  getLessonContentPrompt,
  COURSE_SYSTEM_PROMPT,
  type CourseGeneratorParams,
} from "@/lib/prompts/course-generator";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEntitlement } from "@/lib/billing/entitlement";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { bizLog } from "@/lib/logger";
import type {
  CourseOutline,
  LessonPayload,
  PhaseEventData,
  OutlineEventData,
  LessonEventData,
  LessonErrorEventData,
  ErrorEventData,
} from "@/lib/types/generation-events";

// ─── Zod schemas for AI output validation ────────────────────────────────────

const OutlineLessonStubSchema = z.object({
  title: z.string(),
  order_index: z.number(),
  xp_reward: z.number(),
  estimated_minutes: z.number(),
  difficulty: z.enum(["easy", "standard", "challenging"]),
  learning_objective: z.string().optional(),
});

const OutlineModuleSchema = z.object({
  title: z.string(),
  description: z.string(),
  order_index: z.number(),
  duration_days: z.number(),
  lessons: z.array(OutlineLessonStubSchema),
});

const CourseOutlineSchema = z.object({
  title: z.string(),
  description: z.string(),
  course_mode: z.enum(["learning", "execution", "tool-based", "hybrid"]),
  goal_summary: z.string(),
  learning_outcomes: z.array(z.string()),
  modules: z.array(OutlineModuleSchema),
});

const LessonSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content_markdown: z.string(),
  type: z.enum(["concept", "example", "deep-dive", "practice"]),
});

const KnowledgeCheckSchema = z.object({
  after_section: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correct_index: z.number(),
  explanation: z.string(),
});

const PracticeChallengeSchema = z.object({
  title: z.string(),
  description: z.string(),
  hints: z.array(z.string()),
  solution_markdown: z.string(),
}).optional();

const LessonPayloadSchema = z.object({
  content_json: z.object({
    sections: z.array(LessonSectionSchema),
    knowledge_checks: z.array(KnowledgeCheckSchema),
    key_takeaways: z.array(z.string()),
    practice_challenge: PracticeChallengeSchema,
  }),
  content_markdown: z.string(),
  resources_json: z.array(z.object({
    type: z.string(),
    title: z.string(),
    url: z.string(),
  })),
});

// Temperatures: higher for the creative outline, lower for accurate lesson content
const OUTLINE_TEMP = 0.7;
const LESSON_TEMP  = 0.4;

// ─── SSE helpers ──────────────────────────────────────────────────────────────

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ─── JSON parse with schema validation ───────────────────────────────────────

function parseJSON(raw: string): unknown {
  const cleaned = raw.replace(/```json\s*|```/g, "").trim();
  return JSON.parse(cleaned);
}

async function generateWithRetry<T>(
  prompt: string,
  schema: z.ZodType<T>,
  maxRetries: number,
  maxTokens: number,
  temperature?: number
): Promise<T> {
  let lastError: Error = new Error("Unknown error");
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const raw = await generateText(prompt, COURSE_SYSTEM_PROMPT, { maxTokens, temperature });
      const parsed = parseJSON(raw);
      return schema.parse(parsed);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError;
}

// ─── Outline validation ───────────────────────────────────────────────────────

function validateOutline(
  outline: CourseOutline,
  expectedModules: number,
  expectedLessonsPerModule: number
): string | null {
  if (!outline.modules || outline.modules.length !== expectedModules) {
    return `Expected ${expectedModules} modules, got ${outline.modules?.length ?? 0}`;
  }
  for (let i = 0; i < outline.modules.length; i++) {
    const mod = outline.modules[i];
    if (!mod.lessons || mod.lessons.length !== expectedLessonsPerModule) {
      return `Module ${i + 1} has ${mod.lessons?.length ?? 0} lessons, expected ${expectedLessonsPerModule}`;
    }
  }
  return null;
}

// ─── In-flight deduplication ──────────────────────────────────────────────────
// Prevents duplicate generations when a client reconnects mid-stream.
// Module-level Set persists for the serverless instance lifetime.
const inFlight = new Set<string>();

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(
      sseEvent("error", { message: "Unauthorized", fatal: true } satisfies ErrorEventData),
      { status: 401, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  // Rate limit: 5 course generations per hour
  const GENERATE_LIMIT = 5;
  const rl = await checkRateLimit(user.id, {
    limit: GENERATE_LIMIT,
    windowSec: 3600,
    prefix: "generate",
  });
  if (!rl.allowed) {
    return new Response(
      sseEvent("error", {
        message: "Too many requests. You can generate up to 5 courses per hour.",
        fatal: true,
      } satisfies ErrorEventData),
      {
        status: 429,
        headers: {
          "Content-Type": "text/event-stream",
          ...rateLimitHeaders(rl, GENERATE_LIMIT),
        },
      }
    );
  }

  // Plan entitlement check
  const entitlement = await getEntitlement(user.id);
  if (entitlement.maxCourses !== -1) {
    const admin = createAdminClient();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await admin
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart.toISOString());

    if ((count ?? 0) >= entitlement.maxCourses) {
      return new Response(
        sseEvent("error", {
          message: `You've reached your ${entitlement.maxCourses} course limit for this month. Upgrade to Pro for unlimited courses.`,
          fatal: true,
          code: "PLAN_LIMIT",
        } satisfies ErrorEventData),
        { status: 403, headers: { "Content-Type": "text/event-stream" } }
      );
    }
  }

  const body = (await req.json()) as CourseGeneratorParams;

  // Reject if this user already has a generation in progress
  if (inFlight.has(user.id)) {
    return new Response(
      sseEvent("error", {
        message: "A course generation is already in progress. Please wait for it to finish.",
        fatal: true,
      } satisfies ErrorEventData),
      { status: 409, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const lessonsPerModule =
    body.minutesPerDay <= 15 ? 3 : body.minutesPerDay <= 30 ? 4 : 5;
  const includePractice =
    body.learningStyle === "practical" || body.learningStyle === "balanced";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      inFlight.add(user.id);
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      try {
        bizLog.courseGenerationStarted(user.id, body.domain, body.durationWeeks);

        // ── Phase 1: Generate course outline ──────────────────────────────────
        send("phase", {
          phase: "outline",
          message: "Designing your course structure...",
        } satisfies PhaseEventData);

        let outline: CourseOutline;
        try {
          outline = await generateWithRetry<CourseOutline>(
            getCourseOutlinePrompt(body),
            CourseOutlineSchema,
            1,
            8192,
            OUTLINE_TEMP
          );

          // Validate structure; retry once if counts are off
          const validationError = validateOutline(
            outline,
            body.durationWeeks,
            lessonsPerModule
          );
          if (validationError) {
            const correctionPrompt =
              getCourseOutlinePrompt(body) +
              `\n\nPREVIOUS ATTEMPT FAILED: ${validationError}. Fix this and return the correct number of modules and lessons.`;
            outline = await generateWithRetry<CourseOutline>(
              correctionPrompt,
              CourseOutlineSchema,
              0,
              8192,
              OUTLINE_TEMP
            );
          }
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Outline generation failed";
          send("error", { message: msg, fatal: true } satisfies ErrorEventData);
          controller.close();
          return;
        }

        send("outline", { outline } satisfies OutlineEventData);

        // ── Phase 2: Generate each lesson's content ───────────────────────────
        const totalLessons = outline.modules.reduce(
          (sum, mod) => sum + mod.lessons.length,
          0
        );

        send("phase", {
          phase: "lessons",
          message: "Generating lesson content...",
          total: totalLessons,
        } satisfies PhaseEventData);

        let current = 0;
        const lessonResults = new Map<string, LessonPayload>();

        // Pre-compute course-level context passed into every lesson prompt
        const allModuleTitles = outline.modules.map((m) => m.title);
        const courseLearningOutcomes = outline.learning_outcomes ?? [];

        // Build a flat list of all lesson tasks, then process in batches of 3
        // to cut total generation time without overwhelming the AI provider.
        type LessonTask = { mIdx: number; lIdx: number; mod: typeof outline.modules[number]; stub: typeof outline.modules[number]["lessons"][number] };
        const allLessonTasks: LessonTask[] = outline.modules.flatMap((mod, mIdx) =>
          mod.lessons.map((stub, lIdx) => ({ mIdx, lIdx, mod, stub }))
        );
        const BATCH_SIZE = 3;

        for (let i = 0; i < allLessonTasks.length; i += BATCH_SIZE) {
          const batch = allLessonTasks.slice(i, i + BATCH_SIZE);

          await Promise.allSettled(
            batch.map(async ({ mIdx, lIdx, mod, stub }) => {
              current++;
              const previousLessonTitles = mod.lessons
                .slice(0, lIdx)
                .map((l) => l.title)
                .slice(-3);

              try {
                const lessonPayload = await generateWithRetry<LessonPayload>(
                  getLessonContentPrompt({
                    domain: body.domain,
                    level: body.level,
                    learningStyle: body.learningStyle,
                    moduleTitle: mod.title,
                    moduleDescription: mod.description,
                    lessonTitle: stub.title,
                    lessonIndex: lIdx,
                    totalLessonsInModule: mod.lessons.length,
                    estimatedMinutes: stub.estimated_minutes,
                    difficulty: stub.difficulty,
                    includePractice,
                    previousLessonTitles,
                    pdfContext: body.pdfContext,
                    courseTitle: outline.title,
                    courseLearningOutcomes,
                    allModuleTitles,
                    learningObjective: stub.learning_objective ?? `By the end of this lesson you can work with ${stub.title}`,
                    courseMode: outline.course_mode ?? "learning",
                  }),
                  LessonPayloadSchema,
                  2,
                  8192,
                  LESSON_TEMP
                );

                lessonResults.set(`${mIdx}-${lIdx}`, lessonPayload);

                send("lesson", {
                  moduleIndex: mIdx,
                  lessonIndex: lIdx,
                  current,
                  total: totalLessons,
                  lesson: lessonPayload,
                } satisfies LessonEventData);
              } catch (err) {
                const msg =
                  err instanceof Error ? err.message : "Lesson generation failed";
                send("lesson-error", {
                  moduleIndex: mIdx,
                  lessonIndex: lIdx,
                  title: stub.title,
                  message: msg,
                } satisfies LessonErrorEventData);
              }
            })
          );
        }

        bizLog.courseGenerationCompleted(user.id, "streaming", totalLessons - lessonResults.size);
        send("done", {});
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "An unexpected error occurred";
        bizLog.courseGenerationFailed(user.id, msg);
        send("error", { message: msg, fatal: true } satisfies ErrorEventData);
      } finally {
        inFlight.delete(user.id);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
