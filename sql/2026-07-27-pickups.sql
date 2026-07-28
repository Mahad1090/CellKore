-- Admin pickup scheduling (UPS Pickup API + Canada Post Pickup API): once a
-- shipment is labeled (see 2026-07-24-shipping-rates-and-labels.sql), admin
-- schedules a carrier driver to actually come collect it from CellKore's
-- own ship-from/warehouse address (repair_settings.ship_from_*) rather than
-- dropping it off. A pickup is not 1:1 with a single order — one driver
-- visit can cover multiple ready packages — so order_id is an optional
-- "scheduled because of this order" reference, not a structural link.
--
-- Admin-only, touched only via the service-role client (same as
-- admin_logs/repair_settings) — no RLS needed.

create table if not exists pickups (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  carrier text not null check (carrier in ('canada_post', 'ups')),
  -- 'smart' = UPS Smart/GWN pickup (no address/pieces, uses the account's
  -- pre-configured pickup profile). Always 'standard' for canada_post.
  pickup_method text not null default 'standard' check (pickup_method in ('standard', 'smart')),
  carrier_request_id text, -- UPS PRN or Canada Post requestId
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'missed', 'failed')),
  pickup_date date not null,
  ready_time text,
  close_time text,
  piece_count integer not null default 1,
  total_weight_kg numeric(10,2),
  address_snapshot jsonb not null, -- ship-from address at time of scheduling
  estimated_cost numeric(10,2),
  currency text,
  special_instruction text,
  raw_create_response jsonb,
  created_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists pickups_order_id_idx on pickups(order_id);
create index if not exists pickups_carrier_status_idx on pickups(carrier, status);
create unique index if not exists pickups_carrier_request_id_idx
  on pickups(carrier, carrier_request_id) where carrier_request_id is not null;
