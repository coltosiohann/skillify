import type { LessonContent } from "./lesson-content";

// ─── Outline types (Phase 1 output) ───────────────────────────────────────────

export interface OutlineLessonStub {
  title: string;
  order_index: number;
  xp_reward: number;
  estimated_minutes: number;
  difficulty: "easy" | "standard" | "challenging";
}

export interface OutlineModule {
  title: string;
  description: string;
  order_index: number;
  duration_days: number;
  lessons: OutlineLessonStub[];
}

export interface CourseOutline {
  title: string;
  description: string;
  modules: OutlineModule[];
}

// ─── Lesson content payload (Phase 2 output per lesson) ───────────────────────

export interface LessonPayload {
  content_json: LessonContent;
  content_markdown: string;
  resources_json: { type: string; title: string; url: string }[];
}

// ─── SSE events streamed from /api/ai/generate-v2 ─────────────────────────────

export type PhaseEventData = {
  phase: "outline" | "lessons" | "saving" | "complete";
  message: string;
  total?: number; // total lessons (sent with "lessons" phase)
};

export type OutlineEventData = {
  outline: CourseOutline;
};

export type LessonEventData = {
  moduleIndex: number;
  lessonIndex: number;
  current: number; // 1-based counter
  total: number;
  lesson: LessonPayload;
};

export type LessonErrorEventData = {
  moduleIndex: number;
  lessonIndex: number;
  title: string;
  message: string;
};

export type ErrorEventData = {
  message: string;
  fatal: boolean;
};

// Discriminated union for client-side SSE parsing
export type SSEEvent =
  | { event: "phase"; data: PhaseEventData }
  | { event: "outline"; data: OutlineEventData }
  | { event: "lesson"; data: LessonEventData }
  | { event: "lesson-error"; data: LessonErrorEventData }
  | { event: "error"; data: ErrorEventData }
  | { event: "done"; data: Record<string, never> };
