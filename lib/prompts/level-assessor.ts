export function getAssessmentQuestionsPrompt(domain: string): string {
  return `Generate exactly 5 multiple-choice questions to assess a learner's knowledge of "${domain}".

Questions should span beginner to advanced difficulty to accurately gauge their level.
Return ONLY valid JSON — no markdown, no extra text:

{
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "difficulty": "beginner"
    },
    {
      "id": 2,
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "difficulty": "beginner"
    },
    {
      "id": 3,
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "difficulty": "intermediate"
    },
    {
      "id": 4,
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "difficulty": "intermediate"
    },
    {
      "id": 5,
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "difficulty": "advanced"
    }
  ]
}`;
}

export interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

export function getEvaluateLevelPrompt(
  domain: string,
  questions: AssessmentQuestion[],
  answers: Record<number, string>
): string {
  const qa = questions
    .map(
      (q) =>
        `Q${q.id} [${q.difficulty}]: ${q.question}\nUser answered: "${answers[q.id] ?? "skipped"}"`
    )
    .join("\n\n");

  return `Evaluate this learner's skill level in "${domain}" based on their quiz answers:

${qa}

Return ONLY valid JSON — no markdown, no extra text:

{
  "level": "beginner",
  "confidence": 0.85,
  "summary": "One sentence description of their level"
}

level must be exactly one of: "beginner", "intermediate", "advanced"`;
}
