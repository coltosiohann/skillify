export interface QuizGeneratorParams {
  moduleTitle: string;
  lessons: { title: string; content: string }[];
}

export function getQuizGeneratorPrompt({ moduleTitle, lessons }: QuizGeneratorParams): string {
  const lessonSummary = lessons
    .map((l, i) => `Lesson ${i + 1}: ${l.title}\n${l.content.slice(0, 600)}`)
    .join("\n\n---\n\n");

  return `Generate a module quiz for: "${moduleTitle}"

Based on these lessons:
${lessonSummary}

Return a JSON object with exactly 5 multiple-choice questions. Each question should test understanding of the module content.

Format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Brief explanation of why this is correct."
    }
  ]
}

Rules:
- Mix easy, medium, and hard questions
- Make wrong answers plausible but clearly incorrect to someone who studied
- Keep questions concise and unambiguous
- Return ONLY the JSON object, no markdown or extra text`;
}
