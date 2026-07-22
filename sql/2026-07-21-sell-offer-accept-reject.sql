-- Sell Your Phone: customer accept/reject step for the initial offer.
--
-- Flow: admin approves a request and sets offered_price (status =
-- 'approved') -> customer must explicitly accept before shipping
-- instructions unlock (status -> 'offer_accepted') or reject, which
-- cancels the request (status -> 'cancelled'). Only shipment submission
-- is re-gated on 'offer_accepted' instead of 'approved'.
--
-- Run this once, after 2026-07-21-sell-workflow-timeline.sql.

alter table sell_phone_requests drop constraint if exists sell_phone_requests_status_check;
alter table sell_phone_requests
  add constraint sell_phone_requests_status_check
  check (status in (
    'submitted', 'approved', 'offer_accepted', 'shipment_submitted', 'awaiting_package',
    'under_inspection', 'quoted', 'payment_confirmed', 'rejected', 'cancelled'
  ));
