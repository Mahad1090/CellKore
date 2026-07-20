-- Adds per-item condition and carrier-lock status to product_variants so a single
-- wholesale lot can mix New/Used/Refurbished and Locked/Unlocked units in one listing,
-- instead of sharing one condition across the whole lot.

create type carrier_lock_status as enum ('locked', 'unlocked');

alter table product_variants add column model_name text;
alter table product_variants add column condition product_condition;
alter table product_variants add column carrier_lock carrier_lock_status;
