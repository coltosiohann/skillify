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
  const minPerLesson = Math.round(p.minutesPerDay / lessonsPerModule);

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

Create ${p.durationWeeks} modules (one per week), each with ${lessonsPerModule} lessons of ~${minPerLesson} min each.

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
          "content_markdown": "Full lesson in markdown (400-600 words, include examples, key points, code snippets if relevant)",
          "resources_json": [
            {"type": "article", "title": "Resource name", "url": "https://example.com"},
            {"type": "video", "title": "Video name", "url": "https://youtube.com"}
          ],
          "order_index": 0,
          "xp_reward": 50
        }
      ]
    }
  ]
}

Rules:
- Content must be ${p.level}-appropriate, not too basic or too advanced
- Use real, well-known URLs (MDN, official docs, YouTube, freeCodeCamp, Khan Academy, etc.)
- XP: 50 for standard lessons, 75-100 for challenging ones
- content_markdown must have actual educational content (not placeholder text)`;
}
