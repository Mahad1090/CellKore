-- Admin-configurable flat tax rate per country, replacing the previous hardcoded
-- US-state / CA-province tax tables so every country (not just US/CA) can have
-- a tax rate, and admins can toggle rates active/inactive without a code change.

create table tax_rates (
  id uuid primary key default gen_random_uuid(),
  country_code text not null unique,
  country_name text not null,
  tax_rate numeric(6,4) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_tax_rates_country_code on tax_rates(country_code);

alter table tax_rates enable row level security;
create policy "public read active tax rates" on tax_rates for select using (is_active = true);

-- Seed US and Canada with their prior average rates (mean of the removed
-- per-state / per-province tables) so existing checkout tax calculations keep
-- working immediately; admins can adjust these or add other countries anytime.
insert into tax_rates (country_code, country_name, tax_rate, is_active) values
  ('US', 'United States', 0.0660, true),
  ('CA', 'Canada', 0.1092, true);
