-- Live Canada Post + UPS shipping rates at checkout, manual admin label
-- generation.
--
-- 1. products: nullable package weight/dimensions, used to quote real
--    carrier rates. Filled in gradually by admin; a code-level default
--    package (lib/shipping/package.ts) covers products missing values.
-- 2. orders: the shipping method the customer selected + paid for at
--    checkout, plus the label lifecycle admin later fills in manually.
--    Bolted directly onto orders (not a separate table) since shipping
--    here is 1:1 with the order and evolves through the order's own
--    lifecycle — same pattern as repair_requests' outbound_* columns.
-- 3. addresses: ship-to phone, required by both carriers, already
--    collected at checkout but never persisted until now.
--
-- Run this once, after database.sql and the other 2026-07-* migrations.

alter table products add column if not exists weight_kg numeric(10,3);
alter table products add column if not exists length_cm numeric(10,2);
alter table products add column if not exists width_cm numeric(10,2);
alter table products add column if not exists height_cm numeric(10,2);

alter table orders add column if not exists shipping_carrier text
  check (shipping_carrier in ('canada_post', 'ups'));
alter table orders add column if not exists shipping_service_code text;
alter table orders add column if not exists shipping_service_name text;
alter table orders add column if not exists shipping_cost numeric(10,2) not null default 0;
alter table orders add column if not exists shipping_currency text;
alter table orders add column if not exists shipping_rate_snapshot jsonb;
alter table orders add column if not exists shipping_tracking_number text;
alter table orders add column if not exists shipping_label_url text;
alter table orders add column if not exists shipping_carrier_shipment_id text;
alter table orders add column if not exists shipping_label_status text
  default 'not_generated' check (shipping_label_status in ('not_generated', 'generated', 'failed'));
alter table orders add column if not exists shipping_label_generated_at timestamptz;

alter table addresses add column if not exists phone text;

-- shipping-labels storage bucket (mirrors repair-images/product-images:
-- public-URL convention). All writes go through the service-role admin
-- shipment route, so no insert policy is needed — only public read so
-- the stored label_url is directly viewable/downloadable.
insert into storage.buckets (id, name, public)
values ('shipping-labels', 'shipping-labels', true)
on conflict (id) do update set public = true;

drop policy if exists "public read shipping labels" on storage.objects;
create policy "public read shipping labels" on storage.objects
  for select using (bucket_id = 'shipping-labels');

