import { NextRequest } from "next/server";
import { streamText } from "@/lib/ai/provider";
import { getCourseGeneratorPrompt, type CourseGeneratorParams } from "@/lib/prompts/course-generator";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CourseGeneratorParams;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamText(
          getCourseGeneratorPrompt(body),
          "You are an expert curriculum designer. Return only valid JSON — no markdown, no extra text.",
          (chunk) => {
            controller.enqueue(encoder.encode(chunk));
          }
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(encoder.encode(`\n\n__ERROR__:${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
