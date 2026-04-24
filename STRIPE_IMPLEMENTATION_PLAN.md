# Stripe Integration Plan — Skillify

**Created:** 2026-04-20
**Owner:** Colto
**Status:** Draft → ready to execute

## Confirmed Scope

- **Billing model:** Flat-rate recurring subscription (Free / Pro). Monthly + annual Prices. No usage metering.
- **Team / org billing:** Out of scope for v1. Architect data model so a future `workspace_id` can slot in without a rewrite.
- **Platforms:** Web only. No iOS/Android app → no App Store IAP rules to worry about.
- **Markets:** US + EU → **Stripe Tax ON**, collect VAT IDs at checkout, support SCA (Checkout handles it).
- **Refunds:** Self-serve via Stripe Customer Portal (no support-ticket gate).
- **Auth / DB:** Supabase Auth + Postgres. Users are individuals (1 user = 1 Stripe Customer = 1 Subscription).
- **Hosting:** Vercel (Next.js 16 App Router, Node runtime for Stripe routes).

---

## 1. Executive Summary

Use **Stripe Checkout (hosted) + Customer Portal + Webhooks**. Stripe is source of truth for billing; Supabase holds a minimal projection in a `subscriptions` table for fast entitlement checks. Skip Elements and direct PaymentIntents — Checkout covers SCA, Apple/Google Pay, tax, VAT, promo codes, trials, and refunds for free.

Single engineer, ~4–5 working days to production-ready.

---

## 2. Recommended Architecture

| Decision | Choice | Why |
|---|---|---|
| Payment UI | **Stripe Checkout (hosted)** | PCI-light, 3DS/SCA (EU requirement), Apple/Google Pay, tax + VAT collection, promo codes — all built in. |
| Ongoing billing UX | **Stripe Customer Portal** | Cancel, resume, update card, change plan, **self-serve refunds**, invoice history. Free. |
| Billing type | **Recurring Subscriptions** (monthly + annual Prices) | Matches pricing page. |
| Intents | Not used directly — Checkout wraps them. |
| Tax | **Stripe Tax ON** (automatic) + `tax_id_collection` enabled in Checkout for EU B2B VAT. |
| Trials | 7-day trial on Pro via `trial_period_days`. No card required: `payment_method_collection: 'if_required'`. |
| Coupons | Stripe Promotion Codes, `allow_promotion_codes: true` in Checkout. |
| Prorations | `proration_behavior: 'create_prorations'` (default) for monthly↔annual switches. |
| Refunds | Enabled in Portal settings → "Customers can request refunds" (or allow direct refund on last invoice). |
| Source of truth | **Stripe** for billing state; **Supabase** is a read cache updated only by webhooks. |

---

## 3. DB Schema Changes

New migration: `supabase/migrations/002_billing.sql`.

```sql
-- Link Supabase user to Stripe Customer
alter table profiles add column stripe_customer_id text unique;

-- Optional future-proofing: nullable workspace_id for v2 team billing.
-- Leave commented; add in the team-billing migration later.
-- alter table subscriptions add column workspace_id uuid references workspaces(id);

create table subscriptions (
  id text primary key,                    -- Stripe subscription id (sub_...)
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null,                   -- trialing|active|past_due|canceled|incomplete|unpaid
  price_id text not null,                 -- Stripe price id
  plan text not null,                     -- 'free'|'pro' (derived, for fast reads)
  interval text not null,                 -- 'month'|'year'
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index subscriptions_user_active_idx
  on subscriptions (user_id)
  where status in ('trialing','active','past_due');
create index on subscriptions (user_id);

-- Idempotency log for webhooks
create table stripe_events (
  id text primary key,                    -- Stripe event id (evt_...)
  type text not null,
  payload jsonb not null,
  received_at timestamptz default now()
);

-- Cached invoices (for in-app history without iframing Portal)
create table invoices (
  id text primary key,
  user_id uuid references auth.users(id),
  amount_paid int,
  currency text,
  status text,                            -- paid|open|void|uncollectible
  hosted_invoice_url text,
  invoice_pdf text,
  created_at timestamptz
);

-- RLS
alter table subscriptions enable row level security;
alter table invoices enable row level security;

create policy "own subscription" on subscriptions
  for select using (auth.uid() = user_id);
create policy "own invoices" on invoices
  for select using (auth.uid() = user_id);
-- No insert/update/delete policies: writes via service-role key only (webhook handler).
```

**Source-of-truth rules:**
- Stripe → plan, renewal date, payment method, invoices.
- Supabase `subscriptions` → read cache for entitlements. Only the webhook handler (service role) writes to it.

---

## 4. Stripe Object Model

| Skillify entity | Stripe entity | Notes |
|---|---|---|
| `auth.users.id` | `Customer` (1:1) | Store `customer.id` on profile. Set `metadata.supabase_user_id` on Customer. |
| Pro monthly, Pro annual | 1 `Product` ("Skillify Pro") + 2 `Price`s | Env: `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`. |
| Active subscription | `Subscription` | Enforce max 1 active per user (partial unique index above). |
| Payment | `Invoice` → `PaymentIntent` | Never touched directly. |
| Trial | Subscription with `trial_end` | |

**Future-proofing for team billing:** always set `metadata.supabase_user_id` on Customer + Subscription. When teams land, migrate Customer ownership from user → workspace; the metadata pattern stays identical.

---

## 5. Backend Endpoints

All under `app/api/stripe/*` — **Node runtime** (`export const runtime = 'nodejs'`), Stripe SDK is not edge-safe.

| Route | Method | Auth | Purpose | Key calls |
|---|---|---|---|---|
| `/api/stripe/checkout` | POST | Supabase session | Create Checkout Session for `priceId`. Returns `{ url }`. | `customers.create` (if missing), `checkout.sessions.create` with `mode:'subscription'`, `client_reference_id: userId`, `automatic_tax: { enabled: true }`, `tax_id_collection: { enabled: true }`, `allow_promotion_codes: true`. |
| `/api/stripe/portal` | POST | Supabase session | Open Customer Portal. Returns `{ url }`. | `billingPortal.sessions.create` |
| `/api/stripe/webhook` | POST | Signature verify (no user auth) | Ingest events | `webhooks.constructEvent` |
| `/api/stripe/subscription` | GET | Supabase session | Read current sub from DB | — |

**Server-side priceId allowlist:** `/checkout` must reject any `priceId` not in `[STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL]`. Never trust the client.

**Error cases:**
- No Customer yet → create on-the-fly in `/checkout`.
- User already has active/trialing sub → redirect to Portal instead of creating new session.
- Webhook signature fails → 400, no retry.
- Event already in `stripe_events` → return 200 immediately.

---

## 6. Webhook Matrix

Endpoint: `POST /api/stripe/webhook`. Node runtime. Read raw body via `await req.text()` before `constructEvent`.

| Event | Meaning | Action |
|---|---|---|
| `checkout.session.completed` | User finished Checkout | Link `customer.id` ↔ `user_id` via `client_reference_id`. Upsert `subscriptions`. |
| `customer.subscription.created` | Sub exists | Upsert. |
| `customer.subscription.updated` | Plan change, trial→active, card fixed, cancel toggled | **Workhorse event** — upsert everything. |
| `customer.subscription.deleted` | Fully ended | Set status=`canceled`, plan=`free`. |
| `invoice.paid` | Payment succeeded | Insert into `invoices`. |
| `invoice.payment_failed` | Dunning started | Set status=`past_due`. |
| `customer.subscription.trial_will_end` | 3 days before trial end | Optional email (Stripe also sends one). |
| `charge.refunded` | Self-serve refund via Portal | Update `invoices.status`. Optionally email confirm. |

**Idempotency & replay-safety:**
1. First action in handler: `insert into stripe_events (id, type, payload)`. On unique-violation → return 200.
2. All DB writes for the event in one transaction after that insert.
3. Every handler is upsert, never insert-only.
4. Return **200 within 10s**. Offload heavy work (emails) to best-effort background.
5. Log `event.id` on every error — makes Dashboard replay trivial.

---

## 7. Entitlement Model

`lib/billing/entitlement.ts`:

```ts
export type Plan = 'free' | 'pro';
export type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'none';

export type Entitlement = {
  plan: Plan;
  status: SubStatus;
  canCreateCourse: boolean;
  maxCourses: number;        // free: 1, pro: unlimited
  aiCallsPerMonth: number;   // free: small cap, pro: large cap
  showPastDueBanner: boolean;
  showTrialBanner: boolean;
  showCancelingBanner: boolean;
};
```

| Status | Plan shown | Access |
|---|---|---|
| no row | free | 1 course, limited AI calls |
| `trialing` | pro | full Pro, banner: "Trial ends {date}" |
| `active` | pro | full Pro |
| `past_due` | pro | **3-day grace: full access**, then read-only. Banner: "Update your card" → Portal. |
| `incomplete` | free | treat as free until first payment |
| `canceled` (immediate) | free | free |
| `active` + `cancel_at_period_end=true` | pro | full until `current_period_end`, banner: "Access ends {date}" |

Enforce **server-side only** (Route Handlers, Server Components). Client state is decorative.

---

## 8. Frontend Work

| Screen | Does | Calls |
|---|---|---|
| `/pricing` (exists — wire up) | Monthly/annual toggle, CTA → POST `/api/stripe/checkout` with `priceId`, redirect to `url` | checkout |
| Dashboard banners | Conditionally show trial / past_due / cancel-at-period-end banners from entitlement | — |
| `/settings/billing` | Current plan, next renewal, "Manage billing" button → POST `/api/stripe/portal`. Optional invoice list from `invoices` table. | portal |
| Upgrade modal | Fired when free user hits a gate (course limit, AI limit) | checkout |
| `/billing/success?session_id=…` | Poll `/api/stripe/subscription` for up to ~10s waiting on webhook; fallback copy if delayed | subscription |
| `/billing/canceled` | "No problem, maybe later" | — |

**Never** trust `success` URL params for entitlement changes — poll your own DB.

---

## 9. Security & Ops

- **Env vars** (separate dev/preview/prod in Vercel):
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`
  - `NEXT_PUBLIC_APP_URL` (for success/cancel URLs)
- Stripe SDK routes: `export const runtime = 'nodejs'`.
- Webhook: read **raw body** with `await req.text()`; disable any middleware JSON parsing for that path.
- **Signature verification** is mandatory. Reject unverified → 400.
- **Idempotency keys** on retryable SDK calls (`customers.create`, `checkout.sessions.create`).
- **Server priceId allowlist** — never trust client.
- **EU considerations:**
  - Stripe Tax ON, `tax_id_collection.enabled: true` for B2B VAT IDs.
  - Show tax-inclusive or tax-exclusive pricing consistently (`customer_update: { address: 'auto' }`).
  - Privacy policy: document Stripe as sub-processor, 7-year invoice retention, data transfer (Stripe has EU DPA).
- **GDPR:** on user account deletion, also call `customers.del(stripeCustomerId)`. Redact PII from logs.
- **Monitoring:** alert on webhook 5xx > 1%, signature-verification failures, payment_failed spikes. Log every handled event with `event.id`.
- **Test vs live:** separate API keys AND separate webhook endpoints with separate signing secrets. Never mix.

---

## 10. Testing Plan

**Local:**
```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Copy the printed `whsec_...` into `.env.local`.

**Test cards:**
- `4242 4242 4242 4242` — success
- `4000 0000 0000 9995` — declined (insufficient funds)
- `4000 0025 0000 3155` — 3DS required (EU SCA path)
- `4000 0084 0000 1629` — EU card requiring authentication on setup

**Test matrix:**
- ✅ First subscribe (no trial), monthly
- ✅ First subscribe, annual
- ✅ Trial start → `trial_will_end` → auto-convert to paid
- ✅ Card fails at trial end → `past_due` → update card in Portal → `active`
- ✅ Upgrade monthly→annual mid-cycle (verify proration invoice)
- ✅ Downgrade (set `cancel_at_period_end=true`) → access until period end → auto-downgrade to free
- ✅ Immediate cancel via Portal
- ✅ **Refund via Portal** → `charge.refunded` webhook → invoice status updates
- ✅ EU customer with VAT ID → correct tax line on invoice
- ✅ SCA-required card → 3DS challenge completes
- ✅ Webhook delivered twice → `stripe_events` dedupes, no double write
- ✅ Webhook delayed 30s → success page polling resolves
- ✅ User deletes account → Stripe Customer also deleted

**Staging:** Vercel preview with test-mode keys + real webhook endpoint.
**Production rollout:** flip to live keys, one real $1 purchase on your own card, refund via Portal, confirm whole lifecycle, announce.

---

## 11. Rollout Phases

**Phase 1 — Stripe Dashboard setup** *(0.5 day)*
- Create 1 Product ("Skillify Pro") + 2 Prices (monthly, annual).
- Enable Stripe Tax; register for tax collection in US states and EU VAT OSS as needed.
- Configure Customer Portal: allow cancel, plan switch, card update, invoice history, **self-serve refunds on last invoice**.
- Add test webhook endpoint + save signing secret.
- Save Price IDs + keys to Vercel env (dev/preview/prod).
- **DoD:** Dashboard-generated Checkout link completes end-to-end in test mode with VAT correctly applied for an EU test address.
- **Risks:** Portal refund setting misconfigured; US tax registration incomplete.

**Phase 2 — DB + backend endpoints** *(1–1.5 days)*
- Migration `002_billing.sql`.
- Implement `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/subscription`.
- `lib/billing/entitlement.ts` with single `getEntitlement(userId)` helper.
- **DoD:** Logged-in user completes Checkout, lands on success page; Portal link opens.
- **Risk:** accidental edge runtime on Stripe routes.

**Phase 3 — Webhooks** *(1 day)*
- `/api/stripe/webhook` with raw body + signature verify + `stripe_events` dedupe.
- Handle all events in §6.
- **DoD:** Every `stripe trigger <event>` produces correct DB state; replay is a no-op.
- **Risk:** Next.js 16 Route Handler body parsing — test signature first.

**Phase 4 — Frontend wiring** *(1 day)*
- Wire pricing page CTAs + monthly/annual toggle.
- Build `/settings/billing` (plan, renewal, Manage button, invoice list).
- Success / canceled pages with polling.
- Entitlement gates on course creation + AI calls.
- Banners for trial / past_due / canceling.
- **DoD:** Full round-trip free → Pro → Portal → cancel → free reflects in UI correctly.

**Phase 5 — Test matrix + monitoring** *(0.5–1 day)*
- Run entire test matrix in §10.
- Sentry/Logtail alerts on webhook failures.
- Nightly reconciliation script: Supabase Edge Function compares `subscriptions` table to `stripe.subscriptions.list` and logs drift.
- **DoD:** All cases pass; drift job runs clean.

**Phase 6 — Production launch** *(0.5 day)*
- Flip to live keys, live webhook endpoint with its own signing secret.
- One real purchase on your own card → verify invoice, tax, email. Refund via Portal → verify webhook + DB state. Re-enable.
- Announce.
- **DoD:** First real paying customer onboarded successfully.

---

## A) Minimum Viable Stripe Integration (~2 days)

If you want to ship fast and harden later:
- Only Pro monthly Price (skip annual for v1).
- Only webhooks: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Stripe Tax ON (non-negotiable for EU), but skip VAT ID collection.
- No trials, no promo codes.
- No `/settings/billing` page — pricing page itself shows "Manage billing" for subscribed users → Portal.
- No `invoices` table (Portal shows them).
- Entitlement = boolean `isPro`.
- Still need: `stripe_events` dedupe, server priceId allowlist, signature verification.

## B) Production-Ready Version

Everything in the main plan, plus:
- Annual + monthly Prices with UI toggle.
- Trials with `trial_will_end` custom email.
- Promo codes enabled in Checkout.
- All 8 webhook events including `charge.refunded`.
- Full `/settings/billing` with cached invoices.
- VAT ID collection for EU B2B.
- Nightly reconciliation Edge Function.
- Sentry alerts on: webhook 5xx, signature failures, payment_failed spikes, reconciliation drift.
- GDPR delete-cascade to Stripe.
- Separate webhook endpoints and secrets per env.
- Runbook: "Stripe is down," "webhook backlog," "tax rate change."

## C) Common Mistakes to Avoid

1. Trusting the client for `priceId`, `userId`, or plan — always server-validate.
2. Verifying webhook signature against parsed JSON instead of raw body.
3. Running Stripe SDK on edge runtime — fails silently on some APIs.
4. No idempotency on webhooks — Stripe retries, you double-apply.
5. Updating DB from the success page instead of webhooks — race condition and forgeable.
6. Creating a new Customer on every checkout — always look up existing `stripe_customer_id`.
7. Treating `checkout.session.completed` as "subscription active" — it's not; `customer.subscription.created/updated` is authoritative.
8. No grace period on `past_due` — you'll lock out paying users whose card briefly failed.
9. Hardcoding Price IDs in frontend — env only, reference by plan key.
10. Forgetting EU VAT — Stripe Tax handles calculation, but you still must register where required.
11. Same webhook endpoint for test + live — use separate endpoints with separate secrets.
12. Shipping without a reconciliation job — webhooks will be missed eventually; self-heal nightly.
13. Forgetting to cascade account deletion to Stripe — GDPR risk.

---

## Open Assumptions (flag if wrong)

1. Pricing page tiers = Free + Pro only (no Team in v1).
2. Trial: 7 days, no card required. (Change if you want card-required.)
3. Past-due grace period: 3 days full access before read-only.
4. Refunds: user-initiated via Portal, any invoice within last 30 days, no approval workflow.
5. EU tax registration: you (or an accountant) will handle OSS registration before going live in EU.
6. Invoice emails: Stripe sends them; you won't duplicate.
