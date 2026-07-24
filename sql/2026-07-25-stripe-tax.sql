-- Replaces the flat per-country manual tax rate (tax_rates table) with
-- real per-province/state tax computed via Stripe Tax at checkout time, for
-- both the Stripe and PayPal payment paths (see lib/stripe-tax.ts). Adds
-- columns to persist the computed breakdown on the order itself, which is
-- what the admin tax-analytics page (/admin/tax) reads from — not Stripe's
-- own dashboard, since that can't be filtered/grouped the way CellKore's
-- admin needs.

alter table orders add column if not exists subtotal_amount numeric(10,2);
alter table orders add column if not exists discount_amount numeric(10,2);
alter table orders add column if not exists tax_amount numeric(10,2);
alter table orders add column if not exists tax_breakdown jsonb;
alter table orders add column if not exists stripe_tax_calculation_id text;
alter table orders add column if not exists stripe_tax_transaction_id text;

-- Existing orders keep null values for these columns — no backfill, since
-- the original per-province breakdown was never computed for them.

drop table if exists tax_rates;
