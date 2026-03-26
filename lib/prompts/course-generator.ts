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
