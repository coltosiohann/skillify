# APP AUDIT — 25.04.2026

Full audit of the Skillify codebase. All errors are documented below with root cause, affected files, and a concrete fix plan. Tasks are ordered by priority.

---

## CRITICAL — Fix First

---

### ❌ ERROR 1: Auth middleware never wired up

**Root cause:** `proxy.ts` exports an auth token refresh function but no `middleware.ts` exists to call it. Sessions can expire mid-use with no automatic refresh.

**Affected files:**
- [`proxy.ts`](proxy.ts)

**Fix plan:**
1. Create `middleware.ts` in the project root (next to `proxy.ts`).
2. Re-export the proxy function as `middleware`.
3. Add a `config` matcher that excludes static assets.

```ts
// middleware.ts
export { proxy as middleware } from "@/proxy";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

### ❌ ERROR 2: Stripe & Supabase env vars not validated at startup

**Root cause:** `lib/env.ts` validates env vars with Zod at startup, but critical Stripe and Supabase keys are accessed via raw `process.env` and never added to the schema. A missing secret crashes at runtime with a cryptic error instead of a clear startup failure.

**Affected files:**
- [`lib/env.ts`](lib/env.ts)
- [`lib/billing/stripe.ts`](lib/billing/stripe.ts)
- [`app/api/stripe/webhook/route.ts`](app/api/stripe/webhook/route.ts)
- [`app/api/stripe/checkout/route.ts`](app/api/stripe/checkout/route.ts)
- [`lib/supabase/admin.ts`](lib/supabase/admin.ts)

**Fix plan:**
1. Add all missing keys to the Zod schema in `lib/env.ts`:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_PRO_MONTHLY`
   - `STRIPE_PRICE_PRO_ANNUAL`
   - `NEXT_PUBLIC_APP_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Replace every `process.env.STRIPE_*!` and `process.env.SUPABASE_SERVICE_ROLE_KEY!` usage with `env.STRIPE_*` / `env.SUPABASE_SERVICE_ROLE_KEY` imported from `lib/env.ts`.

---

### ❌ ERROR 3: OAuth sign-in errors silently swallowed

**Root cause:** `handleOAuth()` calls `supabase.auth.signInWithOAuth()` with no try/catch. If the redirect fails, the user sees no feedback — no error toast, no spinner reset.

**Affected files:**
- [`components/auth/OAuthButtons.tsx`](components/auth/OAuthButtons.tsx)

**Fix plan:**
1. Wrap the call in a try/catch.
2. On error, fire a `toast.error()` with the error message.
3. Ensure any loading state is reset on failure.

```ts
async function handleOAuth(provider: "google" | "apple") {
  setLoading(provider);
  try {
    const { error } = await supabase.auth.signInWithOAuth({ provider, ... });
    if (error) throw error;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
  } finally {
    setLoading(null);
  }
}
```

---

### ❌ ERROR 4: "Remember Me" checkbox is non-functional

**Root cause:** The UI renders a "Remember me" checkbox that has no effect. The code comment acknowledges it is not implemented. Users who check it will expect persistent sessions but get default Supabase behaviour.

**Affected files:**
- [`app/(auth)/login/page.tsx`](app/(auth)/login/page.tsx)

**Fix plan (choose one):**
- **Option A (implement):** Use a custom Supabase storage adapter that swaps between `localStorage` (persistent) and `sessionStorage` (session-only) depending on the checkbox value. Wire the adapter to the client before calling `signInWithPassword`.
- **Option B (remove):** Delete the checkbox and its associated state until a full implementation is ready. Do not ship UI that promises a feature it doesn't deliver.

---

## HIGH — Fix Soon

---

### ❌ ERROR 5: Stripe price IDs bypass env validation

**Root cause:** `PRICE_IDS` in `lib/billing/stripe.ts` is built from `process.env.STRIPE_PRICE_*!` with a non-null assertion. If the variables are undefined, Stripe API calls will send `undefined` as the price ID and return a confusing error.

**Affected files:**
- [`lib/billing/stripe.ts`](lib/billing/stripe.ts:18)

**Fix plan:**
1. Covered by **Error 2** fix — once these vars are in the env schema, replace the raw `process.env` references here with `env.STRIPE_PRICE_PRO_MONTHLY` etc.

---

### ❌ ERROR 6: Stripe webhook uses raw `process.env` instead of `lib/env.ts`

**Root cause:** The webhook route uses `process.env.STRIPE_WEBHOOK_SECRET!` directly, bypassing the centralised env validation.

**Affected files:**
- [`app/api/stripe/webhook/route.ts`](app/api/stripe/webhook/route.ts:47)

**Fix plan:**
1. Covered by **Error 2** fix — add `STRIPE_WEBHOOK_SECRET` to the env schema, then import and use `env.STRIPE_WEBHOOK_SECRET` in this file.

---

### ❌ ERROR 7: AI-generated JSON cast with `as T` — no runtime validation

**Root cause:** `parseJSON<T>()` in `generate-v2` parses the raw AI response and casts it with `as T`. If the AI returns an unexpected shape, the runtime type is wrong but TypeScript doesn't know. Downstream code silently receives bad data.

**Affected files:**
- [`app/api/ai/generate-v2/route.ts`](app/api/ai/generate-v2/route.ts:33)

**Fix plan:**
1. Define a Zod schema for the expected AI response structure (course outline, lesson body, etc.).
2. Replace the `as T` cast with `schema.parse(parsed)` so invalid AI output throws a clear error immediately.
3. Return a 500 with a descriptive message if validation fails, rather than propagating malformed data.

---

### ❌ ERROR 8: Catch blocks swallow errors without logging

**Root cause:** Several catch blocks show a generic toast but never log to Sentry. Silent failures won't surface in monitoring.

**Affected files:**
- [`app/(app)/profile/ProfileClient.tsx`](app/(app)/profile/ProfileClient.tsx:113)
- Any other `catch { toast.error(...) }` blocks without `captureException`

**Fix plan:**
1. Search codebase for `catch` blocks that do not call `Sentry.captureException`.
2. Add `Sentry.captureException(err)` (or equivalent logger call) before every `toast.error()` in catch blocks.

---

## MEDIUM — Fix When Possible

---

### ❌ ERROR 9: Rate limit race condition (SELECT then UPDATE)

**Root cause:** `lib/rateLimit.ts` reads the current count with SELECT, then increments with UPDATE. Concurrent requests can both read the same count and each increment from that baseline, effectively bypassing the limit.

**Affected files:**
- [`lib/rateLimit.ts`](lib/rateLimit.ts:57)

**Fix plan:**
1. Replace the SELECT + UPDATE pattern with a single atomic `upsert` using `count = count + 1` via a Supabase RPC / raw SQL function.
2. Alternatively, add a Postgres-level advisory lock or use `FOR UPDATE` row locking in a transaction.
3. Add a database-level `CHECK` constraint ensuring `count <= limit` as a hard backstop.

---

### ❌ ERROR 10: Assess endpoint GET and POST use separate rate limit buckets

**Root cause:** GET (generate question) and POST (submit answer) each have independent 10-request buckets. A user can exhaust both independently for 20 total AI calls — defeating the intent.

**Affected files:**
- [`app/api/ai/assess/route.ts`](app/api/ai/assess/route.ts:43)

**Fix plan:**
1. Use a single shared bucket key for both GET and POST (e.g., `assess:${userId}`).
2. Alternatively, lower individual limits and add a combined daily cap.

---

### ❌ ERROR 11: `getIP()` falls back to `"unknown"`, breaking per-user rate limits

**Root cause:** When headers are missing or a proxy is misconfigured, all requests appear from `"unknown"` and share one rate-limit slot, allowing unlimited AI requests.

**Affected files:**
- [`app/api/ai/assess/route.ts`](app/api/ai/assess/route.ts:16)

**Fix plan:**
1. Prefer authenticated user ID as the rate-limit key over IP (already partially done in some routes — standardise).
2. For unauthenticated routes, fall back to IP but return 400 if IP cannot be determined rather than allowing through as `"unknown"`.

---

### ❌ ERROR 12: Widespread unsafe `as unknown as Type` casts

**Root cause:** ~20 instances of unsafe type assertions exist, primarily around Supabase join shapes. If a query shape changes, the application breaks silently.

**Affected files:**
- Multiple — run `grep -r "as unknown as"` to get the full list

**Fix plan:**
1. For each occurrence, define a Zod schema matching the expected Supabase join shape.
2. Parse the query result through the schema before use.
3. Prioritise casts in API routes and data-fetching functions that are user-facing.

---

## IMPROVEMENTS

---

### 💡 IMPROVEMENT 1: Add Content Security Policy (CSP) headers

**Why it matters:** No CSP is configured anywhere. Without it, the app has zero browser-enforced protection against XSS attacks — any injected script runs freely.

**Affected files:**
- [`next.config.ts`](next.config.ts) or `middleware.ts`

**Plan:**
1. Add a `headers()` block in `next.config.ts` that sets a `Content-Security-Policy` header for all routes.
2. Start with a permissive policy and tighten it incrementally (restrict `script-src`, `connect-src`, `img-src` to known origins).
3. Enable `report-uri` or `report-to` pointing at Sentry so violations surface in monitoring.

```ts
// next.config.ts
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://js.stripe.com",
            "connect-src 'self' https://*.supabase.co https://api.anthropic.com",
            "img-src 'self' data: https:",
            "frame-src https://js.stripe.com",
          ].join("; "),
        },
      ],
    },
  ];
},
```

---

### 💡 IMPROVEMENT 2: Add CSRF protection for state-changing API routes

**Why it matters:** Stripe checkout, course deletion, and profile updates rely solely on auth tokens. A malicious site could trick an authenticated user into triggering these actions via a cross-site form submission.

**Affected files:**
- [`app/api/stripe/checkout/route.ts`](app/api/stripe/checkout/route.ts)
- [`app/api/stripe/portal/route.ts`](app/api/stripe/portal/route.ts)
- [`app/(app)/profile/ProfileClient.tsx`](app/(app)/profile/ProfileClient.tsx)

**Plan:**
1. Set the Supabase auth cookie with `SameSite=Strict` (blocks cross-site submissions outright).
2. For any route that can't use `SameSite=Strict`, generate a CSRF token at session creation, store it in a `HttpOnly` cookie, and require it as a request header on all `POST`/`DELETE` calls.

---

### 💡 IMPROVEMENT 3: Add ISR caching to dashboard and courses pages

**Why it matters:** Every visit to the dashboard and courses listing hits the database. These pages contain data that changes infrequently and are the most visited in the app.

**Affected files:**
- [`app/(app)/dashboard/page.tsx`](app/(app)/dashboard/page.tsx)
- [`app/(app)/courses/page.tsx`](app/(app)/courses/page.tsx)

**Plan:**
1. Add `export const revalidate = 60;` to both page files to enable ISR (revalidate every 60 seconds).
2. For user-specific data that must always be fresh, consider splitting the page into a static shell + a small dynamic island fetched client-side.

---

### 💡 IMPROVEMENT 4: Parallelize lesson generation

**Why it matters:** Lessons are generated sequentially in `generate-v2`, making the user wait for each one to finish before the next starts. Generating in batches would noticeably reduce total generation time.

**Affected files:**
- [`app/api/ai/generate-v2/route.ts`](app/api/ai/generate-v2/route.ts)

**Plan:**
1. Identify the sequential lesson generation loop.
2. Replace it with `Promise.all()` over batches of 2–3 lessons at a time to balance parallelism with API rate limits.
3. Stream progress updates to the client as each batch completes.

---

### 💡 IMPROVEMENT 5: Add nested `error.tsx` boundaries per route segment

**Why it matters:** Only a global `global-error.tsx` exists. If a single course page crashes, the entire app view is replaced. Route-level error boundaries allow users to recover just the broken section.

**Affected files:**
- Create: `app/(app)/courses/error.tsx`
- Create: `app/(app)/courses/[id]/error.tsx`
- Create: `app/(app)/dashboard/error.tsx`

**Plan:**
1. Create an `error.tsx` file in each major route segment.
2. Each should render a scoped error card with a "Try again" button that calls `reset()`.
3. Log the error to Sentry from inside the error boundary component.

```tsx
// app/(app)/courses/error.tsx
"use client";
export default function CoursesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <p className="text-destructive">Failed to load courses.</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

### 💡 IMPROVEMENT 6: Add rate-limit response headers

**Why it matters:** Clients (and the browser devtools) have no visibility into rate limit state. Adding standard headers lets the frontend show a "slow down" warning and enables proper backoff logic.

**Affected files:**
- [`lib/rateLimit.ts`](lib/rateLimit.ts)
- All API routes that call `checkRateLimit`

**Plan:**
1. Return `remaining` and `resetAt` from `checkRateLimit()`.
2. In each API route, attach the headers to every response (not just 429s):
   ```
   RateLimit-Limit: 10
   RateLimit-Remaining: 7
   RateLimit-Reset: 1714060800
   ```
3. On the frontend, read `RateLimit-Remaining` and show a warning toast when it drops below 2.

---

### 💡 IMPROVEMENT 7: Add a `/api/health` endpoint

**Why it matters:** There is no health check endpoint. Uptime monitors, load balancers, and deployment pipelines can't verify the app is healthy without one.

**Affected files:**
- Create: `app/api/health/route.ts`

**Plan:**
1. Create the route.
2. Ping Supabase with a lightweight query (e.g., `SELECT 1`).
3. Return `{ status: "ok" }` on success, `{ status: "degraded", reason: "..." }` on failure.
4. Wire it into your uptime monitor (e.g., BetterUptime, UptimeRobot).

```ts
// app/api/health/route.ts
export async function GET() {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").select("id").limit(1);
  return Response.json({ status: error ? "degraded" : "ok" }, { status: error ? 503 : 200 });
}
```

---

### 💡 IMPROVEMENT 8: Centralised API request validation middleware

**Why it matters:** Every API route manually validates its request body with scattered, inconsistent checks. A shared wrapper reduces boilerplate and ensures uniform error responses.

**Affected files:**
- Create: `lib/api/validate.ts`
- All API `route.ts` files

**Plan:**
1. Create a `withValidation(schema, handler)` HOF that parses the request body through a Zod schema before calling the handler.
2. Returns a consistent `{ error, details }` shape with status 400 on validation failure.
3. Migrate API routes one by one, starting with the most complex ones (`generate-v2`, `assess`).

---

### 💡 IMPROVEMENT 9: Implement optimistic UI updates for profile and course actions

**Why it matters:** Profile saves, course deletions, and similar mutations wait for the server round-trip before updating the UI. Users perceive this as sluggishness even on fast connections.

**Affected files:**
- [`app/(app)/profile/ProfileClient.tsx`](app/(app)/profile/ProfileClient.tsx)
- Course list deletion actions

**Plan:**
1. Update local state immediately when the user triggers an action.
2. Send the mutation to the server in the background.
3. On server error, roll back the local state and show an error toast.

---

### 💡 IMPROVEMENT 10: Deduplicate in-flight AI generation requests

**Why it matters:** If a user's connection is flaky and they refresh mid-generation, the entire course generation reruns, wasting tokens and time.

**Affected files:**
- [`app/api/ai/generate-v2/route.ts`](app/api/ai/generate-v2/route.ts)

**Plan:**
1. Generate a deterministic request key from the user ID + course parameters.
2. Store in-flight generation state in the DB (`status: "generating"`).
3. If a duplicate request arrives for the same key, return the existing stream / cached result rather than starting a new generation.

---

### 💡 IMPROVEMENT 11: Progressive course generation (outline-first)

**Why it matters:** The full course is generated upfront before the user sees anything. Generating the outline first and loading lessons on-demand dramatically reduces perceived wait time.

**Affected files:**
- [`app/(app)/onboarding/page.tsx`](app/(app)/onboarding/page.tsx)
- [`app/api/ai/generate-v2/route.ts`](app/api/ai/generate-v2/route.ts)

**Plan:**
1. Split generation into two phases: outline (fast, ~2s) and per-lesson content (on-demand).
2. After outline is generated, redirect the user to the course overview immediately.
3. Generate lesson content lazily when the user first opens a lesson, showing a skeleton in the meantime.

---

### 💡 IMPROVEMENT 12: Add structured logging for key business events

**Why it matters:** Currently only Sentry captures errors. There's no structured log trail for business events, making debugging production issues and understanding user behaviour very difficult.

**Affected files:**
- [`lib/billing/stripe.ts`](lib/billing/stripe.ts)
- [`app/api/ai/generate-v2/route.ts`](app/api/ai/generate-v2/route.ts)
- [`app/api/stripe/webhook/route.ts`](app/api/stripe/webhook/route.ts)

**Plan:**
1. Create a `lib/logger.ts` wrapper (can be thin around `console` in dev, forwards to a log drain like Axiom/Logtail in prod).
2. Add structured log calls for: course generation start/complete/failure, Stripe webhook received/processed, rate limit triggered, auth failures.
3. Include `userId`, `duration`, and relevant metadata in each log entry.

---

### 💡 IMPROVEMENT 13: Add unit and E2E tests

**Why it matters:** Zero test files were found in the codebase. Regressions in auth, billing, and AI generation are currently only caught by users.

**Affected files:**
- Create: `__tests__/` or `tests/` directory

**Plan:**
1. Start with the highest-risk, hardest-to-manually-test areas:
   - Stripe webhook idempotency (unit test with mocked Stripe events)
   - Rate limiter logic (unit test the SELECT/UPDATE flow)
   - Auth redirect flows (E2E with Playwright)
2. Add a CI step that blocks merges if tests fail.
3. Aim for coverage on all API routes before adding new features.

---

## Summary Checklist

### Errors

| # | Error | Priority | Status |
|---|-------|----------|--------|
| 1 | Wire up `middleware.ts` for auth refresh | 🔴 Critical | [x] |
| 2 | Add Stripe/Supabase vars to env schema | 🔴 Critical | [x] |
| 3 | Fix OAuth silent error swallowing | 🔴 Critical | [x] |
| 4 | Remove or implement "Remember Me" | 🔴 Critical | [x] |
| 5 | Stripe price IDs use validated env vars | 🟠 High | [x] |
| 6 | Stripe webhook imports from `lib/env.ts` | 🟠 High | [x] |
| 7 | Zod validation for AI JSON responses | 🟠 High | [x] |
| 8 | Log errors to Sentry in all catch blocks | 🟠 High | [x] |
| 9 | Atomic rate limit increment in DB | 🟡 Medium | [x] |
| 10 | Shared rate limit bucket for assess GET+POST | 🟡 Medium | [x] |
| 11 | Use user ID as rate limit key, reject unknown IP | 🟡 Medium | [x] |
| 12 | Replace unsafe `as unknown as` casts with Zod | 🟡 Medium | [x] |

### Improvements

| # | Improvement | Priority | Status |
|---|-------------|----------|--------|
| 1 | Add CSP headers | 🟠 High | [x] |
| 2 | Add CSRF protection | 🟠 High | [x] |
| 3 | ISR caching on dashboard & courses | 🟠 High | [x] |
| 4 | Parallelize lesson generation | 🟠 High | [x] |
| 5 | Nested `error.tsx` boundaries per route | 🟠 High | [x] |
| 6 | Rate-limit response headers | 🟡 Medium | [x] |
| 7 | Add `/api/health` endpoint | 🟡 Medium | [x] |
| 8 | Centralised API request validation | 🟡 Medium | [x] |
| 9 | Optimistic UI for profile & course actions | 🟡 Medium | [x] |
| 10 | Deduplicate in-flight AI generation requests | 🟡 Medium | [x] |
| 11 | Progressive generation (outline-first) | 🟡 Medium | [x] |
| 12 | Structured logging for business events | 🟡 Medium | [x] |
| 13 | Add unit and E2E tests | 🟡 Medium | [ ] |
