# COURSE_CREATION_IMPROVEMENT — 2026-03-30

## Context

Users report two critical issues with course generation:
1. **Only 1 lesson is generated** regardless of course settings
2. **Time/schedule selection is ignored** — a 12-week course produces the same sparse output as a 1-week course

**Root causes identified:**
- `max_tokens: 16384` in `lib/ai/provider.ts` is far too small. A single lesson in `content_json` format runs ~1,100-2,100 tokens. A 4-week course (16 lessons) needs ~25,000 tokens. The model physically runs out of space.
- The prompt's JSON example shows only **1 module with 1 lesson** — the AI anchors on this structural example and produces minimal output, even when instructed to create more.
- No validation that the AI actually produced the correct number of modules/lessons.
- No explicit time budget instruction linking `durationWeeks * minutesPerDay` to total lesson minutes.

**Token math showing the problem:**

| Config | Modules | Lessons | Est. Output Tokens | vs. 16K limit |
|--------|---------|---------|-------------------|---------------|
| 1w × 15m | 1 | 3 | ~5,500 | OK |
| 4w × 30m | 4 | 16 | ~25,000 | OVER |
| 8w × 45m | 8 | 40 | ~61,000 | WAY OVER |
| 12w × 60m | 12 | 60 | ~91,000 | IMPOSSIBLE |

---

## Solution: Two-Phase Generation

Instead of generating the entire course in one massive API call, split into two phases:

**Phase 1 — Course Outline** (1 API call, ~2,000-4,000 tokens)
Generate the skeleton: course title, description, all module titles/descriptions, all lesson titles + metadata. No lesson content.

**Phase 2 — Lesson Content** (1 API call per lesson, ~1,500 tokens each)
For each lesson in the outline, generate the full `content_json`, `content_markdown`, and `resources_json` individually. Each call gets the model's full attention and token budget.

**Benefits:**
- Scales to any course size (1-week to 12-week)
- Partial failure recovery (retry individual lessons)
- Real progress tracking (lesson X of Y)
- Each lesson gets full token budget for rich content
- Time budget is enforced at the outline level

---

## Implementation Steps

### Step 1: Add `GenerateOptions` to AI provider
**File:** `lib/ai/provider.ts`

Add optional `maxTokens` parameter to `generateText()`:
```ts
interface GenerateOptions { maxTokens?: number }
export async function generateText(userPrompt: string, systemPrompt?: string, options?: GenerateOptions)
```
Apply `options?.maxTokens ?? 16384` to both Anthropic and OpenAI calls. Backward-compatible — existing callers are unaffected.

### Step 2: Create new prompt functions
**File:** `lib/prompts/course-generator.ts`

Add two new functions (keep existing `getCourseGeneratorPrompt` unchanged):

#### `getCourseOutlinePrompt(params)`
- Requests ONLY structural data (no content_markdown, no content_json, no resources_json)
- JSON example must show **2+ modules with 2-3 lessons each** to prevent single-item anchoring
- Explicit count enforcement: "Generate EXACTLY {durationWeeks} modules and EXACTLY {lessonsPerModule} lessons per module. Count them. Do NOT abbreviate."
- Time budget instruction: "Total time budget: {durationWeeks * 7 * minutesPerDay} minutes. Distribute across all {total} lessons so the sum of estimated_minutes equals the total budget."
- Progression instruction: "Modules build progressively — fundamentals first, advanced topics later"

#### `getLessonContentPrompt(context)`
Context includes: domain, level, learningStyle, moduleTitle, moduleDescription, lessonTitle, lessonIndex, totalLessonsInModule, estimatedMinutes, difficulty, includePractice, previousLessonTitles (for continuity), pdfContext (trimmed to 1500 chars).
- Scale section count with estimated_minutes: 3 sections for 5-8 min, 4 sections for 10-15 min
- Scale word count per section: 100-150 words for short lessons, 150-250 for longer
- Provide context about where this lesson sits in the module for coherence
- JSON example shows full `content_json` structure matching `LessonContent` interface

### Step 3: Create new API endpoint
**File:** `app/api/ai/generate-v2/route.ts`

SSE (Server-Sent Events) endpoint that streams typed progress events:

```
event: phase
data: {"phase":"outline","message":"Designing course structure..."}

event: outline
data: {"title":"...","modules":[...]}

event: phase
data: {"phase":"lessons","message":"Generating lessons...","total":16}

event: lesson
data: {"moduleIndex":0,"lessonIndex":0,"current":1,"total":16,"lesson":{...}}

event: lesson
data: {"moduleIndex":0,"lessonIndex":1,"current":2,"total":16,"lesson":{...}}

... (repeats for each lesson)

event: done
data: {}
```

Flow:
1. Auth + rate limiting (same as current: 5/hr per user)
2. **Phase 1:** Call `generateText(getCourseOutlinePrompt(body), systemPrompt, { maxTokens: 8192 })`. Parse JSON. **Validate** module count = `durationWeeks`, lesson count per module = `lessonsPerModule`. If wrong count, retry once. Send `outline` event.
3. **Phase 2:** Loop each module → each lesson. Call `generateText(getLessonContentPrompt({...}), systemPrompt, { maxTokens: 8192 })`. On parse failure, retry up to 2 times. Send `lesson` event with parsed content. On all retries exhausted, send `lesson-error` event and continue.
4. Send `done` event. Close stream.

**Retry logic:** Individual lesson failures don't kill the whole generation. Failed lessons are recorded and skipped.

**Concurrency:** Start sequential. If performance needs improvement later, add `Promise.all` batches of 3 with a semaphore. A 12-week course would drop from ~5 min to ~2 min.

### Step 4: Create SSE event types
**File:** `lib/types/generation-events.ts`

Shared types between API and client:
- `CourseOutline`: title, description, modules with lesson stubs (no content)
- `LessonPayload`: content_json (LessonContent), content_markdown, resources_json
- Event type unions for type-safe SSE parsing

### Step 5: Rewrite generating page
**File:** `app/(app)/onboarding/generating/page.tsx`

Replace the raw stream consumer with SSE event parsing:

**New state:**
```ts
phase: "connecting" | "outline" | "lessons" | "saving" | "done" | "error"
outlineData: CourseOutline | null
totalLessons: number
completedLessons: number
currentLessonLabel: string  // "Module 2 — Lesson 3: Title"
failedLessons: {moduleIdx: number, lessonIdx: number, title: string}[]
lessonResults: Map<string, LessonPayload>  // key: "modIdx-lessonIdx"
```

**Real progress bar** (no more fake random increments):
- Outline phase: 0% → 10%
- Lessons phase: 10% → 95% (`10 + (completed / total) * 85`)
- Saving phase: 95% → 100%

**Dynamic step labels:**
- "Designing your course structure..." (outline)
- "Generating lesson 5 of 16: Introduction to Variables" (lessons)
- "Saving your course..." (saving)

**Database save:** Same Supabase insert logic (course → modules → lessons), but data comes from `outlineData` + `lessonResults` map instead of one big JSON blob. For each lesson in outline, look up content from `lessonResults`. If a lesson failed, insert it with empty `content_json` and a placeholder `content_markdown`.

**Failed lesson handling:** If any lessons failed, show a yellow warning: "{n} lessons could not be generated. You can still start your course — those lessons will have simplified content."

### Step 6: Update generating page API call
**File:** `app/(app)/onboarding/generating/page.tsx`

Change the fetch URL from `/api/ai/generate` to `/api/ai/generate-v2`.

---

## Prompt Recommendations

### Outline Prompt — Key Instructions
```
You MUST generate EXACTLY {N} modules and EXACTLY {M} lessons per module.
Count your output carefully before responding.

Time budget: The learner has {totalMinutes} total minutes.
Distribute estimated_minutes across all {totalLessons} lessons so they sum to approximately {totalMinutes}.
Use 5-8 minutes for introductory/easy lessons, 10-15 for complex/challenging ones.

Module progression:
- Modules 1-2: Foundations and core concepts
- Middle modules: Building skills and applying knowledge
- Final modules: Advanced topics, real-world application, capstone
```

### Lesson Content Prompt — Key Instructions
```
Generate ONE lesson: "{lessonTitle}" (Lesson {index} of {total} in module "{moduleTitle}").

Course: {domain} ({level} level)
This module covers: {moduleDescription}
Previous lesson was: {previousLessonTitle}
Target time: {estimatedMinutes} minutes
Learning style: {learningStyle}

Return content_json with {sectionCount} sections, each {wordRange} words.
Also return content_markdown (all sections concatenated) and resources_json (2-3 real resources).
```

---

## Files Changed

| File | Action | Why |
|------|--------|-----|
| `lib/ai/provider.ts` | Modified | Added `maxTokens` option |
| `lib/prompts/course-generator.ts` | Modified | Added `getCourseOutlinePrompt` + `getLessonContentPrompt` |
| `lib/types/generation-events.ts` | Created | SSE event types shared between API and client |
| `app/api/ai/generate-v2/route.ts` | Created | Two-phase SSE generation endpoint |
| `app/(app)/onboarding/generating/page.tsx` | Modified | Rewritten for SSE events + real progress |

**No changes to:** Database schema, `LessonContent` types, `LessonView`, `CourseView`, `LessonStepper`, or any other existing components. The old `/api/ai/generate` route is preserved.

---

## Verification Plan

1. **Unit test the prompts:** Generate an outline for a 4-week course at 30 min/day. Verify it has exactly 4 modules with 4 lessons each. Verify estimated_minutes sum ≈ 4 × 7 × 30 = 840.
2. **Test small course:** Create a 1-week, 15-min/day course (3 lessons). Verify all 3 lessons have full `content_json` with sections, knowledge_checks, and takeaways.
3. **Test medium course:** Create a 4-week, 30-min/day course (16 lessons). Verify all 16 lessons are generated and saved to Supabase.
4. **Test large course:** Create an 8-week, 45-min/day course (40 lessons). Verify progress bar shows real increments. Verify completion in reasonable time.
5. **Test error recovery:** Temporarily force a lesson to fail. Verify the generation continues and the warning message appears.
6. **Test UX:** Verify the progress bar advances smoothly, step labels update with real lesson titles, and the generation page redirects correctly on completion.
7. **Verify existing courses:** Open a previously generated course. Confirm `CourseView` and `LessonView` still render correctly (backward compatibility).
