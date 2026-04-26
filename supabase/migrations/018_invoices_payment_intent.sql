-- Add payment_intent_id to invoices so charge.refunded can match reliably.
alter table public.invoices
  add column if not exists payment_intent_id text;

create index if not exists invoices_payment_intent_idx
  on public.invoices (payment_intent_id)
  where payment_intent_id is not null;
