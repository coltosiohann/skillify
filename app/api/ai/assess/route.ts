import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/provider";
import {
  getAssessmentQuestionsPrompt,
  getEvaluateLevelPrompt,
  type AssessmentQuestion,
} from "@/lib/prompts/level-assessor";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { z } from "zod";

const AssessmentQuestionsSchema = z.object({
  questions: z.array(z.object({
    id: z.number(),
    question: z.string(),
    options: z.array(z.string()),
    correct_index: z.number().optional(),
  })),
});

const AssessmentResultSchema = z.object({
  level: z.string(),
  score: z.number().optional(),
  reasoning: z.string().optional(),
});

function parseJSON(raw: string): unknown {
  return JSON.parse(raw.replace(/```json\s*|```/g, "").trim());
}

const ASSESS_LIMIT = 10;

function getIP(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null
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

  // Prefer authenticated user ID; fall back to IP. Reject if neither is determinable.
  const supabase = await createClient();
  let rateLimitKey: string;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      rateLimitKey = `user:${user.id}`;
    } else {
      const ip = getIP(req);
      if (!ip) return NextResponse.json({ error: "Unable to determine client identity" }, { status: 400 });
      rateLimitKey = ip;
    }
  } catch {
    const ip = getIP(req);
    if (!ip) return NextResponse.json({ error: "Unable to determine client identity" }, { status: 400 });
    rateLimitKey = ip;
  }

  // Shared bucket with POST so combined usage is capped at 10/hour
  const ASSESS_LIMIT = 10;
  const rl = await checkRateLimit(rateLimitKey, { limit: ASSESS_LIMIT, windowSec: 3600, prefix: "assess" });
  const rlHeaders = rateLimitHeaders(rl, ASSESS_LIMIT);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    const raw = await generateText(
      getAssessmentQuestionsPrompt(domain),
      "You are an expert educator. Return only valid JSON."
    );
    const data = AssessmentQuestionsSchema.parse(parseJSON(raw));
    return NextResponse.json(data, { headers: rlHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate questions";
    return NextResponse.json({ error: msg }, { status: 500, headers: rlHeaders });
  }
}

// POST /api/ai/assess — evaluate level from answers (uses userId if authenticated, else IP)
export async function POST(req: NextRequest) {
  // Try to get authenticated user; fall back to IP. Reject if neither is determinable.
  const supabase = await createClient();
  let rateLimitKey: string;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      rateLimitKey = `user:${user.id}`;
    } else {
      const ip = getIP(req);
      if (!ip) return NextResponse.json({ error: "Unable to determine client identity" }, { status: 400 });
      rateLimitKey = ip;
    }
  } catch {
    const ip = getIP(req);
    if (!ip) return NextResponse.json({ error: "Unable to determine client identity" }, { status: 400 });
    rateLimitKey = ip;
  }

  // Shared bucket with GET so combined GET+POST usage is capped at 10/hour
  const rl = await checkRateLimit(rateLimitKey, { limit: ASSESS_LIMIT, windowSec: 3600, prefix: "assess" });
  const rlHeaders = rateLimitHeaders(rl, ASSESS_LIMIT);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: rlHeaders }
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
    const data = AssessmentResultSchema.parse(parseJSON(raw));
    return NextResponse.json(data, { headers: rlHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to evaluate level";
    return NextResponse.json({ error: msg }, { status: 500, headers: rlHeaders });
  }
}
