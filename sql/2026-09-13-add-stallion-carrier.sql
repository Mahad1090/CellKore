-- Widen orders.shipping_carrier to allow 'stallion' alongside the existing
-- 'canada_post' and 'ups' values, now that Stallion Express is a third
-- rate/label source (lib/shipping/stallion.ts). The pickups table's
-- carrier check constraint is intentionally left as-is — Stallion has no
-- pickup-scheduling API, only rates + label creation.

alter table orders drop constraint if exists orders_shipping_carrier_check;
alter table orders add constraint orders_shipping_carrier_check
  check (shipping_carrier in ('canada_post', 'ups', 'stallion'));
