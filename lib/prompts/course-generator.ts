// ─── Types ────────────────────────────────────────────────────────────────────

export type GoalType = "auto" | "learning" | "execution" | "tool-based" | "hybrid";
export type PreferredOutput = "auto" | "explanation" | "action-plan" | "tools" | "hybrid";

export interface CourseGeneratorParams {
  domain: string;
  level: "beginner" | "intermediate" | "advanced";
  durationWeeks: number;
  minutesPerDay: number;
  learningStyle: "theory" | "practical" | "balanced";
  pdfContext?: string;
  // Intent fields
  goalType?: GoalType;           // user-selected or "auto" to infer
  preferredOutput?: PreferredOutput;
  wantsPractical?: boolean;
  wantsExplanation?: boolean;
  // Smart context fields (from Step 3 wizard)
  timeframe?: string;            // e.g. "6 weeks", "3 months"
  useCases?: string[];           // e.g. ["content creation", "social media"]
  constraints?: string[];        // e.g. ["no equipment", "free tools only"]
}

export interface LessonContentPromptParams {
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
  // Course context
  courseTitle: string;
  courseLearningOutcomes: string[];
  allModuleTitles: string[];
  learningObjective: string;
  courseMode: string;           // passed from outline so lessons stay consistent
}

// ─── System prompt ────────────────────────────────────────────────────────────

export const COURSE_SYSTEM_PROMPT = `You are Skillify's Lead Curriculum Architect — a world-class instructional designer with expertise in adult learning theory, Bloom's taxonomy, cognitive load theory, and the worked-example / faded-guidance method.

You are also an expert at:
• Designing execution-focused plans for physical transformations, habits, and performance goals
• Building tool-based and workflow-oriented courses for AI tools, software, marketing systems, and automation
• Creating hybrid programs that blend understanding with immediate practical action

Your courses adapt to the learner's goal, not to a fixed academic template. You FIRST decide what kind of course will actually help this person, then generate content that matches that mode.

Your content is known for:
• Being concrete and specific to the learner's actual domain — never generic
• Second-person voice ("you'll...") that respects the learner's time
• Lessons that build on each other in a tight, progressive arc
• Defining every jargon term on first use
• In execution mode: clear daily/weekly actions, routines, and measurable milestones
• In tool-based mode: named tools, step-by-step usage, workflows, prompts, templates
• In learning mode: worked examples, mental models, knowledge checks that test transfer

Return ONLY valid JSON. No markdown fences, no commentary. Begin with { and end with }.`;

// ─── Learning style descriptions ──────────────────────────────────────────────

const styleDesc = {
  theory:     "deep conceptual understanding, mental models, first-principles reasoning",
  practical:  "hands-on tasks, real projects, learning by doing",
  balanced:   "alternating between clear explanations and immediate hands-on practice",
} as const;

// ─── Course mode detection hint ───────────────────────────────────────────────

function buildModeHint(p: CourseGeneratorParams): string {
  if (p.goalType && p.goalType !== "auto") {
    return `The learner has explicitly selected course mode: "${p.goalType}". Apply this mode throughout.`;
  }

  return `Determine the correct course mode by analysing the learner goal "${p.domain}":

COURSE MODES:
1. "learning"  — learner wants to deeply understand a subject.
   Signals: "learn X", "understand X", "study X", "master the theory of X"
   Focus: concepts → examples → deep-dives → knowledge checks

2. "execution" — learner wants a measurable transformation or result.
   Signals: physical goals (fitness, weight loss, muscle), habit formation, skill-building deadlines,
   "get a 6-pack", "lose 10kg", "run a marathon", "build a morning routine"
   Focus: daily/weekly action plans, routines, measurable milestones — minimal abstract theory

3. "tool-based" — learner wants to use software, AI tools, platforms or workflows.
   Signals: AI marketing, content creation, prompt engineering, automation, "use AI for X",
   design tools, productivity tools, workflow systems, lead generation
   Focus: named tools, step-by-step usage, workflows, prompts, templates, real scenarios

4. "hybrid" — learner wants both understanding AND practical implementation.
   Signals: "learn and apply", business strategy + execution, technical concepts + projects
   Focus: concise explanations first, then immediate application and workflows

INFER the most helpful mode. When in doubt, prefer "execution" for physical/habit goals
and "tool-based" for anything involving software, AI, or digital workflows.`;
}

// ─── Phase 1: Course Outline ──────────────────────────────────────────────────

export function getCourseOutlinePrompt(p: CourseGeneratorParams): string {
  const lessonsPerModule = p.minutesPerDay <= 15 ? 3 : p.minutesPerDay <= 30 ? 4 : 5;
  const totalLessons = p.durationWeeks * lessonsPerModule;
  const totalMinutes = p.durationWeeks * 7 * p.minutesPerDay;
  const avgMin = Math.round(totalMinutes / totalLessons);
  const minSum = Math.round(totalMinutes * 0.85);
  const maxSum = Math.round(totalMinutes * 1.15);

  const contextLines: string[] = [];
  if (p.timeframe)               contextLines.push(`Timeframe / deadline: ${p.timeframe}`);
  if (p.useCases?.length)        contextLines.push(`Use-case focus: ${p.useCases.join(", ")}`);
  if (p.constraints?.length)     contextLines.push(`Constraints / preferences: ${p.constraints.join(", ")}`);
  if (p.preferredOutput && p.preferredOutput !== "auto") contextLines.push(`Preferred output format: ${p.preferredOutput}`);
  if (p.wantsPractical === false) contextLines.push(`Learner prefers less hands-on practice — focus more on understanding.`);
  if (p.wantsExplanation === false) contextLines.push(`Learner prefers minimal theory — focus on action and results.`);

  return `Design a ${p.durationWeeks}-week course for this learner.

═══ LEARNER GOAL ═══
Goal / Topic: "${p.domain}"
Skill level: ${p.level}
Daily commitment: ${p.minutesPerDay} min/day
Learning style: ${p.learningStyle} — ${styleDesc[p.learningStyle]}
Total time budget: ${totalMinutes} min across ${totalLessons} lessons (~${avgMin} min avg)${contextLines.length > 0 ? "\n" + contextLines.join("\n") : ""}
${p.pdfContext ? `\nLEARNER MATERIALS — use to personalise scope, tools, and terminology:\n"""\n${p.pdfContext.slice(0, 2500)}\n"""\n` : ""}
═══ STEP 1: DETERMINE COURSE MODE ═══
${buildModeHint(p)}

═══ STEP 2: DESIGN PRINCIPLES (apply to chosen mode) ═══

For ALL modes:
• Backwards design: decide the end-state first, then build the path to it.
• Each module has ONE tight, specific theme — no "Miscellaneous" or "Wrap-up" modules.
• Lessons within a module build directly on each other.
• Lesson titles are outcome-oriented: "Do/Build/Use X" not "Introduction to X".

For "learning" mode:
• Bloom's progression: early modules = Remember/Understand, middle = Apply/Analyse, late = Evaluate/Create.
• Every concept gets a concrete example from "${p.domain}".

For "execution" mode:
• Modules map to weekly transformation milestones (Week 1: Foundation, Week 2: Build habit, etc.)
• Lessons are primarily routines, drills, checklists, and measurable tasks.
• Minimal abstract theory unless directly required for safe/effective execution.
• Include progression markers (e.g. "Week 2: increase reps by 20%").

For "tool-based" mode:
• Modules map to key tools, platforms, or workflow stages.
• Every lesson introduces a specific tool/feature, shows how to use it, and gives a practical task.
• Include named tools (e.g. ChatGPT, Notion, Canva, HubSpot, Zapier — appropriate to domain).
• Workflows > definitions.

For "hybrid" mode:
• Alternate: understand the concept → immediately apply it.
• Early modules lean theory, later modules lean execution/tools.

═══ STEP 3: OUTPUT SCHEMA ═══
Return JSON matching exactly:
{
  "course_mode": "learning" | "execution" | "tool-based" | "hybrid",
  "goal_summary": string,         // one sentence: what the learner can DO by the end
  "title": string,                // specific, benefit-driven (NOT "Learn ${p.domain}")
  "description": string,          // 2–3 sentences: concrete capability the learner gains
  "learning_outcomes": string[],  // 4–6 items, each starts with an action verb
  "modules": [                    // EXACTLY ${p.durationWeeks} items
    {
      "title": string,            // theme + weekly milestone
      "description": string,      // 1–2 sentences: what the learner masters this week
      "order_index": number,      // 0-based
      "duration_days": 7,
      "lessons": [                // EXACTLY ${lessonsPerModule} items
        {
          "title": string,             // specific, outcome-oriented
          "order_index": number,       // 0-based within module
          "xp_reward": 50 | 75 | 100,
          "estimated_minutes": number, // 5–15
          "difficulty": "easy" | "standard" | "challenging",
          "learning_objective": string // "By the end of this lesson you can ___"
        }
      ]
    }
  ]
}

HARD CONSTRAINTS:
• Exactly ${p.durationWeeks} modules
• Exactly ${lessonsPerModule} lessons per module (${totalLessons} total)
• No lesson title uses the word "Introduction" except lesson 1 of module 1
• No two consecutive lesson titles start with the same verb
• Sum of estimated_minutes between ${minSum} and ${maxSum}
• learning_outcomes: 4–6 items
• Every learning_objective starts with "By the end of this lesson you can"

Return JSON only. Begin with { and end with }.`;
}

// ─── Phase 2: Single Lesson Content ──────────────────────────────────────────

export function getLessonContentPrompt(p: LessonContentPromptParams): string {
  const sectionCount = p.estimatedMinutes <= 8 ? 3 : 4;
  const wordRange    = p.estimatedMinutes <= 8 ? "120–180" : "180–260";
  const prevContext  = p.previousLessonTitles.length > 0
    ? `\nALREADY COVERED — do not repeat: ${p.previousLessonTitles.map(t => `"${t}"`).join(", ")}`
    : "";
  const checkIndices = sectionCount === 4 ? ["section-2", "section-4"] : ["section-2", "section-3"];

  // Mode-specific section emphasis
  const modeGuidance: Record<string, string> = {
    "learning": `LEARNING MODE — section design:
• section-1 ("concept"): open with a real scenario, explain the concept clearly for a ${p.level} learner.
• section-2 ("example"): complete worked example with step-by-step reasoning.
• section-3 ("deep-dive"): edge cases, common mistakes, mental models.${sectionCount === 4 ? `\n• section-4 ("deep-dive" or "practice"): advanced nuance or a mini application.` : ""}`,

    "execution": `EXECUTION MODE — section design:
• section-1 ("concept"): only essential background needed to execute safely and effectively (keep short).
• section-2 ("practice"): the core routine, drill, or action plan — be specific with sets/reps/times/steps.
• section-3 ("example"): show a real person's week/day implementation as a model.${sectionCount === 4 ? `\n• section-4 ("practice"): progression milestone or checkpoint — how to know it's working.` : ""}
Knowledge checks should test practical decision-making (e.g. "If your form breaks on rep 8, you should…").
Practice challenge MUST be a real, measurable task the learner does today.`,

    "tool-based": `TOOL-BASED MODE — section design:
• section-1 ("concept"): what this tool/feature is, when to use it, why it matters — be specific by name.
• section-2 ("example"): exact step-by-step walkthrough: open the tool → click X → type Y → get Z.
• section-3 ("practice"): a real workflow using this tool in a ${p.domain} context.${sectionCount === 4 ? `\n• section-4 ("deep-dive"): advanced settings, integrations with other tools, or time-saving shortcuts.` : ""}
Include tool names, feature names, and specific UI actions. No vague descriptions.
Practice challenge MUST involve using the specific tool described in this lesson.`,

    "hybrid": `HYBRID MODE — section design:
• section-1 ("concept"): concise explanation — 2–3 paragraphs max.
• section-2 ("example"): concrete application in ${p.domain} context.
• section-3 ("practice"): hands-on exercise combining understanding + action.${sectionCount === 4 ? `\n• section-4 ("deep-dive" or "practice"): go further — tool, workflow, or deeper scenario.` : ""}`,
  };

  const guidance = modeGuidance[p.courseMode] ?? modeGuidance["learning"];

  return `Write the full content for ONE lesson. Make it the best lesson in the course.

═══ COURSE CONTEXT ═══
Course: "${p.courseTitle}"
Mode: ${p.courseMode}
What the learner achieves by end of course:
${p.courseLearningOutcomes.map(o => `  • ${o}`).join("\n")}

Full module arc:
${p.allModuleTitles.map((t, i) => `  ${i + 1}. ${t}`).join("\n")}

═══ THIS LESSON ═══
Title: "${p.lessonTitle}"
Learning objective: ${p.learningObjective}
Position: lesson ${p.lessonIndex + 1} of ${p.totalLessonsInModule} in module "${p.moduleTitle}"
Module focus: ${p.moduleDescription}
Difficulty: ${p.difficulty} · Target time: ${p.estimatedMinutes} min${prevContext}
${p.pdfContext ? `\nLEARNER MATERIALS:\n"""\n${p.pdfContext.slice(0, 1500)}\n"""\n` : ""}
═══ LEARNER ═══
Level: ${p.level} · Style: ${p.learningStyle} (${styleDesc[p.learningStyle]})

═══ MODE-SPECIFIC SECTION DESIGN ═══
${guidance}

═══ UNIVERSAL QUALITY RULES ═══
1. SECOND PERSON. Write to "you", never "the learner" or "one should".
2. CONCRETE > ABSTRACT. Every concept gets a real example from the "${p.lessonTitle}" context.
3. DEFINE JARGON on first use — one plain-English sentence.
4. PROGRESSIVE: each section advances on the previous. Cut filler.
5. WORKED EXAMPLES must show the step AND explain "we do this because…".
6. CUT HEDGING. "It can sometimes be useful" → delete. "Use it when X" → keep.
7. SECTION TITLES must be specific — not "Introduction", "Overview", "Summary".

═══ KNOWLEDGE CHECK RULES ═══
Write exactly 2 multiple-choice questions:
• 4 options each — the 3 wrong ones must be PLAUSIBLE mistakes a real learner makes.
• Choose a RANDOM integer 0–3 for correct_index BEFORE writing the options, then place the correct answer at that position.
• SELF-CHECK: verify the option at correct_index is actually correct.
• The two checks must NOT both have correct_index = 0.
• Explanation must say why the WRONG options are wrong — not just restate the right answer.
• ${p.courseMode === "execution" || p.courseMode === "tool-based"
    ? "Questions must test practical decision-making, not memorised definitions."
    : "Questions must test application or transfer, not recall."}

═══ OUTPUT SCHEMA ═══
{
  "content_json": {
    "sections": [
      { "id": "section-1", "title": string, "type": "concept" | "practice" | "example" | "deep-dive", "content_markdown": string },
      { "id": "section-2", "title": string, "type": "concept" | "practice" | "example" | "deep-dive", "content_markdown": string },
      { "id": "section-3", "title": string, "type": "concept" | "practice" | "example" | "deep-dive", "content_markdown": string }${sectionCount === 4 ? `,
      { "id": "section-4", "title": string, "type": "concept" | "practice" | "example" | "deep-dive", "content_markdown": string }` : ""}
    ],
    "knowledge_checks": [
      {
        "after_section": "${checkIndices[0]}",
        "question": string,
        "options": [string, string, string, string],
        "correct_index": number,
        "explanation": string
      },
      {
        "after_section": "${checkIndices[1]}",
        "question": string,
        "options": [string, string, string, string],
        "correct_index": number,
        "explanation": string
      }
    ],
    "key_takeaways": string[]     // exactly ${sectionCount === 4 ? 4 : 3} items, each starts with a verb, max 20 words${p.includePractice ? `,
    "practice_challenge": {
      "title": string,
      "description": string,     // specific task with concrete success criteria
      "hints": [string, string],
      "solution_markdown": string
    }` : ""}
  },
  "content_markdown": string,     // all sections concatenated (fallback renderer)
  "resources_json": [             // 2–3 items — provide REAL, working URLs
    {
      "type": "article" | "video" | "docs" | "tool",
      "title": string,
      "url": string    // Rules by type:
                       // "video"   → https://www.youtube.com/results?search_query=ENCODED_SPECIFIC_QUERY
                       //             (e.g. "react+hooks+tutorial+for+beginners")
                       // "article" → real URL: prefer official docs (developer.mozilla.org, react.dev,
                       //             docs.python.org, docs.swift.org, etc.) or well-known resources
                       // "docs"    → official documentation URL for the library/framework/language
                       // "tool"    → official website of the tool (e.g. https://prettier.io)
    }
  ]
}

Each section: ${wordRange} words. Return JSON only. Begin with { and end with }.`;
}

// ─── Legacy prompt (kept for /api/ai/generate route) ─────────────────────────

export function getCourseGeneratorPrompt(p: CourseGeneratorParams): string {
  const lessonsPerModule = p.minutesPerDay <= 15 ? 3 : p.minutesPerDay <= 30 ? 4 : 5;
  return `Create a ${p.durationWeeks}-week course on "${p.domain}" for a ${p.level}-level learner.
Level: ${p.level}, Daily: ${p.minutesPerDay} min, Style: ${p.learningStyle}
${p.pdfContext ? `Context:\n${p.pdfContext.slice(0, 2000)}` : ""}
Return ONLY valid JSON with ${p.durationWeeks} modules, each with ${lessonsPerModule} lessons.`;
}
