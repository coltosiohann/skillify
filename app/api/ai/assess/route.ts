import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/provider";
import {
  getAssessmentQuestionsPrompt,
  getEvaluateLevelPrompt,
  type AssessmentQuestion,
} from "@/lib/prompts/level-assessor";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

function parseJSON(raw: string) {
  return JSON.parse(raw.replace(/```json\s*|```/g, "").trim());
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

const GetSchema = z.object({
  domain: z.string().min(1).max(200),
});

const PostSchema = z.object({
  domain: z.string().min(1).max(200),
  questions: z.array(z.unknown()),
  answers: z.record(z.string(), z.string()),
});

// GET /api/ai/assess?domain=X — generate assessment questions (anonymous, rate limited by IP)
export async function GET(req: NextRequest) {
  const parsed = GetSchema.safeParse({ domain: req.nextUrl.searchParams.get("domain") });
  if (!parsed.success) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }
  const { domain } = parsed.data;

  // Rate limit by IP for anonymous endpoint
  const rl = await checkRateLimit(getIP(req), { limit: 10, windowSec: 3600, prefix: "assess-get" });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const raw = await generateText(
      getAssessmentQuestionsPrompt(domain),
      "You are an expert educator. Return only valid JSON."
    );
    const data = parseJSON(raw);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate questions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/ai/assess — evaluate level from answers (uses userId if authenticated, else IP)
export async function POST(req: NextRequest) {
  // Try to get authenticated user; fall back to IP for unauthenticated calls
  const supabase = await createClient();
  let rateLimitKey: string;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    rateLimitKey = user ? `user:${user.id}` : getIP(req);
  } catch {
    rateLimitKey = getIP(req);
  }

  const rl = await checkRateLimit(rateLimitKey, { limit: 10, windowSec: 3600, prefix: "assess-post" });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  let body: z.infer<typeof PostSchema>;
  try {
    body = PostSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const raw = await generateText(
      getEvaluateLevelPrompt(body.domain, body.questions as AssessmentQuestion[], body.answers as Record<number, string>),
      "You are an expert educator. Return only valid JSON."
    );
    const data = parseJSON(raw);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to evaluate level";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
