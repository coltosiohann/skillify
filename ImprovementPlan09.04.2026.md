# Skillify — App Improvement Plan (April 9, 2026)

## Overview
Full audit across UI/UX, API layer, database, AI pipeline, auth, and infrastructure. 40 actionable improvements grouped by priority tier.

---

## P0 — Critical (Security & Exploitable Bugs)

1. **XP awarded client-side** — user can POST arbitrary XP with no server validation  
   Location: quiz submit API route  
   Fix: Move XP calculation fully server-side; validate submitted score before awarding

2. **No input validation on any API endpoint** — raw `req.json()` used everywhere  
   Location: all `/api/` routes  
   Fix: Add Zod schemas to every route; return 400 on invalid input

3. **Assessment rate limiter uses IP** — shared NAT/VPN users share the same bucket  
   Location: `app/api/ai/assessment/route.ts`  
   Fix: Switch to `userId` for authenticated endpoints; IP only for anonymous

4. **Type assertion in search route** hides bad data from DB  
   Location: `app/api/search/route.ts`  
   Fix: Parse response with Zod; return typed error on shape mismatch

5. **Certificate share link has no privacy protection** — any URL holder sees the cert  
   Location: `app/(app)/certificate/[id]/`  
   Fix: Add `is_public` boolean per certificate; return 401 if private

6. **Quiz question structure not validated before DB insert**  
   Location: quiz creation routes  
   Fix: Validate shape of `questions` JSON with Zod before INSERT

---

## P1 — High Priority (Backend Hardening, DB Integrity, AI Config)

7. **Rate limiter race condition** — 2 DB round trips, not atomic  
   Location: `lib/rate-limit.ts`  
   Fix: Single `INSERT … ON CONFLICT DO UPDATE … RETURNING` query

8. **Missing RLS on `rate_limits` table**  
   Location: Supabase schema  
   Fix: Add policy — user can only read/write their own row

9. **Old `/api/ai/generate` route still live** alongside v2  
   Location: `app/api/ai/generate/route.ts`  
   Fix: Return 410 Gone with message pointing to v2; remove after grace period

10. **Duplicate JSON parsing logic** scattered across routes  
    Location: multiple API routes  
    Fix: Extract `parseJsonBody<T>(req, schema)` helper in `lib/api/`

11. **PDF upload truncates at 12 KB silently** — user doesn't know  
    Location: PDF upload handler  
    Fix: Detect truncation; return warning in API response; show toast in UI

12. **No environment variable validation at startup**  
    Location: `next.config.ts` / app boot  
    Fix: Add `lib/env.ts` with Zod; import in `next.config.ts` to fail fast at build time

13. **N+1 inserts when saving courses** — 35+ individual INSERTs per save  
    Location: course save logic in generating page  
    Fix: Batch insert modules + lessons with single `supabase.from().insert([...])` calls

14. **No CHECK constraint on `difficulty` column**  
    Location: `lessons` table in Supabase  
    Fix: Add `CHECK (difficulty IN ('beginner','intermediate','advanced'))`

15. **No validation on JSON columns** (`content_json`, `resources_json`)  
    Location: `lessons` table  
    Fix: Add IS JSON constraint or validate shape in application layer before insert

16. **`content_json` nullable but `LessonView` expects it**  
    Location: `lib/supabase/types.ts`, lesson view components  
    Fix: Either make column NOT NULL with default `{}`, or add null guard in every consumer

17. **No soft-delete / cascading delete protection**  
    Location: courses, modules, lessons tables  
    Fix: Add `deleted_at TIMESTAMPTZ` column + filter in queries; or confirm `ON DELETE CASCADE` is intentional

18. **6 parallel Supabase queries on dashboard** with hacky workaround  
    Location: `app/(app)/dashboard/page.tsx`  
    Fix: Consolidate into 1–2 queries using JOINs or a Postgres view

19. **AI model hardcoded** (`claude-opus-4-6` / `gpt-4o`)  
    Location: `lib/ai/provider.ts`  
    Fix: Read from `AI_MODEL` env var with fallback; document in `.env.example`

20. **No per-environment model config** — dev uses same expensive model as prod  
    Location: `lib/ai/provider.ts`  
    Fix: Dev defaults to cheaper/faster model; prod defaults to full model; override via env

21. **PDF truncation with no user-facing warning** (UI side)  
    Location: course creation PDF upload step  
    Fix: Show toast: "PDF was large; only the first portion was used for generation"

22. **Old generate route still accepts requests** — waste of resources  
    Location: `app/api/ai/generate/route.ts`  
    Fix: Return 410 Gone; audit that no UI component still calls this route

---

## P2 — Medium Priority (UX Polish, Marketing, DevOps)

23. **Password validation only on submit** — poor UX, no real-time feedback  
    Location: `app/(auth)/signup/page.tsx`  
    Fix: Add `onChange` validation + password strength meter

24. **No "Remember me" on login**  
    Location: `app/(auth)/login/page.tsx`  
    Fix: Add checkbox; pass `{ persistSession: true/false }` to Supabase auth call

25. **Filter/sort state not persisted in URL** — lost on refresh/back navigation  
    Location: `app/(app)/courses/page.tsx`  
    Fix: Sync filters to URL params (`?sort=&difficulty=&status=`) via `useSearchParams`

26. **Markdown renderer missing tables, blockquotes, images**  
    Location: markdown renderer component  
    Fix: Add `remark-gfm` plugin; style blockquotes + tables with Tailwind prose classes

27. **Quiz has no timer, no skip button, no review mode**  
    Location: `app/(app)/quiz/`  
    Fix: Add optional countdown timer; skip button; end-of-quiz review screen showing correct answers

28. **Onboarding tour missing "create new course" step**  
    Location: onboarding tour component  
    Fix: Add step pointing at the "New Course" button after profile setup

29. **Sidebar has no keyboard shortcuts**  
    Location: `components/Sidebar.tsx`  
    Fix: Add `Alt+D` (dashboard), `Alt+C` (courses), `Alt+N` (new course); show tooltip hints

30. **Mobile menu doesn't close on anchor link click**  
    Location: mobile menu component  
    Fix: Add `onClick={() => setOpen(false)}` to each nav link inside the mobile menu

31. **No focus trapping in modals/menus** — accessibility failure  
    Location: all modal and dropdown components  
    Fix: Use `@radix-ui/react-focus-scope` or the native `inert` attribute on background content

32. **Course editor implementation is incomplete / cut off**  
    Location: `app/(app)/courses/[id]/edit/`  
    Fix: Identify cut-off point; complete the lesson editor and save flow

33. **All stats are hardcoded/fake** ("10,000+ learners", "4.9/5 rating")  
    Location: `app/(landing)/page.tsx`  
    Fix: Pull real counts from DB or remove until real data is available

34. **All testimonials are fabricated** with stock avatars  
    Location: `app/(landing)/page.tsx`  
    Fix: Replace with real user quotes + photos, or remove section entirely

35. **Footer links all point to `#`** (About, Blog, Careers, etc.)  
    Location: landing layout / footer component  
    Fix: Remove dead links until pages exist; or create minimal placeholder pages

36. **Pricing CTAs link to `/signup?plan=pro`** but signup ignores the `plan` query param  
    Location: `app/(landing)/pricing/page.tsx`, `app/(auth)/signup/page.tsx`  
    Fix: Read `plan` param in signup; store intent in session/localStorage; wire to Stripe when ready

37. **No Stripe integration** despite displaying paid pricing tiers  
    Location: `app/(landing)/pricing/page.tsx`  
    Fix: Integrate Stripe Checkout for Pro plan; add `subscription_status` field in DB; gate Pro features

38. **Sentry source maps disabled** — production errors have no stack traces  
    Location: `next.config.ts` / Sentry config  
    Fix: Enable `widenClientFileUpload: true`; upload source maps in CI pipeline

39. **Service worker cache has no versioning** — stale assets served after deploy  
    Location: `public/sw.js` (or equivalent)  
    Fix: Add a cache version string; bust cache on each deploy (inject build hash)

40. **No environment variable validation at boot** (see also item 12)  
    Location: app startup  
    Fix: `lib/env.ts` with Zod parse of all required `process.env` keys; import in `next.config.ts`

---

## Priority Summary

| Priority | Items | Theme |
|----------|-------|-------|
| P0 — Critical | 1–6 | Security & exploitable bugs |
| P1 — High | 7–22 | Backend hardening, DB integrity, AI config |
| P2 — Medium | 23–40 | UX polish, marketing, DevOps |

---

*Generated: April 9, 2026 — Full audit across UI/UX, API, database, AI pipeline, auth, and infrastructure.*
