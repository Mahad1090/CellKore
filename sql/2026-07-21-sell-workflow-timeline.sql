-- Sell Your Phone: richer status workflow + full customer-visible timeline.
--
-- Replaces the old submitted/reviewed/quoted/contacted/closed flow with a
-- granular pipeline that mirrors "approve -> customer ships device ->
-- device received -> inspect -> quote -> pay", and records every
-- transition in a history table so the customer can see full progress
-- (similar to an order tracking timeline).
--
-- New status set: submitted, approved, shipment_submitted,
-- awaiting_package, under_inspection, quoted, payment_confirmed,
-- rejected, cancelled.
--
-- Run this once, after database.sql.

alter table sell_phone_requests alter column status drop default;
alter table sell_phone_requests alter column status type text using status::text;
drop type if exists sell_phone_status;

-- Best-effort mapping of any existing rows onto the new, more granular set.
update sell_phone_requests set status = case status
  when 'submitted' then 'submitted'
  when 'reviewed' then 'approved'
  when 'quoted' then 'quoted'
  when 'contacted' then 'under_inspection'
  when 'closed' then 'cancelled'
  else status
end;

alter table sell_phone_requests
  add constraint sell_phone_requests_status_check
  check (status in (
    'submitted', 'approved', 'shipment_submitted', 'awaiting_package',
    'under_inspection', 'quoted', 'payment_confirmed', 'rejected', 'cancelled'
  ));

alter table sell_phone_requests alter column status set default 'submitted';

alter table sell_phone_requests add column if not exists shipping_courier text;
alter table sell_phone_requests add column if not exists shipping_tracking_number text;
alter table sell_phone_requests add column if not exists rejection_reason text;

create table if not exists sell_phone_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references sell_phone_requests(id) on delete cascade,
  status text not null,
  note text,
  changed_by text not null default 'admin',
  created_at timestamptz not null default now()
);
create index if not exists idx_sell_phone_status_history_request_id on sell_phone_status_history(request_id);

-- Seed a baseline entry for requests submitted before this migration so
-- their timeline isn't empty.
insert into sell_phone_status_history (request_id, status, note, changed_by, created_at)
select id, status, 'Status recorded at timeline migration', 'system', updated_at
from sell_phone_requests r
where not exists (
  select 1 from sell_phone_status_history h where h.request_id = r.id
);

alter table sell_phone_status_history enable row level security;

drop policy if exists "customers can read own sell request history" on sell_phone_status_history;
create policy "customers can read own sell request history"
  on sell_phone_status_history
  for select
  to authenticated
  using (
    exists (
      select 1 from sell_phone_requests r
      where r.id = sell_phone_status_history.request_id
        and r.user_id = auth.uid()
    )
  );
