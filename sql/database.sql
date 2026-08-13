-- =====================================================================
-- CellKore Database Schema
-- Target: Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- =====================================================================

-- ---------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
create type product_condition as enum ('new', 'used', 'refurbished');
create type marketplace_type as enum ('US', 'CA');
create type address_type as enum ('shipping', 'billing');
create type order_status as enum ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
create type payment_status as enum ('unpaid', 'paid', 'refunded', 'failed');
create type inquiry_status as enum ('new', 'responded');
create type sell_phone_status as enum ('submitted', 'reviewed', 'quoted', 'contacted', 'closed');
create type repair_status as enum (
  'pending_approval',
  'approved',
  'phone_requested',
  'phone_received',
  'assessed',
  'price_given',
  'accepted',
  'rejected',
  'completed'
);
create type admin_role as enum ('super_admin', 'admin');

-- ---------------------------------------------------------------------
-- USERS & ACCESS
-- ---------------------------------------------------------------------
create table users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  phone text,
  country text, -- e.g. 'US', 'CA', 'Other'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type address_type not null,
  line1 text not null,
  line2 text,
  city text not null,
  state_province text,
  postal_code text,
  country text not null,
  created_at timestamptz not null default now()
);
create index idx_addresses_user_id on addresses(user_id);

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role admin_role not null default 'admin',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CATALOG: CATEGORIES & PRODUCTS
-- ---------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table product_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories(id) on delete set null,
  is_phone_type boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_product_types_category_id on product_types(category_id);

-- Admin-defined reusable spec field lists, attached to a Product Type (many per type allowed).
create table spec_templates (
  id uuid primary key default gen_random_uuid(),
  product_type_id uuid not null references product_types(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_spec_templates_product_type_id on spec_templates(product_type_id);

create table spec_template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references spec_templates(id) on delete cascade,
  key text not null,
  label text not null,
  field_type text not null default 'text', -- 'text' | 'number' | 'select' | 'checkbox'
  options jsonb,
  unit text,
  default_value text,
  sort_order int not null default 0
);
create index idx_spec_template_fields_template_id on spec_template_fields(template_id);

-- Named, reusable snapshots of Mobile Specifications values (e.g. "iPhone 15 Pro"), phone-only.
-- Not referenced by products — values are copied in on load, never live-joined.
create table mobile_spec_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  mobile_specifications jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  product_type_id uuid references product_types(id) on delete set null,
  spec_template_id uuid references spec_templates(id) on delete set null,
  sku text unique,
  name text not null,
  brand text,
  condition product_condition not null default 'new',
  base_price numeric(10,2) not null,
  purchase_price numeric(10,2),
  description text,
  is_wholesale boolean not null default false,
  lot_quantity int,
  is_active boolean not null default true,
  mobile_specifications jsonb not null default '{}'::jsonb,
  -- Snapshot of the chosen spec template's fields at save time (label/type/unit/value),
  -- plus any per-product custom entries. Never live-joined back to spec_templates.
  template_specifications jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_category_id on products(category_id);
create index idx_products_product_type_id on products(product_type_id);
create index idx_products_is_wholesale on products(is_wholesale);

-- A product can be listed in US only, Canada only, or both
create table product_marketplaces (
  product_id uuid not null references products(id) on delete cascade,
  marketplace marketplace_type not null,
  primary key (product_id, marketplace)
);

-- Key-value specs so different categories (phones/laptops/watches) can have different attributes
create table product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  spec_name text not null,   -- e.g. 'display_size', 'storage', 'charging_type', 'battery_capacity', 'front_camera', 'back_camera'
  spec_value text not null
);
create index idx_product_specifications_product_id on product_specifications(product_id);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  color text,
  swatch_hex text,
  storage text,
  ram text,
  stock_quantity int not null default 0,
  price_adjustment numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
create index idx_product_variants_product_id on product_variants(product_id);

-- variant_color matches product_variants.color by name (not a FK) so images can be
-- tagged to a variant before that variant has a DB id during admin form entry.
-- null/empty = shared image shown regardless of selected color.
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  variant_color text
);
create index idx_product_images_product_id on product_images(product_id);

-- ---------------------------------------------------------------------
-- WISHLIST & CART
-- ---------------------------------------------------------------------
create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_id text, -- for guest carts
  created_at timestamptz not null default now()
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);
create index idx_cart_items_cart_id on cart_items(cart_id);

-- ---------------------------------------------------------------------
-- ORDERS / CHECKOUT
-- ---------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  marketplace marketplace_type not null,
  shipping_address_id uuid references addresses(id) on delete set null,
  billing_address_id uuid references addresses(id) on delete set null,
  status order_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  total_amount numeric(10,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_user_id on orders(user_id);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  quantity int not null check (quantity > 0),
  unit_price_at_purchase numeric(10,2) not null
);
create index idx_order_items_order_id on order_items(order_id);

-- ---------------------------------------------------------------------
-- WHOLESALE
-- ---------------------------------------------------------------------
create table wholesale_price_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  min_quantity int not null,
  max_quantity int, -- null = no upper bound
  price_per_unit numeric(10,2) not null
);
create index idx_wholesale_price_tiers_product_id on wholesale_price_tiers(product_id);

create table wholesale_variant_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  color text not null
);

-- ---------------------------------------------------------------------
-- SELL YOUR PHONE
-- ---------------------------------------------------------------------
create table sell_phone_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  device_brand text not null,
  device_model text not null,
  condition product_condition not null,
  description text,
  contact_phone text,
  contact_email text,
  status sell_phone_status not null default 'submitted',
  offered_price numeric(10,2),
  payout_amount numeric(10,2),
  payout_reference text,
  payout_notes text,
  payout_confirmed_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sell_phone_images (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references sell_phone_requests(id) on delete cascade,
  image_url text not null
);
create index idx_sell_phone_images_request_id on sell_phone_images(request_id);

-- ---------------------------------------------------------------------
-- REPAIR CENTRE (workflow-driven)
-- ---------------------------------------------------------------------
create table repair_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  device_info text not null,
  current_status repair_status not null default 'pending_approval',
  quoted_price numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table repair_status_history (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references repair_requests(id) on delete cascade,
  status repair_status not null,
  changed_at timestamptz not null default now(),
  notes text
);
create index idx_repair_status_history_request_id on repair_status_history(repair_request_id);

-- ---------------------------------------------------------------------
-- CONTACT US
-- ---------------------------------------------------------------------
create table contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  country text, -- 'US' or 'CA'
  status inquiry_status not null default 'new',
  submitted_at timestamptz not null default now()
);

create table country_contact_info (
  id uuid primary key default gen_random_uuid(),
  country text not null unique, -- 'US' or 'CA'
  whatsapp_number text,
  email text,
  landline text
);

-- ---------------------------------------------------------------------
-- SITE CONTENT & FOOTER
-- ---------------------------------------------------------------------
create table cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, -- e.g. 'about', 'terms-and-conditions'
  title text not null,
  content text,
  updated_at timestamptz not null default now()
);

create table social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null, -- e.g. 'facebook', 'instagram', 'whatsapp'
  url text not null,
  is_active boolean not null default true
);

create type review_status as enum ('pending', 'approved', 'rejected');

create table product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  reviewer_name text not null,
  reviewer_email text,
  rating int not null check (rating between 1 and 5),
  title text,
  comment text not null,
  status review_status not null default 'pending',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_product_reviews_product_id on product_reviews(product_id);
create index idx_product_reviews_status on product_reviews(status);

create table store_testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  customer_name text not null,
  customer_email text,
  rating int not null check (rating between 1 and 5),
  title text,
  comment text not null,
  status review_status not null default 'pending',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_store_testimonials_status on store_testimonials(status);

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now()
);

-- =====================================================================
-- AUTH TRIGGERS
-- Automatically create user record in custom users table when user signs up via Supabase Auth
-- =====================================================================

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Only insert if the users table exists and the user doesn't already exist
  if exists (select 1 from information_schema.tables where table_name = 'users') then
    insert into public.users (id, full_name, email, phone, country, password_hash)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'User'),
      new.email,
      new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'country',
      '' -- password_hash is required but Supabase Auth handles password separately
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger that calls the function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================================
-- OPTIONAL: Row Level Security (recommended for Supabase)
-- Uncomment and customize policies before going to production.
-- =====================================================================
alter table users enable row level security;
alter table addresses enable row level security;
alter table wishlists enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table sell_phone_requests enable row level security;
alter table repair_requests enable row level security;




-- =====================================================================
-- Run this in Supabase (Project > SQL Editor > New query) after
-- database.sql. It lets the public "Sell Your Phone" and "Contact Us"
-- forms insert rows using the anon key, without opening up read/update/
-- delete access to visitors.
-- =====================================================================

-- sell_phone_requests already has RLS enabled in database.sql, but has
-- no policies yet, which means (with RLS on) NO ONE can insert until a
-- policy explicitly allows it.
alter table sell_phone_requests enable row level security;

drop policy if exists "public can submit sell requests" on sell_phone_requests;
create policy "public can submit sell requests"
  on sell_phone_requests
  for insert
  to anon
  with check (true);

drop policy if exists "authenticated users can read own sell requests" on sell_phone_requests;
create policy "authenticated users can read own sell requests"
  on sell_phone_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

-- contact_inquiries did not have RLS enabled at all in database.sql.
-- Turning it on + adding an insert-only policy keeps it available to
-- the contact form while preventing visitors from reading, editing, or
-- deleting other people's inquiries.
alter table contact_inquiries enable row level security;

drop policy if exists "public can submit contact inquiries" on contact_inquiries;
create policy "public can submit contact inquiries"
  on contact_inquiries
  for insert
  to anon
  with check (true);

-- Note: you (the project owner) can still see every row in the
-- Supabase Table Editor regardless of these policies, since Studio
-- uses your service role, which bypasses RLS.

-- =====================================================================
-- Fix: sell_phone_requests.condition was using the "product_condition"
-- enum ('new' | 'used' | 'refurbished'), which is meant for the
-- marketplace `products` table. The "Sell Your Phone" form actually
-- sends 'excellent' | 'good' | 'fair' | 'poor', which that enum
-- rejects with: invalid input value for enum product_condition.
--
-- Run ONLY this file in Supabase (Project > SQL Editor > New query).
-- Do NOT re-run the full database.sql — your tables already exist.
--
-- This script is safe to run more than once.
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'device_condition') then
    create type device_condition as enum ('excellent', 'good', 'fair', 'poor');
  end if;
end$$;

-- Only alter the column if it isn't already device_condition.
do $$
begin
  if (
    select data_type
    from information_schema.columns
    where table_name = 'sell_phone_requests' and column_name = 'condition'
  ) <> 'USER-DEFINED'
  or (
    select udt_name
    from information_schema.columns
    where table_name = 'sell_phone_requests' and column_name = 'condition'
  ) <> 'device_condition' then
    -- If sell_phone_requests already has rows whose condition isn't one
    -- of 'excellent'/'good'/'fair'/'poor', this cast will fail. If that
    -- happens, delete/fix those rows first, or replace the USING clause
    -- with a CASE mapping old values to new ones.
    alter table sell_phone_requests
      alter column condition type device_condition
      using condition::text::device_condition;
  end if;
end$$;