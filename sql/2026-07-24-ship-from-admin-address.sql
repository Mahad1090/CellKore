-- The Canada Post/UPS integration needs a structured ship-from address
-- (discrete name/phone/line1/city/province/postal/country fields, not a
-- free-text blob) to originate labels from. Admin sets this manually on
-- the existing "Store Addresses" settings singleton (repair_settings —
-- already hosts warehouse_address as free text for receipts/policy
-- pages) rather than via env vars, since the office address is a
-- business fact that can change, not deploy-time config.

alter table repair_settings add column if not exists ship_from_name text;
alter table repair_settings add column if not exists ship_from_company text;
alter table repair_settings add column if not exists ship_from_phone text;
alter table repair_settings add column if not exists ship_from_line1 text;
alter table repair_settings add column if not exists ship_from_line2 text;
alter table repair_settings add column if not exists ship_from_city text;
alter table repair_settings add column if not exists ship_from_state_province text;
alter table repair_settings add column if not exists ship_from_postal_code text;
alter table repair_settings add column if not exists ship_from_country text default 'CA';
