// ─── Shared types ─────────────────────────────────────────────────────────────

export interface CourseGeneratorParams {
  domain: string;
  level: "beginner" | "intermediate" | "advanced";
  durationWeeks: number;
  minutesPerDay: number;
  learningStyle: "theory" | "practical" | "balanced";
  pdfContext?: string;
}

export interface LessonContentPromptParams {
  // Lesson identity
  domain: string;
  level: "beginner" | "intermediate" | "advanced";
  learningStyle: "theory" | "practical" | "balanced";
  moduleTitle: string;
  moduleDescription: string;
  lessonTitle: string;
  lessonIndex: number;
  totalLessonsInModule: number;
  estimatedMinutes: number;
  difficulty: "easy" | "standard" | "challenging";
  includePractice: boolean;
  previousLessonTitles: string[];
  pdfContext?: string;
  // Course context (new — prevents drift between lessons)
  courseTitle: string;
  courseLearningOutcomes: string[];
  allModuleTitles: string[];
  learningObjective: string;
}

// ─── System prompt ────────────────────────────────────────────────────────────

export const COURSE_SYSTEM_PROMPT = `You are Skillify's Lead Curriculum Architect — a world-class instructional designer with deep expertise in adult learning theory, Bloom's taxonomy, cognitive load theory, and the worked-example / faded-guidance method.

Your courses are known for:
• Concrete, domain-specific examples — never generic placeholders or filler
• Lessons that build a tight, progressive arc (each lesson assumes the last)
• Second-person voice ("you'll learn...", "you can now...") that respects the learner
• Defining every jargon term the first time it appears
• Knowledge checks that test transfer and application, not memorisation
• Specific, outcome-oriented lesson titles — not "Introduction to X"

Return ONLY valid JSON conforming exactly to the requested schema. No markdown fences, no prose commentary, no apologies. Begin with { and end with }.`;

// ─── Learning style descriptions ──────────────────────────────────────────────

const styleDesc = {
  theory:     "focus on deep conceptual understanding, mental models, and first-principles reasoning",
  practical:  "focus on hands-on tasks, real projects, and learning by doing",
  balanced:   "alternate between clear explanations and immediate hands-on practice",
} as const;

// ─── Phase 1: Course Outline ──────────────────────────────────────────────────

export function getCourseOutlinePrompt(p: CourseGeneratorParams): string {
  const lessonsPerModule = p.minutesPerDay <= 15 ? 3 : p.minutesPerDay <= 30 ? 4 : 5;
  const totalLessons = p.durationWeeks * lessonsPerModule;
  const totalMinutes = p.durationWeeks * 7 * p.minutesPerDay;
  const avgMin = Math.round(totalMinutes / totalLessons);
  const minSum = Math.round(totalMinutes * 0.85);
  const maxSum = Math.round(totalMinutes * 1.15);

  return `Design a ${p.durationWeeks}-week course on "${p.domain}" for a ${p.level} learner.

LEARNER PROFILE
• Skill level: ${p.level}
• Daily commitment: ${p.minutesPerDay} minutes/day
• Learning style: ${p.learningStyle} — ${styleDesc[p.learningStyle]}
• Total time budget: ${totalMinutes} minutes across ${totalLessons} lessons (~${avgMin} min average)
${p.pdfContext ? `\nLEARNER MATERIALS — use to personalise scope, examples, and terminology:\n"""\n${p.pdfContext.slice(0, 2500)}\n"""\n` : ""}
DESIGN PRINCIPLES — apply all of these:
1. Backwards design: decide what the learner can confidently DO at the end of week ${p.durationWeeks}, then design backwards from that goal.
2. Bloom's progression across weeks:
   - Weeks 1–${Math.ceil(p.durationWeeks / 3)}: Remember / Understand (concepts, vocabulary, foundational models)
   - Weeks ${Math.ceil(p.durationWeeks / 3) + 1}–${Math.ceil(p.durationWeeks * 2 / 3)}: Apply / Analyse (use the concepts, spot patterns, solve problems)
   - Weeks ${Math.ceil(p.durationWeeks * 2 / 3) + 1}–${p.durationWeeks}: Evaluate / Create (critique, build, tackle open-ended problems)
3. Each module must have ONE tight, specific theme. Never use vague titles like "Advanced Topics", "Miscellaneous", or "Wrap-up".
4. Lesson titles must be outcome-oriented and specific to ${p.domain}:
   - BAD:  "Introduction to Variables"
   - GOOD: "Store and reuse data with variables and constants"
5. Time budget: easy lessons 5–8 min, standard 8–12 min, challenging 12–15 min. The sum of all estimated_minutes must be between ${minSum} and ${maxSum}.
6. Logical progression within each module: each lesson builds directly on the previous one.

OUTPUT SCHEMA — return JSON matching this exactly:
{
  "title": string,              // specific, benefit-driven — NOT "Learn ${p.domain}" or "${p.domain} for Beginners"
  "description": string,        // 2–3 sentences: concrete capability the learner gains by the end
  "learning_outcomes": string[], // exactly 4–6 items, each starting with an action verb (e.g. "Build...", "Explain...", "Debug...")
  "modules": [                  // EXACTLY ${p.durationWeeks} items
    {
      "title": string,          // theme + outcome, e.g. "Core syntax: write and run your first programs"
      "description": string,    // 1–2 sentences on what the learner masters this week and why it matters
      "order_index": number,    // 0-based
      "duration_days": 7,
      "lessons": [              // EXACTLY ${lessonsPerModule} items
        {
          "title": string,           // specific, outcome-oriented, ${p.level}-appropriate
          "order_index": number,     // 0-based within module
          "xp_reward": number,       // 50 for easy/standard, 75 for standard/challenging, 100 for most challenging
          "estimated_minutes": number, // 5–15
          "difficulty": "easy" | "standard" | "challenging",
          "learning_objective": string // one sentence: "By the end of this lesson you can ___"
        }
      ]
    }
  ]
}

HARD CONSTRAINTS — violating any of these causes the output to be rejected and regenerated:
• Exactly ${p.durationWeeks} module objects in "modules"
• Exactly ${lessonsPerModule} lesson objects inside every module's "lessons" array (${totalLessons} lessons total)
• No lesson title may be identical or near-identical to another lesson title in the course
• The word "Introduction" may only appear in the title of lesson 1 of module 1
• Sum of all estimated_minutes must be between ${minSum} and ${maxSum}
• learning_outcomes must have between 4 and 6 items
• Every learning_objective must start with "By the end of this lesson you can"

Return JSON only. Begin with { and end with }.`;
}

// ─── Phase 2: Single Lesson Content ──────────────────────────────────────────

export function getLessonContentPrompt(p: LessonContentPromptParams): string {
  const sectionCount = p.estimatedMinutes <= 8 ? 3 : 4;
  const wordRange = p.estimatedMinutes <= 8 ? "120–180" : "180–260";
  const prevContext = p.previousLessonTitles.length > 0
    ? `\nALREADY COVERED in this module — do not repeat or re-explain: ${p.previousLessonTitles.map(t => `"${t}"`).join(", ")}`
    : "";
  const checkIndices = sectionCount === 4 ? ["section-2", "section-4"] : ["section-2", "section-3"];

  return `Write the full content for ONE lesson. Make it the best lesson in the course.

═══ COURSE CONTEXT ═══
Course: "${p.courseTitle}"
What the learner achieves by the end of the whole course:
${p.courseLearningOutcomes.map(o => `  • ${o}`).join("\n")}

Full module arc (${p.allModuleTitles.length} modules):
${p.allModuleTitles.map((t, i) => `  ${i + 1}. ${t}`).join("\n")}

═══ THIS LESSON ═══
Title: "${p.lessonTitle}"
Learning objective: ${p.learningObjective}
Position: lesson ${p.lessonIndex + 1} of ${p.totalLessonsInModule} in module "${p.moduleTitle}"
Module focus: ${p.moduleDescription}
Difficulty: ${p.difficulty} · Target reading time: ${p.estimatedMinutes} min${prevContext}
${p.pdfContext ? `\nLEARNER REFERENCE MATERIAL — use to ground examples and vocabulary:\n"""\n${p.pdfContext.slice(0, 1500)}\n"""\n` : ""}
═══ LEARNER ═══
Level: ${p.level} · Style: ${p.learningStyle} (${styleDesc[p.learningStyle]})

═══ QUALITY BAR — apply every rule ═══
1. SECOND PERSON: write directly to "you", never "the learner" or "one should".
2. CONCRETE BEFORE ABSTRACT: open every concept with a real ${p.domain} scenario, not a definition.
3. DEFINE JARGON: every domain-specific term gets a one-sentence plain-English definition on first use.
4. TIGHT PROGRESSION: each section advances on the previous — no filler, no redundancy.
5. WORKED EXAMPLES with explicit reasoning: show the step AND explain "we do this because…".
6. CUT HEDGING: "it can be useful in some cases" → delete. "Use it when X happens" → keep.
7. SECTION TITLES must be specific (not "Introduction", "Overview", "Summary").

═══ KNOWLEDGE CHECK RULES — read carefully ═══
Write exactly 2 multiple-choice questions. For each question:
• Write 4 options where the 3 wrong ones are PLAUSIBLE mistakes a real learner would make — not absurd foils.
• Choose a RANDOM integer 0–3 for correct_index. Think of a number before writing options, then place the correct answer at that position.
• SELF-CHECK: after writing, verify the option at correct_index is actually the right answer.
• The two questions must NOT both have correct_index = 0. If they do, change one.
• "explanation" must say why the WRONG options are wrong — not just restate the correct answer.
• Questions must test APPLICATION or TRANSFER (not "what did the lesson say about X").

═══ OUTPUT SCHEMA ═══
{
  "content_json": {
    "sections": [
      {
        "id": "section-1",
        "title": string,           // specific to this lesson's topic
        "type": "concept",
        "content_markdown": string // open with a real scenario, then explain — ${wordRange} words
      },
      {
        "id": "section-2",
        "title": string,
        "type": "example",
        "content_markdown": string // complete worked example with step-by-step reasoning — ${wordRange} words
      },
      {
        "id": "section-3",
        "title": string,
        "type": "deep-dive",
        "content_markdown": string // common mistakes, edge cases, mental models — ${wordRange} words
      }${sectionCount === 4 ? `,
      {
        "id": "section-4",
        "title": string,
        "type": "practice",
        "content_markdown": string // how this is applied in real ${p.domain} work — ${wordRange} words
      }` : ""}
    ],
    "knowledge_checks": [
      {
        "after_section": "${checkIndices[0]}",
        "question": string,        // tests application, not recall
        "options": [string, string, string, string],
        "correct_index": number,   // 0–3, RANDOMISED — place correct answer here
        "explanation": string      // explains why each wrong option is wrong
      },
      {
        "after_section": "${checkIndices[1]}",
        "question": string,        // different type of question from check #1
        "options": [string, string, string, string],
        "correct_index": number,   // must differ from check #1's correct_index if possible
        "explanation": string
      }
    ],
    "key_takeaways": string[]      // exactly ${sectionCount === 4 ? 4 : 3} items, each starts with a verb, max 20 words each${p.includePractice ? `,
    "practice_challenge": {
      "title": string,
      "description": string,       // specific task with concrete success criteria — not vague ("build something")
      "hints": [string, string],   // progressive: hint 1 nudges direction, hint 2 gives a concrete starting point
      "solution_markdown": string  // complete solution with explanation of every key decision"
    }` : ""}
  },
  "content_markdown": string,      // all sections concatenated as a single markdown string (fallback renderer)
  "resources_json": [              // 2–3 items — NO URLs, Skillify resolves them
    { "type": "article" | "video" | "docs", "title": string, "search_query": string }
  ]
}

Return JSON only. Begin with { and end with }.`;
}

// ─── Legacy prompt (kept for /api/ai/generate route) ─────────────────────────

export function getCourseGeneratorPrompt(p: CourseGeneratorParams): string {
  const lessonsPerModule = p.minutesPerDay <= 15 ? 3 : p.minutesPerDay <= 30 ? 4 : 5;
  const includePractice = p.learningStyle === "practical" || p.learningStyle === "balanced";

  return `Create a complete ${p.durationWeeks}-week course on "${p.domain}" for a ${p.level}-level learner.

Learner profile:
- Level: ${p.level}
- Daily study time: ${p.minutesPerDay} minutes
- Learning style: ${p.learningStyle} (${styleDesc[p.learningStyle]})
- Duration: ${p.durationWeeks} weeks${
    p.pdfContext
      ? `\n\nContext from uploaded materials:\n${p.pdfContext.slice(0, 3000)}`
      : ""
  }

Create ${p.durationWeeks} modules (one per week), each with ${lessonsPerModule} lessons.

Return ONLY valid JSON — no markdown, no extra text:

{
  "title": "Engaging course title",
  "description": "2-3 sentence overview",
  "modules": [
    {
      "title": "Module title",
      "description": "What this week covers",
      "order_index": 0,
      "duration_days": 7,
      "lessons": [
        {
          "title": "Lesson title",
          "order_index": 0,
          "xp_reward": 50,
          "estimated_minutes": 8,
          "difficulty": "standard",
          "content_markdown": "Full lesson content",
          "resources_json": [],
          "content_json": null
        }
      ]
    }
  ]
}`;
}
