-- Admin-editable announcement bar messages shown in the scrolling marquee
-- at the top of the customer-facing site, replacing the previously
-- hardcoded strings in components/navigation.tsx.

create table announcements (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_announcements_sort_order on announcements(sort_order);

alter table announcements enable row level security;
create policy "public read active announcements" on announcements for select using (is_active = true);

-- Seed with the previously hardcoded messages so the bar keeps working immediately.
insert into announcements (text, sort_order, is_active) values
  ('Complimentary Express Delivery on All Orders', 0, true),
  ('Certified Authentic Inventory & Grading', 1, true),
  ('Wholesale Contracts & Bulk Pricing Available', 2, true);
