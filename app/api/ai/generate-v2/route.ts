import { NextRequest } from "next/server";
import { generateText } from "@/lib/ai/provider";
import {
  getCourseOutlinePrompt,
  getLessonContentPrompt,
  type CourseGeneratorParams,
} from "@/lib/prompts/course-generator";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import type {
  CourseOutline,
  LessonPayload,
  PhaseEventData,
  OutlineEventData,
  LessonEventData,
  LessonErrorEventData,
  ErrorEventData,
} from "@/lib/types/generation-events";

const SYSTEM_PROMPT =
  "You are an expert curriculum designer. Return only valid JSON — no markdown, no extra text.";

// ─── SSE helpers ──────────────────────────────────────────────────────────────

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ─── JSON parse with retry ────────────────────────────────────────────────────

function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

async function generateWithRetry<T>(
  prompt: string,
  maxRetries: number,
  maxTokens: number
): Promise<T> {
  let lastError: Error = new Error("Unknown error");
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const raw = await generateText(prompt, SYSTEM_PROMPT, { maxTokens });
      return parseJSON<T>(raw);
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
  const rl = await checkRateLimit(user.id, {
    limit: 5,
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
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  const body = (await req.json()) as CourseGeneratorParams;
  const lessonsPerModule =
    body.minutesPerDay <= 15 ? 3 : body.minutesPerDay <= 30 ? 4 : 5;
  const includePractice =
    body.learningStyle === "practical" || body.learningStyle === "balanced";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      try {
        // ── Phase 1: Generate course outline ──────────────────────────────────
        send("phase", {
          phase: "outline",
          message: "Designing your course structure...",
        } satisfies PhaseEventData);

        let outline: CourseOutline;
        try {
          outline = await generateWithRetry<CourseOutline>(
            getCourseOutlinePrompt(body),
            1, // retry once if parse fails or structure is wrong
            8192
          );

          // Validate structure; retry once if counts are off
          const validationError = validateOutline(
            outline,
            body.durationWeeks,
            lessonsPerModule
          );
          if (validationError) {
            // One more attempt with an explicit correction note
            const correctionPrompt =
              getCourseOutlinePrompt(body) +
              `\n\nPREVIOUS ATTEMPT FAILED: ${validationError}. Fix this and return the correct number of modules and lessons.`;
            outline = await generateWithRetry<CourseOutline>(
              correctionPrompt,
              0,
              8192
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

        for (let mIdx = 0; mIdx < outline.modules.length; mIdx++) {
          const mod = outline.modules[mIdx];

          for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
            const stub = mod.lessons[lIdx];
            current++;

            // Collect up to 3 previous lesson titles for continuity
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
                }),
                2, // retry up to 2 times per lesson
                8192
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
              // Non-fatal: record the failure and continue
              const msg =
                err instanceof Error ? err.message : "Lesson generation failed";
              send("lesson-error", {
                moduleIndex: mIdx,
                lessonIndex: lIdx,
                title: stub.title,
                message: msg,
              } satisfies LessonErrorEventData);
            }
          }
        }

        send("done", {});
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "An unexpected error occurred";
        send("error", { message: msg, fatal: true } satisfies ErrorEventData);
      } finally {
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
