-- Expand invoices with fields needed for a useful billing history UI.
alter table public.invoices
  add column if not exists amount_due      integer,        -- cents, what was owed (vs amount_paid)
  add column if not exists period_start    timestamptz,    -- billing period covered
  add column if not exists period_end      timestamptz,
  add column if not exists invoice_number  text;           -- human-readable e.g. "INV-0001"
