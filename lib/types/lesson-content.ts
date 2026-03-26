export interface LessonSection {
  id: string;
  title: string;
  content_markdown: string;
  type: "concept" | "example" | "deep-dive" | "practice";
}

export interface KnowledgeCheck {
  after_section: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface PracticeChallenge {
  title: string;
  description: string;
  hints: string[];
  solution_markdown: string;
}

export interface LessonContent {
  sections: LessonSection[];
  knowledge_checks: KnowledgeCheck[];
  key_takeaways: string[];
  practice_challenge?: PracticeChallenge;
}
