# Skillify — Upgrade Plan

Last updated: 2026-03-28

## App Status
Core learning flow is solid (~80% complete). AI course generation, lesson viewer, quiz engine, streak logic, auth, and DB schema are all working.

---

## Phase 1 — Complete the Core ✅ Priority: HIGH

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Quiz Engine** | ✅ Done | API route, QuizPlayer UI, QuizLoader, Take Quiz button on CourseView. Migration 002 added. |
| 2 | **Streak Logic** | ✅ Done | `markComplete` in LessonView now updates `current_streak` + `last_active_date` daily. |
| 3 | **Achievements** | ✅ Done | Full page already implemented — level card, badges, roadmap. Works once streak is live. |
| 4 | **Course Completion** | ✅ Done | `markComplete` now checks if all lessons done and sets course status = "completed". |
| 5 | **Settings / Billing** | ✅ Done | Full settings page with Profile, Notifications, Appearance, Billing tabs implemented. |
| 6 | **Practice Challenge** | ✅ Done | Already wired in `LessonStepper` — renders after all sections revealed. |

---

## Phase 2 — Polish & UX ✅ Priority: MEDIUM

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 7 | **Course Editor** | ✅ Done | `/courses/[id]/edit` — rename, reorder, delete modules/lessons. "Edit Course" button on CourseView. |
| 8 | **Loading Skeletons** | ✅ Done | `loading.tsx` for dashboard, courses list, and course detail pages. |
| 9 | **Notifications** | ✅ Done | Streak milestones (3/7/14/30/60/100d) and XP milestones (100–10k) in activity feed. |
| 10 | **Profile Page** | ✅ Done | Stats, level badge, achievements display (was already complete). |
| 11 | **Mobile Responsiveness** | ✅ Done | Hamburger menu, slide-in drawer with backdrop, `SidebarContext` provider. |
| 12 | **Rate Limiting** | ✅ Done | In-memory limiter on `/api/ai/generate` (5/hr), `/api/ai/quiz` (20/hr), `/api/ai/assess` (10/hr). |

---

## Phase 3 — Growth Features 🚀 Priority: LOW

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 13 | **Certificate on course completion** | ✅ Done | `/courses/[id]/certificate` — printable/shareable cert, "View Certificate" button on CourseView. |
| 14 | **Leaderboard** | ✅ Done | `/leaderboard` — weekly + all-time tabs, podium for top 3, streak display. Added to sidebar nav. |
| 15 | **Email reminders** | 📋 Planned | Daily study nudge via Supabase Edge Functions + Resend |
| 16 | **Error monitoring** | ✅ Done | Sentry installed, `sentry.*.config.ts` files, `withSentryConfig` in next.config.ts, `global-error.tsx`. Add `NEXT_PUBLIC_SENTRY_DSN` to env. |
| 17 | **Admin dashboard** | 📋 Planned | Usage stats, user list |

---

## Architecture Notes

- **Framework:** Next.js 16 App Router + React 19 + TypeScript
- **DB:** Supabase (PostgreSQL + Auth + Storage) — RLS on all tables
- **AI:** Anthropic Claude (primary) / OpenAI (fallback) via `lib/ai/provider.ts`
- **Payments:** Stripe (scaffolded, incomplete)
- **UI:** Tailwind CSS 4 + shadcn/ui (base-nova) + Framer Motion

### Key files
- `app/(app)/` — all protected pages
- `components/lesson/` — lesson viewer components
- `lib/ai/provider.ts` — AI provider abstraction
- `lib/prompts/` — course generation + assessment prompts
- `supabase/migrations/001_initial.sql` — full DB schema

---

## Progress Log

- [x] Phase 1.1 — Quiz Engine (2026-03-28)
- [x] Phase 1.2 — Streak Logic (2026-03-28)
- [x] Phase 1.3 — Achievements (was already complete)
- [x] Phase 1.4 — Course Completion (2026-03-28)
- [x] Phase 1.5 — Settings / Billing (was already complete)
- [x] Phase 1.6 — Practice Challenge (was already complete)
- [x] Phase 2.7 — Course Editor (2026-03-28)
- [x] Phase 2.8 — Loading Skeletons (2026-03-28)
- [x] Phase 2.9 — Notifications improvements (2026-03-28)
- [x] Phase 2.11 — Mobile Sidebar (2026-03-28)
- [x] Phase 2.12 — Rate Limiting (2026-03-28)

- [x] Phase 3.13 — Certificate page (2026-03-28)
- [x] Phase 3.14 — Leaderboard (2026-03-28)
- [x] Phase 3.16 — Sentry error monitoring (2026-03-28)

## Remaining (optional)

- Email reminders (item 15) — requires Resend API key + Supabase Edge Function
- Admin dashboard (item 17) — usage stats, user management
