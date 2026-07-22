-- Sell Your Phone: post-inspection rejection with paid return shipping.
--
-- When a device fails inspection (condition doesn't match what the
-- customer described), admin rejects the request and sets a return
-- shipping fee. The customer pays it (Stripe or PayPal) with their
-- shipping address, and a return label gets attached — either via an
-- automated carrier API (not yet integrated, see lib/shipping-label.ts)
-- or manually by admin in the interim.
--
-- Run this once, after the other 2026-07-21/22 sell migrations.

create table if not exists sell_phone_return_shipments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references sell_phone_requests(id) on delete cascade,
  fee_amount numeric(10,2) not null,
  address_line1 text,
  address_line2 text,
  city text,
  state_province text,
  postal_code text,
  country text,
  phone text,
  payment_provider text,
  payment_reference text,
  paid_at timestamptz,
  label_status text not null default 'pending' check (label_status in ('pending', 'generated', 'failed')),
  label_url text,
  tracking_number text,
  carrier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sell_phone_return_shipments_request_id on sell_phone_return_shipments(request_id);

alter table sell_phone_return_shipments enable row level security;

drop policy if exists "customers can read own return shipment" on sell_phone_return_shipments;
create policy "customers can read own return shipment"
  on sell_phone_return_shipments
  for select
  to authenticated
  using (
    exists (
      select 1 from sell_phone_requests r
      where r.id = sell_phone_return_shipments.request_id
        and r.user_id = auth.uid()
    )
  );

-- All writes (fee creation, address + payment, label attachment) go
-- through service-role API routes, so no insert/update policy is needed.
