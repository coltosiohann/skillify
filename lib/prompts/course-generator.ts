export interface LessonContentPromptParams {
  domain: string;
  level: "beginner" | "intermediate" | "advanced";
  learningStyle: "theory" | "practical" | "balanced";
  moduleTitle: string;
  moduleDescription: string;
  lessonTitle: string;
  lessonIndex: number;       // 0-based within module
  totalLessonsInModule: number;
  estimatedMinutes: number;
  difficulty: "easy" | "standard" | "challenging";
  includePractice: boolean;
  previousLessonTitles: string[]; // up to 3 prior lesson titles for continuity
  pdfContext?: string;
}

export interface CourseGeneratorParams {
  domain: string;
  level: "beginner" | "intermediate" | "advanced";
  durationWeeks: number;
  minutesPerDay: number;
  learningStyle: "theory" | "practical" | "balanced";
  pdfContext?: string;
}

const styleDesc = {
  theory: "focus on deep conceptual understanding, explanations, and theory",
  practical: "focus on hands-on projects, exercises, and real-world application",
  balanced: "balance theory with practical exercises equally",
} as const;

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
      ? `\n\nContext from uploaded materials (use this to personalize the course):\n${p.pdfContext.slice(0, 3000)}`
      : ""
  }

Create ${p.durationWeeks} modules (one per week), each with ${lessonsPerModule} lessons.

IMPORTANT: Each lesson must use the structured "content_json" format with progressive sections, inline knowledge checks, and key takeaways. This creates an interactive learning experience.

Return ONLY valid JSON — no markdown, no extra text:

{
  "title": "Engaging course title (not generic)",
  "description": "2-3 sentence overview of what the learner will achieve",
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
          "content_markdown": "Full lesson as a single markdown string (concatenation of all sections — this is the fallback)",
          "resources_json": [
            {"type": "article", "title": "Resource name", "url": "https://example.com"},
            {"type": "video", "title": "Video name", "url": "https://youtube.com/..."}
          ],
          "content_json": {
            "sections": [
              {
                "id": "section-1",
                "title": "Introduction",
                "content_markdown": "100-200 words introducing the concept with clear explanation",
                "type": "concept"
              },
              {
                "id": "section-2",
                "title": "How It Works",
                "content_markdown": "100-200 words with examples, code snippets, or detailed breakdown",
                "type": "example"
              },
              {
                "id": "section-3",
                "title": "Going Deeper",
                "content_markdown": "100-200 words exploring nuances, edge cases, or advanced aspects",
                "type": "deep-dive"
              }
            ],
            "knowledge_checks": [
              {
                "after_section": "section-2",
                "question": "A question testing understanding of the concept just taught",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_index": 0,
                "explanation": "Brief explanation of why this answer is correct"
              }
            ],
            "key_takeaways": [
              "First key point to remember",
              "Second key point to remember",
              "Third key point to remember"
            ]${includePractice ? `,
            "practice_challenge": {
              "title": "Challenge title",
              "description": "A hands-on exercise for the learner to try",
              "hints": ["First hint", "Second hint"],
              "solution_markdown": "The solution with explanation"
            }` : ""}
          }
        }
      ]
    }
  ]
}

Rules:
- Each lesson MUST have 3-4 sections in content_json.sections
- Section types: "concept" for theory, "example" for worked examples, "deep-dive" for advanced content, "practice" for exercises
- Each lesson MUST have 1-2 knowledge_checks placed after relevant sections
- Each lesson MUST have 3-5 key_takeaways
- ${includePractice ? "Each lesson MUST have a practice_challenge" : "practice_challenge is optional"}
- content_markdown must be a concatenation of all section content (as fallback)
- Content must be ${p.level}-appropriate, not too basic or too advanced
- Use real, well-known URLs (MDN, official docs, YouTube, freeCodeCamp, Khan Academy, etc.)
- XP: 50 for standard, 75 for challenging, 100 for very challenging lessons
- estimated_minutes: realistic estimate (5-15 min per lesson)
- difficulty: "easy", "standard", or "challenging"
- Knowledge check questions must directly test what was just taught in the preceding sections
- Key takeaways must be concise, actionable, and memorable`;
}

// ─── Phase 1: Course Outline Prompt ──────────────────────────────────────────

export function getCourseOutlinePrompt(p: CourseGeneratorParams): string {
  const lessonsPerModule = p.minutesPerDay <= 15 ? 3 : p.minutesPerDay <= 30 ? 4 : 5;
  const totalLessons = p.durationWeeks * lessonsPerModule;
  const totalMinutes = p.durationWeeks * 7 * p.minutesPerDay;
  const avgMinutesPerLesson = Math.round(totalMinutes / totalLessons);

  return `Create a course outline for a ${p.durationWeeks}-week course on "${p.domain}" for a ${p.level}-level learner.

Learner profile:
- Level: ${p.level}
- Daily study time: ${p.minutesPerDay} minutes/day
- Learning style: ${p.learningStyle} (${styleDesc[p.learningStyle]})
- Total duration: ${p.durationWeeks} weeks${
    p.pdfContext
      ? `\n\nContext from uploaded materials (use this to personalise the course):\n${p.pdfContext.slice(0, 2000)}`
      : ""
  }

REQUIREMENTS — read carefully:
1. Generate EXACTLY ${p.durationWeeks} modules (one per week). Count them before responding.
2. Each module must have EXACTLY ${lessonsPerModule} lessons. Count them before responding.
3. Total lessons: ${totalLessons}. Do NOT abbreviate with "..." or skip any.
4. Time budget: the learner has ${totalMinutes} total minutes. Distribute estimated_minutes across all ${totalLessons} lessons so they sum to approximately ${totalMinutes}. Average ~${avgMinutesPerLesson} min/lesson. Use 5-8 min for easy/intro lessons, 10-15 min for complex ones.
5. Module progression:
   - Modules 1-${Math.min(2, p.durationWeeks)}: Foundations and core concepts
   ${p.durationWeeks > 4 ? `- Middle modules: Building skills, applying knowledge, deeper exploration` : ""}
   - Final module${p.durationWeeks > 1 ? "s" : ""}: Advanced topics, real-world application${p.durationWeeks >= 4 ? ", capstone thinking" : ""}
6. Lesson titles within each module must progress logically — each lesson should build on the previous one.

Return ONLY valid JSON — no markdown, no extra text. The JSON must have EXACTLY ${p.durationWeeks} items in "modules" and EXACTLY ${lessonsPerModule} items in each "lessons" array:

{
  "title": "Specific, engaging course title",
  "description": "2-3 sentences describing what the learner will achieve by the end",
  "modules": [
    {
      "title": "Module 1: Foundations of ${p.domain}",
      "description": "What this week covers and why it matters",
      "order_index": 0,
      "duration_days": 7,
      "lessons": [
        {
          "title": "Getting Started with ${p.domain}",
          "order_index": 0,
          "xp_reward": 50,
          "estimated_minutes": ${Math.min(8, avgMinutesPerLesson)},
          "difficulty": "easy"
        },
        {
          "title": "Core Concepts Explained",
          "order_index": 1,
          "xp_reward": 50,
          "estimated_minutes": ${avgMinutesPerLesson},
          "difficulty": "standard"
        }${lessonsPerModule >= 3 ? `,
        {
          "title": "Putting It Into Practice",
          "order_index": 2,
          "xp_reward": 75,
          "estimated_minutes": ${Math.min(15, avgMinutesPerLesson + 2)},
          "difficulty": "standard"
        }` : ""}${lessonsPerModule >= 4 ? `,
        {
          "title": "Deep Dive: Key Patterns",
          "order_index": 3,
          "xp_reward": 75,
          "estimated_minutes": ${Math.min(15, avgMinutesPerLesson + 3)},
          "difficulty": "challenging"
        }` : ""}${lessonsPerModule >= 5 ? `,
        {
          "title": "Mini Project: Apply What You Know",
          "order_index": 4,
          "xp_reward": 100,
          "estimated_minutes": 15,
          "difficulty": "challenging"
        }` : ""}
      ]
    },
    {
      "title": "Module 2: Building on the Basics",
      "description": "What this week covers and why it matters",
      "order_index": 1,
      "duration_days": 7,
      "lessons": [
        {
          "title": "Lesson title here",
          "order_index": 0,
          "xp_reward": 50,
          "estimated_minutes": ${avgMinutesPerLesson},
          "difficulty": "standard"
        }
        ... (${lessonsPerModule - 1} more lessons)
      ]
    }
    ... (${p.durationWeeks - 2} more modules, for a total of ${p.durationWeeks})
  ]
}

CRITICAL: Your response must contain EXACTLY ${p.durationWeeks} module objects and EXACTLY ${lessonsPerModule} lesson objects inside each module. Verify your count before responding.`;
}

// ─── Phase 2: Single Lesson Content Prompt ────────────────────────────────────

export function getLessonContentPrompt(p: LessonContentPromptParams): string {
  const sectionCount = p.estimatedMinutes <= 8 ? 3 : 4;
  const wordRange = p.estimatedMinutes <= 8 ? "100-150" : "150-250";
  const prevContext = p.previousLessonTitles.length > 0
    ? `\nPrevious lessons in this module: ${p.previousLessonTitles.map((t, i) => `"${t}"`).join(", ")}. Build on these — don't repeat what was already covered.`
    : "";

  return `Generate the full content for ONE lesson in a ${p.domain} course.

Lesson: "${p.lessonTitle}"
Position: Lesson ${p.lessonIndex + 1} of ${p.totalLessonsInModule} in module "${p.moduleTitle}"
Module focus: ${p.moduleDescription}${prevContext}

Learner profile:
- Level: ${p.level}
- Learning style: ${p.learningStyle} (${styleDesc[p.learningStyle]})
- Target time: ${p.estimatedMinutes} minutes
- Difficulty: ${p.difficulty}
${p.pdfContext ? `\nContext from learner's uploaded materials:\n${p.pdfContext.slice(0, 1500)}\n` : ""}
Return ONLY valid JSON with these three top-level keys — no markdown, no extra text:

{
  "content_json": {
    "sections": [
      {
        "id": "section-1",
        "title": "Introduction to the topic",
        "content_markdown": "${wordRange} words — introduce the concept clearly for a ${p.level}-level learner",
        "type": "concept"
      },
      {
        "id": "section-2",
        "title": "How It Works",
        "content_markdown": "${wordRange} words — worked examples, code snippets, or concrete breakdown",
        "type": "example"
      },
      {
        "id": "section-3",
        "title": "Going Deeper",
        "content_markdown": "${wordRange} words — nuances, edge cases, or advanced aspects relevant to this lesson",
        "type": "deep-dive"
      }${sectionCount === 4 ? `,
      {
        "id": "section-4",
        "title": "Real-World Application",
        "content_markdown": "${wordRange} words — how this is used in real projects or professional contexts",
        "type": "practice"
      }` : ""}
    ],
    "knowledge_checks": [
      {
        "after_section": "section-2",
        "question": "A specific question testing understanding of what was just taught",
        "options": ["Correct answer", "Plausible wrong answer", "Another wrong answer", "Another wrong answer"],
        "correct_index": 0,
        "explanation": "Clear explanation of why the first option is correct"
      },
      {
        "after_section": "section-${sectionCount}",
        "question": "A question testing the deeper concept from the final section",
        "options": ["Correct answer", "Plausible wrong answer", "Another wrong answer", "Another wrong answer"],
        "correct_index": 0,
        "explanation": "Clear explanation of why the first option is correct"
      }
    ],
    "key_takeaways": [
      "First concise, actionable takeaway from this lesson",
      "Second key insight the learner should remember",
      "Third practical point they can apply immediately"${sectionCount === 4 ? `,
      "Fourth takeaway covering the real-world application aspect"` : ""}
    ]${p.includePractice ? `,
    "practice_challenge": {
      "title": "Hands-on challenge title",
      "description": "A concrete exercise the learner can do right now to apply what they just learned. Be specific.",
      "hints": ["First hint to guide them", "Second hint if they get stuck"],
      "solution_markdown": "Step-by-step solution with explanation of key decisions"
    }` : ""}
  },
  "content_markdown": "All sections concatenated into a single markdown string (this is the fallback renderer). Include all content from every section above.",
  "resources_json": [
    {"type": "article", "title": "Relevant resource title", "url": "https://real-url.com"},
    {"type": "video", "title": "Relevant video title", "url": "https://youtube.com/watch?v=..."},
    {"type": "article", "title": "Official docs or reference", "url": "https://real-docs-url.com"}
  ]
}

Rules:
- content_json.sections must have EXACTLY ${sectionCount} sections
- Each section: ${wordRange} words, ${p.level}-appropriate, directly about "${p.lessonTitle}"
- knowledge_checks: exactly 2, placed after section-2 and section-${sectionCount} respectively
- correct_index MUST be 0 in the JSON example but use 0, 1, 2, or 3 for the real answers — randomise the correct position
- key_takeaways: ${sectionCount === 4 ? "4" : "3"} items, concise and actionable
- resources_json: 2-3 real URLs from MDN, official docs, YouTube, freeCodeCamp, Khan Academy, etc.
- content_markdown: full concatenation of all sections (not a summary)
- Do NOT repeat content already covered in: ${p.previousLessonTitles.length > 0 ? p.previousLessonTitles.join(", ") : "N/A"}`;
}
