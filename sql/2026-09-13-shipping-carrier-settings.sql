-- Admin-controlled on/off switches for which carrier rate/label APIs are
-- ever queried, independently for Canada-bound (domestic) destinations vs
-- US/international destinations. Singleton row (id is always `true`),
-- same pattern as other single-row settings tables in this project.
--
-- Read via lib/shipping/carrier-settings.ts (short in-memory cache),
-- enforced in lib/shipping/aggregator.ts before each carrier is ever
-- called — a disabled carrier simply isn't queried, same as if it were
-- unconfigured.

create table if not exists shipping_carrier_settings (
  id boolean primary key default true,
  constraint shipping_carrier_settings_singleton check (id),
  canada_post_ca_enabled boolean not null default true,
  canada_post_us_enabled boolean not null default true,
  ups_ca_enabled boolean not null default true,
  ups_us_enabled boolean not null default true,
  stallion_ca_enabled boolean not null default true,
  stallion_us_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into shipping_carrier_settings (id) values (true)
  on conflict (id) do nothing;

alter table shipping_carrier_settings enable row level security;

drop policy if exists "service role manages shipping carrier settings" on shipping_carrier_settings;
create policy "service role manages shipping carrier settings"
  on shipping_carrier_settings
  for all
  to service_role
  using (true)
  with check (true);
