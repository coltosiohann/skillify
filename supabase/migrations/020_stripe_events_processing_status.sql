-- Track whether Stripe webhook events finished processing successfully.
-- A duplicate event with processed_at set can be ignored; a duplicate without
-- processed_at should still be retried.

alter table public.stripe_events
  add column if not exists processed_at timestamptz,
  add column if not exists processing_error text;
