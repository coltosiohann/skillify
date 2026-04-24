-- 016_billing.sql — Stripe integration
-- Replaces the stub subscriptions table with the full billing schema.

-- ── profiles: add Stripe customer link ────────────────────────────────────────
alter table public.profiles
  add column if not exists stripe_customer_id text unique;

-- ── subscriptions: replace stub with proper schema ────────────────────────────
-- The stub in 001_initial.sql used a UUID PK and separate stripe_subscription_id
-- column. We replace it with the Stripe sub ID as the primary key.
drop table if exists public.subscriptions;

create table public.subscriptions (
  id                   text primary key,           -- Stripe sub id (sub_...)
  user_id              uuid not null references auth.users(id) on delete cascade,
  status               text not null,              -- trialing|active|past_due|canceled|incomplete|unpaid
  price_id             text not null,              -- Stripe price id
  plan                 text not null check (plan in ('free', 'pro')),
  interval             text not null check (interval in ('month', 'year')),
  current_period_end   timestamptz not null,
  cancel_at_period_end boolean not null default false,
  trial_end            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Only one active/trialing/past_due subscription per user
create unique index subscriptions_user_active_idx
  on public.subscriptions (user_id)
  where status in ('trialing', 'active', 'past_due');

create index subscriptions_user_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

create policy "Users view own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "Service role manages subscriptions" on public.subscriptions
  for all using (auth.role() = 'service_role');

-- ── stripe_events: webhook idempotency log ────────────────────────────────────
create table public.stripe_events (
  id          text primary key,                   -- Stripe event id (evt_...)
  type        text not null,
  payload     jsonb not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

create policy "Service role manages stripe_events" on public.stripe_events
  for all using (auth.role() = 'service_role');

-- ── invoices: cached invoice records ─────────────────────────────────────────
create table public.invoices (
  id                  text primary key,           -- Stripe invoice id (in_...)
  user_id             uuid references auth.users(id) on delete cascade,
  amount_paid         integer,                    -- in cents
  currency            text,
  status              text,                       -- paid|open|void|uncollectible
  hosted_invoice_url  text,
  invoice_pdf         text,
  created_at          timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "Users view own invoices" on public.invoices
  for select using (auth.uid() = user_id);

create policy "Service role manages invoices" on public.invoices
  for all using (auth.role() = 'service_role');
