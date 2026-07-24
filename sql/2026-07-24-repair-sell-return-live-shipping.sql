-- Wires the Canada Post/UPS live-rate integration (2026-07-24) into the
-- repair and sell-phone-return outbound shipping legs, replacing the
-- getRepairShippingRateOptions flat-rate stub and the
-- generateReturnShippingLabel no-op stub.
--
-- Repair: shipping_options / selected_shipping_option are already jsonb
-- (repair_requests, from the 2026-07-22 rebuild) — no schema change
-- needed there, they just now hold real carrier/serviceCode fields
-- alongside label/cost.
--
-- Sell-phone return: previously admin set a flat fee_amount before the
-- customer's address was known. Now the customer picks a live rate at
-- payment time (once their address is known), so fee_amount is only
-- knowable at that point — must become nullable — and the pre-existing
-- `carrier` column (previously only set once a label was generated) now
-- also gets set at rate-selection time, alongside the new
-- service_code/service_name/currency columns.

alter table sell_phone_return_shipments alter column fee_amount drop not null;
alter table sell_phone_return_shipments add column if not exists service_code text;
alter table sell_phone_return_shipments add column if not exists service_name text;
alter table sell_phone_return_shipments add column if not exists currency text;
