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
create type admin_role as enum ('super_admin', 'editor', 'support');

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
  role admin_role not null default 'editor',
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

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  sku text unique,
  name text not null,
  brand text,
  condition product_condition not null default 'new',
  base_price numeric(10,2) not null,
  location text,
  description text,
  is_wholesale boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_category_id on products(category_id);
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
  stock_quantity int not null default 0,
  price_adjustment numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
create index idx_product_variants_product_id on product_variants(product_id);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  is_primary boolean not null default false
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