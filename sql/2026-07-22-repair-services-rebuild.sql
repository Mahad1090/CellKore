-- Repair Services: full workflow rebuild.
--
-- Replaces the old bare-bones repair_requests (device_info blob +
-- pending_approval..completed enum) with a granular pipeline mirroring
-- the sell-phone-request architecture: submit -> admin quotes repair
-- charges + shipping-back options -> customer pays -> customer ships
-- device in -> admin repairs -> admin ships back -> completed.
--
-- Run this once, after database.sql (and after the 2026-07-21/22 sell
-- migrations, though it doesn't depend on them).

-- ---------------------------------------------------------------------
-- 1. Convert repair_requests.current_status (enum) -> status (text)
-- ---------------------------------------------------------------------
alter table repair_requests alter column current_status drop default;
alter table repair_requests alter column current_status type text using current_status::text;
alter table repair_status_history alter column status type text using status::text;
drop type if exists repair_status;

alter table repair_requests rename column current_status to status;

update repair_requests set status = case status
  when 'pending_approval' then 'submitted'
  when 'approved' then 'submitted'
  when 'phone_requested' then 'awaiting_device'
  when 'phone_received' then 'device_received'
  when 'assessed' then 'in_repair'
  when 'price_given' then 'quote_sent'
  when 'accepted' then 'quote_accepted'
  when 'rejected' then 'rejected'
  when 'completed' then 'completed'
  else status
end;

alter table repair_requests
  add constraint repair_requests_status_check
  check (status in (
    'submitted', 'quote_sent', 'quote_accepted', 'payment_confirmed',
    'awaiting_device', 'device_shipped', 'device_received', 'in_repair',
    'repaired', 'shipped_back', 'completed', 'rejected', 'cancelled'
  ));

alter table repair_requests alter column status set default 'submitted';

-- ---------------------------------------------------------------------
-- 2. repair_requests: structured intake, contact/address, quote,
--    shipping-back options, payment, inbound/outbound shipment columns.
-- ---------------------------------------------------------------------
alter table repair_requests alter column device_info drop not null;
alter table repair_requests drop column if exists quoted_price;

alter table repair_requests add column if not exists device_category text;
alter table repair_requests add column if not exists device_category_other text;
alter table repair_requests add column if not exists issues text[];
alter table repair_requests add column if not exists issue_other text;
alter table repair_requests add column if not exists device_brand text;
alter table repair_requests add column if not exists device_model text;
alter table repair_requests add column if not exists serial_number text;
alter table repair_requests add column if not exists description text;

alter table repair_requests add column if not exists service_method text
  check (service_method in ('mail_in', 'drop_off'));
alter table repair_requests add column if not exists contact_name text;
alter table repair_requests add column if not exists contact_email text;
alter table repair_requests add column if not exists contact_phone text;
alter table repair_requests add column if not exists contact_country_code text;
alter table repair_requests add column if not exists address_line1 text;
alter table repair_requests add column if not exists address_line2 text;
alter table repair_requests add column if not exists city text;
alter table repair_requests add column if not exists state_province text;
alter table repair_requests add column if not exists postal_code text;
alter table repair_requests add column if not exists country text;
alter table repair_requests add column if not exists terms_accepted boolean not null default false;

alter table repair_requests add column if not exists quote_items jsonb;
alter table repair_requests add column if not exists quote_total numeric(10,2);
alter table repair_requests add column if not exists quote_notes text;
alter table repair_requests add column if not exists quote_sent_at timestamptz;

alter table repair_requests add column if not exists shipping_options jsonb;
alter table repair_requests add column if not exists selected_shipping_option jsonb;
alter table repair_requests add column if not exists shipping_cost numeric(10,2);

alter table repair_requests add column if not exists payment_provider text;
alter table repair_requests add column if not exists payment_reference text;
alter table repair_requests add column if not exists paid_at timestamptz;
alter table repair_requests add column if not exists grand_total numeric(10,2);

alter table repair_requests add column if not exists inbound_carrier text;
alter table repair_requests add column if not exists inbound_tracking_number text;
alter table repair_requests add column if not exists inbound_shipped_at timestamptz;

alter table repair_requests add column if not exists outbound_carrier text;
alter table repair_requests add column if not exists outbound_tracking_number text;
alter table repair_requests add column if not exists outbound_label_url text;
alter table repair_requests add column if not exists outbound_label_status text
  default 'pending' check (outbound_label_status in ('pending', 'generated', 'failed'));
alter table repair_requests add column if not exists shipped_back_at timestamptz;

alter table repair_requests add column if not exists rejection_reason text;

-- ---------------------------------------------------------------------
-- 3. repair_status_history: align column names/shape with
--    sell_phone_status_history (request_id, status, note, changed_by,
--    created_at) so the same UI/API patterns work for both.
-- ---------------------------------------------------------------------
alter table repair_status_history rename column repair_request_id to request_id;
alter table repair_status_history rename column notes to note;
alter table repair_status_history rename column changed_at to created_at;
alter table repair_status_history add column if not exists changed_by text not null default 'admin';

alter table repair_status_history enable row level security;

drop policy if exists "customers can read own repair request history" on repair_status_history;
create policy "customers can read own repair request history"
  on repair_status_history
  for select
  to authenticated
  using (
    exists (
      select 1 from repair_requests r
      where r.id = repair_status_history.request_id
        and r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 4. repair_images (new) — mirrors sell_phone_images.
-- ---------------------------------------------------------------------
create table if not exists repair_images (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references repair_requests(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_repair_images_request_id on repair_images(request_id);

alter table repair_images enable row level security;

drop policy if exists "anyone can attach repair images" on repair_images;
create policy "anyone can attach repair images" on repair_images for insert with check (true);

-- ---------------------------------------------------------------------
-- 5. repair_requests public-submission policies (mirrors
--    sell_phone_requests: RLS was already enabled in database.sql, but
--    had no policies yet, meaning no anon insert is possible until now).
-- ---------------------------------------------------------------------
drop policy if exists "public can submit repair requests" on repair_requests;
create policy "public can submit repair requests"
  on repair_requests
  for insert
  to anon
  with check (true);

drop policy if exists "authenticated users can read own repair requests" on repair_requests;
create policy "authenticated users can read own repair requests"
  on repair_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 6. repair-images storage bucket (mirrors sell-phone-images).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('repair-images', 'repair-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public read repair images" on storage.objects;
create policy "public read repair images" on storage.objects
  for select using (bucket_id = 'repair-images');

drop policy if exists "public upload repair images" on storage.objects;
create policy "public upload repair images" on storage.objects
  for insert with check (bucket_id = 'repair-images' and (storage.foldername(name))[1] = 'requests');

drop policy if exists "public rollback repair images" on storage.objects;
create policy "public rollback repair images" on storage.objects
  for delete using (bucket_id = 'repair-images' and (storage.foldername(name))[1] = 'requests');

-- ---------------------------------------------------------------------
-- 7. repair_settings (new, singleton) — admin-editable mail-in address,
--    same "small table + public read policy" pattern as tax_rates.
-- ---------------------------------------------------------------------
create table if not exists repair_settings (
  id uuid primary key default gen_random_uuid(),
  mail_in_address text,
  updated_at timestamptz not null default now()
);

alter table repair_settings enable row level security;
drop policy if exists "public read repair settings" on repair_settings;
create policy "public read repair settings" on repair_settings for select using (true);

insert into repair_settings (mail_in_address)
select $addr$CellKore Repair Center
[Street Address]
[City, State/Province ZIP]
[Country]$addr$
where not exists (select 1 from repair_settings);
