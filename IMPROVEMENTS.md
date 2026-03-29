# Skillify — Improvement Proposals

**Date:** 2026-03-28
**Time:** 18:30 GTBST
**Reviewed by:** Claude (full UX + codebase audit)

---

## Critical (Broken or Misleading)

### 1. Search bar does nothing ✅ COMPLETED 2026-03-29 10:00
The search bar in the Topbar is purely cosmetic — typing into it produces no results. A user expects global search. Either implement search across courses/lessons or remove it to avoid confusion.

### 2. Notification bell always shows a dot ✅ COMPLETED 2026-03-28 19:10
The red dot on the bell icon in the Topbar is hardcoded — it always appears, even when there are zero new notifications. This trains users to ignore it. Show the dot only when there are unseen items, or show a count badge.

### 3. Avatar upload is a dead button ✅ COMPLETED 2026-03-28 21:10
Both the Profile page and Settings page show a camera icon on the avatar, implying upload is possible. Clicking does nothing. Either implement Supabase Storage upload or remove the camera icon.

### 4. Forgot password page missing ✅ COMPLETED 2026-03-28 19:55
The login page links to "Forgot password?" but there is no `/forgot-password` route. Users who forget their password are stuck. Implement a password reset flow using Supabase's `resetPasswordForEmail`.

### 5. Notification preferences don't persist ✅ COMPLETED 2026-03-28 20:40
The Settings > Notifications tab has toggles (Daily Reminder, Weekly Report, Streak Alert, etc.) that look functional but save nothing to the database. Users toggle them thinking they work. Either wire them to a `notification_preferences` column or remove them.

### 6. Level system is inconsistent ✅ COMPLETED 2026-03-28 19:10
The Dashboard calculates levels as `Math.floor(xp / 500)` with names [Beginner, Explorer, Learner, Skilled, Expert, Master], while the Achievements page uses a completely different scale (Newcomer 0-499, Learner 500-1499, Explorer 1500-3499, Scholar 3500-6999, Master 7000-14999, Champion 15000-29999, Legend 30000+). A user who checks both pages sees conflicting levels.

---

## High Priority (UX Friction)

### 7. No way to delete a course ✅ COMPLETED 2026-03-28 19:30
Once a course is generated, there is no delete button anywhere. Users who create test courses or make mistakes are stuck with them forever. Add a delete option in the course editor or course view.

### 8. No way to pause/resume a course ✅ COMPLETED 2026-03-28 19:30
The status model supports "paused" but there's no UI to pause or resume a course. Add a pause button on the course view.

### 9. Dashboard shows no progress per course ✅ COMPLETED 2026-03-28 19:10
The dashboard course cards show domain, level, and status — but not how far along the user is (e.g., "4/12 lessons done" or a progress bar). The courses page does show this, but the dashboard should too since it's the first thing users see.

### 10. No confirmation before destructive actions in course editor ✅ COMPLETED 2026-03-28 19:45
Deleting a module or lesson in the course editor is instant and irreversible — there's no "Are you sure?" dialog. One misclick can wipe out a module with all its lessons.

### 11. Lesson content has no scroll-to-top ✅ COMPLETED 2026-03-28 19:10
When navigating between long lessons, the scroll position is retained. After clicking "Next", the user starts at the bottom of the new lesson. Auto-scroll to top on lesson navigation.

### 12. Quiz results don't show which questions were wrong ✅ COMPLETED 2026-03-29 10:05
After completing a quiz, the results page shows the score but the per-question breakdown only appears on the QuizPlayer results (which uses local state). If the user navigates away and comes back, they only see "Quiz Passed · 4/5 correct" with no way to review which question they got wrong.

### 13. No keyboard shortcuts ✅ COMPLETED 2026-03-28 21:00
Power users would expect: `Enter` to check answer in quizzes, arrow keys to navigate lessons, `Esc` to go back. The app is entirely mouse-driven.

---

## Medium Priority (Missing Features Users Expect)

### 14. No course progress on the landing/home ✅ COMPLETED 2026-03-28 20:00
When a logged-in user visits `/`, they see the marketing landing page — not a redirect to their dashboard. This is confusing for returning users.

### 15. No bookmarks or favorites ✅ COMPLETED 2026-03-29 10:55
Users can't bookmark specific lessons they want to revisit. A simple bookmark toggle on each lesson would help.

### 16. No notes system ✅ COMPLETED 2026-03-29 11:10
Users learning complex topics want to take notes alongside lessons. A small note-taking panel per lesson (saved to Supabase) would significantly improve retention.

### 17. No "Continue where I left off" on the dashboard ✅ COMPLETED 2026-03-28 19:10
The dashboard shows courses but doesn't highlight which lesson the user should do next. A prominent "Continue Learning" card showing the next incomplete lesson across all courses would reduce friction.

### 18. No dark mode on quiz results or certificate ✅ COMPLETED 2026-03-28 20:15
The QuizPlayer results page and Certificate page use hardcoded white/light backgrounds (e.g., `bg-emerald-50`, `bg-red-50`, `bg-white`) that don't adapt to dark mode. Users on dark mode get a jarring bright flash.

### 19. No course sharing ✅ COMPLETED 2026-03-28 21:15
Users who complete a course may want to share it — "I'm learning Python on Skillify!" There's no share button on the course page (only on the certificate).

### 20. Weekly XP goal ✅ COMPLETED 2026-03-29 10:30
Gamification would improve with a weekly XP target the user can set (e.g., 200 XP/week). Show a ring progress on the dashboard showing how close they are.

### 21. No onboarding tour for new users ✅ COMPLETED 2026-03-29 10:40
First-time users land on an empty dashboard with no guidance. A brief tooltip tour ("This is your dashboard", "Create your first course here", "Track your streak here") would reduce drop-off.

### 22. Topbar search should work on mobile ✅ COMPLETED 2026-03-29 10:15
The search bar is hidden on mobile (`hidden md:block`). Mobile users have no way to search even if search is implemented.

---

## Low Priority (Polish & Delight)

### 23. Course cards need domain icons ✅ COMPLETED 2026-03-28 19:10
Every course card shows a generic book emoji (📚). Map common domains to specific icons (code for programming, palette for design, dumbbell for fitness, etc.) for visual identity.

### 24. Empty leaderboard feels cold ✅ COMPLETED 2026-03-28 20:05
When the leaderboard has only 1 user (the current user), it shows a lonely podium. Add a friendly message: "You're the first! Invite friends to compete."

### 25. Streak freeze / rest day ✅ COMPLETED 2026-03-29 11:30
Users lose their streak if they miss one day, which can feel punishing. Add a "streak freeze" concept (e.g., 1 free rest day per week) to reduce anxiety and keep users engaged.

### 26. Celebrate more milestones ✅ COMPLETED 2026-03-28 21:20
The app only toasts on lesson completion and XP earn. Celebrate more moments: first course created, first quiz passed, streak milestones (7 days!), badge unlocks. Use confetti or animations.

### 27. Estimated completion date ✅ COMPLETED 2026-03-28 20:25
On the course view, show "At your current pace, you'll finish by [date]" based on lessons remaining and their `minutes_per_day` setting. Gives users a concrete goal.

### 28. Lesson difficulty scaling indicator ✅ COMPLETED 2026-03-28 20:45
The difficulty badge (easy/standard/challenging) per lesson exists but users don't know what it means. Add a tooltip or a small legend explaining the difficulty scale.

### 29. Module descriptions are unused ✅ COMPLETED 2026-03-28 19:15
The module model has a `description` field but CourseView never displays it. Show the module description when expanded — it gives context about what the module covers.

### 30. "Time spent learning" stat ✅ COMPLETED 2026-03-29 11:20
Track how much time the user actually spends in lessons (not just estimated_minutes) and show it on the profile/dashboard. "You've spent 4.2 hours learning this week" is motivating.

### 31. Better error states ✅ COMPLETED 2026-03-28 21:25
API failures (quiz generation, course generation) show generic "Something went wrong" messages. Show specific, actionable messages: "AI is busy, try again in 30 seconds" or "Check your internet connection."

### 32. Accessibility improvements ✅ COMPLETED 2026-03-28 21:30
- No `aria-label` on many interactive elements (module expand buttons, lesson links)
- Quiz option buttons don't announce correct/incorrect to screen readers
- Color-only indicators (red/green for quiz answers) need text alternatives
- Focus management after lesson navigation is missing

### 33. Terms of Service and Privacy Policy pages ✅ COMPLETED 2026-03-28 20:20
The signup page links to `/terms` and `/privacy` which don't exist. Either create these pages or remove the links.

### 34. Loading skeletons for lesson page ✅ COMPLETED 2026-03-28 20:30
Dashboard and courses have loading skeletons but the lesson page (the most visited page) has none. When a lesson loads, users see a blank screen.

### 35. Offline lesson viewing ✅ COMPLETED 2026-03-29 11:50
For users learning on the go, caching lesson content in a service worker so they can read previously-viewed lessons offline would be a significant feature.

---

## Architecture / Performance

### 36. Rate limiter is in-memory only ✅ COMPLETED 2026-03-29 11:40
The current rate limiter uses a `Map` in the Node process. In serverless/edge deployments (Vercel), each function invocation gets a fresh process — the rate limiter is effectively bypassed. Migrate to Upstash Redis or Supabase-based rate limiting for production.

### 37. N+1 queries in course editor save ✅ COMPLETED 2026-03-28 20:50
The `handleSave` function in CourseEditor loops through every module and every lesson, making individual `UPDATE` calls. For a course with 5 modules and 30 lessons, that's 35+ separate database calls. Batch these with Supabase's `.upsert()` or a single RPC.

### 38. Leaderboard query is heavy ✅ COMPLETED 2026-03-28 20:55
The weekly leaderboard fetches ALL progress records from the last 7 days across ALL users, then aggregates in JavaScript. For a growing user base, this should be a SQL view or Supabase RPC with `GROUP BY`.

### 39. No caching on frequently-read data ✅ COMPLETED 2026-03-29 11:45
Every page load re-fetches profile data (Topbar), course data (Dashboard), etc. Consider React cache boundaries or SWR for client-side data that doesn't change every second.

---

## Summary: Top 10 Quick Wins

| # | Improvement | Effort | Impact |
|---|-------------|--------|--------|
| 1 | Fix level system inconsistency | 30 min | High — users see conflicting data |
| 2 | Add delete course button | 1 hr | High — stuck with test courses |
| 3 | Add progress bars to dashboard course cards | 30 min | High — first thing users see |
| 4 | Fix hardcoded notification dot | 10 min | Medium — builds trust |
| 5 | Add "Continue where I left off" to dashboard | 1 hr | High — reduces friction |
| 6 | Add confirmation dialogs in course editor | 30 min | Medium — prevents data loss |
| 7 | Auto-scroll to top on lesson nav | 10 min | Medium — basic UX fix |
| 8 | Dark mode on quiz results + certificate | 1 hr | Medium — jarring for dark mode users |
| 9 | Show module descriptions in CourseView | 15 min | Low — already in the data |
| 10 | Implement forgot password flow | 1 hr | High — users get locked out |
