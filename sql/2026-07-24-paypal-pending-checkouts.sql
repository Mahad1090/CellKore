-- Backstop for the main-cart PayPal checkout: normally the browser calls
-- /api/checkout/paypal/capture right after PayPal approval and that request
-- finalizes the order. If the tab closes or the network drops between
-- PayPal confirming the capture and that response reaching us, the payment
-- is taken but no order ever gets written. The PayPal webhook
-- (app/api/webhooks/paypal/route.ts) is the backstop, but PayPal's
-- custom_id field is only 127 characters — nowhere near enough to carry
-- the full items/shipping/gift payload the way Stripe's checkout metadata
-- does. So the order-creation route stashes that payload here, keyed by
-- the PayPal order id, and the webhook (or the normal capture route, on
-- cleanup) reads it back to call finalizePaidOrder. orders.reference is
-- unique, so a duplicate finalize attempt from the losing side of a race
-- is a harmless no-op, not a duplicate order.

create table if not exists paypal_pending_checkouts (
  paypal_order_id text primary key,
  order_reference text not null unique,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table paypal_pending_checkouts enable row level security;

-- Written and read only by service-role API routes (order creation, capture,
-- webhook) — no customer ever needs direct access, so no policies are added.
