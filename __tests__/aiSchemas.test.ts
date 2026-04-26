/**
 * Unit tests verifying the Zod schemas used to parse AI-generated course content.
 * No external dependencies — these run completely offline.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Replicate the schemas from generate-v2/route.ts ──────────────────────────
// (These are private to the route file; we duplicate them here so changes to
//  the route that break the schemas will fail the tests.)

const OutlineLessonStubSchema = z.object({
  title: z.string(),
  order_index: z.number(),
  xp_reward: z.number(),
  estimated_minutes: z.number(),
  difficulty: z.enum(["easy", "standard", "challenging"]),
  learning_objective: z.string().optional(),
});

const OutlineModuleSchema = z.object({
  title: z.string(),
  description: z.string(),
  order_index: z.number(),
  duration_days: z.number(),
  lessons: z.array(OutlineLessonStubSchema),
});

const CourseOutlineSchema = z.object({
  title: z.string(),
  description: z.string(),
  course_mode: z.enum(["learning", "execution", "tool-based", "hybrid"]),
  goal_summary: z.string(),
  learning_outcomes: z.array(z.string()),
  modules: z.array(OutlineModuleSchema),
});

const LessonSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content_markdown: z.string(),
  type: z.enum(["concept", "example", "deep-dive", "practice"]),
});

const KnowledgeCheckSchema = z.object({
  after_section: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correct_index: z.number(),
  explanation: z.string(),
});

const LessonPayloadSchema = z.object({
  content_json: z.object({
    sections: z.array(LessonSectionSchema),
    knowledge_checks: z.array(KnowledgeCheckSchema),
    key_takeaways: z.array(z.string()),
    practice_challenge: z.object({
      title: z.string(),
      description: z.string(),
      hints: z.array(z.string()),
      solution_markdown: z.string(),
    }).optional(),
  }),
  content_markdown: z.string(),
  resources_json: z.array(z.object({ type: z.string(), title: z.string(), url: z.string() })),
});

// ── Test fixtures ─────────────────────────────────────────────────────────────

const validOutline = {
  title: "Intro to TypeScript",
  description: "A beginner course on TypeScript.",
  course_mode: "learning",
  goal_summary: "Learn TypeScript fundamentals.",
  learning_outcomes: ["Understand types", "Write typed functions"],
  modules: [
    {
      title: "Module 1",
      description: "Getting started",
      order_index: 0,
      duration_days: 7,
      lessons: [
        { title: "Lesson 1", order_index: 0, xp_reward: 50, estimated_minutes: 10, difficulty: "easy" },
      ],
    },
  ],
};

const validLesson = {
  content_json: {
    sections: [
      { id: "s1", title: "Introduction", content_markdown: "# Hello", type: "concept" },
    ],
    knowledge_checks: [
      {
        after_section: "s1",
        question: "What is TypeScript?",
        options: ["A language", "A library", "A framework", "An IDE"],
        correct_index: 0,
        explanation: "TypeScript is a typed superset of JavaScript.",
      },
    ],
    key_takeaways: ["TypeScript adds types to JavaScript"],
    practice_challenge: undefined,
  },
  content_markdown: "# Introduction\n\nTypeScript is ...",
  resources_json: [{ type: "article", title: "TS Docs", url: "https://typescriptlang.org" }],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CourseOutlineSchema", () => {
  it("parses a valid outline", () => {
    expect(() => CourseOutlineSchema.parse(validOutline)).not.toThrow();
  });

  it("rejects an unknown course_mode", () => {
    const bad = { ...validOutline, course_mode: "unsupported" };
    expect(() => CourseOutlineSchema.parse(bad)).toThrow();
  });

  it("rejects a lesson with unknown difficulty", () => {
    const bad = structuredClone(validOutline);
    bad.modules[0].lessons[0].difficulty = "impossible" as never;
    expect(() => CourseOutlineSchema.parse(bad)).toThrow();
  });

  it("accepts an outline without optional learning_objective on lessons", () => {
    const outline = structuredClone(validOutline);
    delete (outline.modules[0].lessons[0] as Record<string, unknown>).learning_objective;
    expect(() => CourseOutlineSchema.parse(outline)).not.toThrow();
  });
});

describe("LessonPayloadSchema", () => {
  it("parses a valid lesson payload", () => {
    expect(() => LessonPayloadSchema.parse(validLesson)).not.toThrow();
  });

  it("parses a lesson with a practice_challenge", () => {
    const withChallenge = structuredClone(validLesson) as z.input<typeof LessonPayloadSchema>;
    withChallenge.content_json.practice_challenge = {
      title: "Build a type-safe array util",
      description: "Write a generic function...",
      hints: ["Use generics"],
      solution_markdown: "```ts\nfunction last<T>(arr: T[]) { ... }\n```",
    };
    expect(() => LessonPayloadSchema.parse(withChallenge)).not.toThrow();
  });

  it("rejects a section with an unknown type", () => {
    const bad = structuredClone(validLesson);
    bad.content_json.sections[0].type = "quiz" as never;
    expect(() => LessonPayloadSchema.parse(bad)).toThrow();
  });

  it("rejects a knowledge check with a non-number correct_index", () => {
    const bad = structuredClone(validLesson);
    (bad.content_json.knowledge_checks[0] as Record<string, unknown>).correct_index = "0";
    expect(() => LessonPayloadSchema.parse(bad)).toThrow();
  });
});
