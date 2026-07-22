-- Sell workflow upgrade
-- Run this on an existing database after deploying the app changes.

alter table sell_phone_requests add column if not exists payout_amount numeric(10,2);
alter table sell_phone_requests add column if not exists payout_reference text;
alter table sell_phone_requests add column if not exists payout_notes text;
alter table sell_phone_requests add column if not exists payout_confirmed_at timestamptz;

-- Customer profile needs authenticated users to read their own requests.
alter table sell_phone_requests enable row level security;

drop policy if exists "authenticated users can read own sell requests" on sell_phone_requests;
create policy "authenticated users can read own sell requests"
  on sell_phone_requests
  for select
  to authenticated
  using (auth.uid() = user_id);
