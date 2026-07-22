-- Repair Services: let admin quote repair charges in USD or CAD,
-- mirroring the existing US/CA marketplace currency split used at
-- storefront checkout (same amount, different currency label — no FX
-- conversion, consistent with how orders.marketplace already drives
-- 'usd' vs 'cad' in the Stripe/PayPal checkout routes).
--
-- Run this once, after 2026-07-22-repair-services-rebuild.sql.

alter table repair_requests add column if not exists quote_currency text
  not null default 'USD' check (quote_currency in ('USD', 'CAD'));
