import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/provider";
import {
  getAssessmentQuestionsPrompt,
  getEvaluateLevelPrompt,
  type AssessmentQuestion,
} from "@/lib/prompts/level-assessor";
import { checkRateLimit } from "@/lib/rateLimit";

function parseJSON(raw: string) {
  return JSON.parse(raw.replace(/```json\s*|```/g, "").trim());
}

function getIdentifier(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// GET /api/ai/assess?domain=X — generate assessment questions
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  // Rate limit: 10 assessments per hour per IP
  const rl = await checkRateLimit(getIdentifier(req), { limit: 10, windowSec: 3600, prefix: "assess-get" });
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

// POST /api/ai/assess — evaluate level from answers
export async function POST(req: NextRequest) {
  // Rate limit: 10 evaluations per hour per IP
  const rl = await checkRateLimit(getIdentifier(req), { limit: 10, windowSec: 3600, prefix: "assess-post" });
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
    const { domain, questions, answers } = (await req.json()) as {
      domain: string;
      questions: AssessmentQuestion[];
      answers: Record<number, string>;
    };

    const raw = await generateText(
      getEvaluateLevelPrompt(domain, questions, answers),
      "You are an expert educator. Return only valid JSON."
    );
    const data = parseJSON(raw);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to evaluate level";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
