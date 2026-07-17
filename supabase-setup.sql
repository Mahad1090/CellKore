-- =====================================================================
-- CellKore — Infrastructure Setup (run AFTER database.sql)
-- Adds: schema extensions, promotions, RLS policies, storage buckets,
-- data-integrity triggers, and the auth.users -> public.users bridge.
-- Run in Supabase SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SCHEMA EXTENSIONS
-- ---------------------------------------------------------------------

-- Human-readable order reference (CK-YYYY-NNNNN) + gift options
alter table orders add column if not exists reference text unique;
alter table products add column if not exists lot_quantity integer;
-- Structured mobile spec sheet (categories -> field key -> value), replaces the free-text Add Spec editor for phones.
-- Shape defined in lib/mobile-specs.ts (general/display/performance/memory/battery/rearCamera/frontCamera/
-- connectivity/audio/sensors/software/boxContents/samsungFeatures/appleFeatures/custom[]).
alter table products add column if not exists mobile_specifications jsonb not null default '{}'::jsonb;
-- Admin-only cost data for the profit-margin calculator; never selected in the public storefront query (lib/data.ts).
alter table products add column if not exists purchase_price numeric(10,2);
-- Variant swatch color + per-variant image tagging (matched by color name, see database.sql comment).
alter table product_variants add column if not exists swatch_hex text;
alter table product_variants add column if not exists storage text;
alter table product_variants add column if not exists ram text;
alter table product_images add column if not exists variant_color text;
-- Product Types (Phone, Phone Case, Charger, ...), each mapped to a Category; is_phone_type
-- drives whether the Mobile Specifications editor shows on the product form.
create table if not exists product_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories(id) on delete set null,
  is_phone_type boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_types_category_id on product_types(category_id);
alter table products add column if not exists product_type_id uuid references product_types(id) on delete set null;
create index if not exists idx_products_product_type_id on products(product_type_id);
alter table product_types enable row level security;
drop policy if exists "public read product_types" on product_types;
create policy "public read product_types" on product_types for select using (true);
-- Admin-defined reusable spec field lists per Product Type. Only admin routes (service role)
-- touch these tables — the storefront reads a self-contained snapshot on products.template_specifications
-- instead of joining here, so no public read policy is needed.
create table if not exists spec_templates (
  id uuid primary key default gen_random_uuid(),
  product_type_id uuid not null references product_types(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_spec_templates_product_type_id on spec_templates(product_type_id);
create table if not exists spec_template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references spec_templates(id) on delete cascade,
  key text not null,
  label text not null,
  field_type text not null default 'text',
  options jsonb,
  unit text,
  default_value text,
  sort_order int not null default 0
);
alter table spec_template_fields add column if not exists default_value text;
create index if not exists idx_spec_template_fields_template_id on spec_template_fields(template_id);
alter table products add column if not exists spec_template_id uuid references spec_templates(id) on delete set null;
alter table products add column if not exists template_specifications jsonb not null default '{}'::jsonb;
alter table spec_templates enable row level security;
alter table spec_template_fields enable row level security;
-- Named, reusable snapshots of Mobile Specifications values (e.g. "iPhone 15 Pro"), phone-only.
-- Admin/service-role only, same as spec_templates — nothing FKs to a preset, it's copied in on load.
create table if not exists mobile_spec_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  mobile_specifications jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table orders add column if not exists is_gift boolean not null default false;
alter table orders add column if not exists gift_recipient_name text;
alter table orders add column if not exists gift_recipient_phone text;
alter table orders add column if not exists gift_message text;
alter table orders add column if not exists gift_card boolean not null default false;
alter table orders add column if not exists gift_wrapping boolean not null default false;

-- Promotions / promo codes
create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null default 'percentage' check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null,
  min_subtotal numeric(10,2) not null default 0,
  country text,                -- null = all countries, else 'US' / 'CA'
  email_domain text,           -- null = all emails, else restrict e.g. '@company.com'
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Admin log for payment/webhook incidents (payment succeeded, DB write failed)
create table if not exists admin_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'error',
  source text not null,
  message text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. AUTH BRIDGE: mirror Supabase auth users into public.users
-- ---------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, email, password_hash, phone, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'managed-by-supabase-auth',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'country'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------
-- 3. DATA-INTEGRITY GUARDS
-- ---------------------------------------------------------------------

-- Prevent overlapping wholesale pricing tiers for the same product
create or replace function public.check_tier_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from wholesale_price_tiers t
    where t.product_id = new.product_id
      and t.id <> coalesce(new.id, gen_random_uuid())
      and new.min_quantity <= coalesce(t.max_quantity, 2147483647)
      and coalesce(new.max_quantity, 2147483647) >= t.min_quantity
  ) then
    raise exception 'Overlapping wholesale pricing tier bounds for this product';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tier_overlap on wholesale_price_tiers;
create trigger trg_tier_overlap
  before insert or update on wholesale_price_tiers
  for each row execute function public.check_tier_overlap();

-- Prevent deleting a category that still has products assigned
create or replace function public.prevent_category_delete_with_products()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from products where category_id = old.id) then
    raise exception 'Category still has products assigned. Reassign products before deleting.';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_category_delete_guard on categories;
create trigger trg_category_delete_guard
  before delete on categories
  for each row execute function public.prevent_category_delete_with_products();

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_touch on products;
create trigger trg_products_touch before update on products
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_orders_touch on orders;
create trigger trg_orders_touch before update on orders
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_sell_requests_touch on sell_phone_requests;
create trigger trg_sell_requests_touch before update on sell_phone_requests
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
-- Note: admin panel writes go through Next.js API routes using the
-- service-role key (which bypasses RLS) after RBAC checks, so no anon
-- write policies are granted on catalog/admin tables.

-- Public read access
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_specifications enable row level security;
alter table product_images enable row level security;
alter table product_marketplaces enable row level security;
alter table categories enable row level security;
alter table wholesale_price_tiers enable row level security;
alter table wholesale_variant_colors enable row level security;
alter table country_contact_info enable row level security;
alter table cms_pages enable row level security;
alter table social_links enable row level security;
alter table promotions enable row level security;

drop policy if exists "public read products" on products;
create policy "public read products" on products for select using (true);
drop policy if exists "public read variants" on product_variants;
create policy "public read variants" on product_variants for select using (true);
drop policy if exists "public read specs" on product_specifications;
create policy "public read specs" on product_specifications for select using (true);
drop policy if exists "public read images" on product_images;
create policy "public read images" on product_images for select using (true);
drop policy if exists "public read marketplaces" on product_marketplaces;
create policy "public read marketplaces" on product_marketplaces for select using (true);
drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);
drop policy if exists "public read tiers" on wholesale_price_tiers;
create policy "public read tiers" on wholesale_price_tiers for select using (true);
drop policy if exists "public read lot colors" on wholesale_variant_colors;
create policy "public read lot colors" on wholesale_variant_colors for select using (true);
drop policy if exists "public read contact info" on country_contact_info;
create policy "public read contact info" on country_contact_info for select using (true);
drop policy if exists "public read cms" on cms_pages;
create policy "public read cms" on cms_pages for select using (true);
drop policy if exists "public read socials" on social_links;
create policy "public read socials" on social_links for select using (true);

-- Owner-only access (auth.uid() = user_id)
alter table users enable row level security;
alter table addresses enable row level security;
alter table wishlists enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

drop policy if exists "own profile" on users;
create policy "own profile" on users
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own addresses" on addresses;
create policy "own addresses" on addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own wishlists" on wishlists;
create policy "own wishlists" on wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own carts" on carts;
create policy "own carts" on carts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own cart items" on cart_items;
create policy "own cart items" on cart_items
  for all using (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()));

drop policy if exists "own orders read" on orders;
create policy "own orders read" on orders for select using (auth.uid() = user_id);

drop policy if exists "own order items read" on order_items;
create policy "own order items read" on order_items
  for select using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

-- Public submission queues (insert only; reads/updates via service-role admin APIs)
alter table sell_phone_requests enable row level security;
alter table sell_phone_images enable row level security;
alter table contact_inquiries enable row level security;
alter table newsletter_subscribers enable row level security;

drop policy if exists "anyone can submit sell request" on sell_phone_requests;
create policy "anyone can submit sell request" on sell_phone_requests for insert with check (true);
drop policy if exists "own sell requests read" on sell_phone_requests;
create policy "own sell requests read" on sell_phone_requests for select using (auth.uid() = user_id);
drop policy if exists "anyone can attach sell images" on sell_phone_images;
create policy "anyone can attach sell images" on sell_phone_images for insert with check (true);
drop policy if exists "anyone can submit inquiry" on contact_inquiries;
create policy "anyone can submit inquiry" on contact_inquiries for insert with check (true);
drop policy if exists "anyone can subscribe" on newsletter_subscribers;
create policy "anyone can subscribe" on newsletter_subscribers for insert with check (true);

-- Admin-only tables: no anon/auth policies at all — service-role only.
alter table admin_users enable row level security;
alter table admin_logs enable row level security;

-- ---------------------------------------------------------------------
-- 5. STORAGE BUCKETS
-- ---------------------------------------------------------------------
-- sell-phone-images: public read; anon may upload/remove within requests/
-- product-images:    public read; writes via service role (admin API) only.
insert into storage.buckets (id, name, public)
values ('sell-phone-images', 'sell-phone-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public read sell phone images" on storage.objects;
create policy "public read sell phone images" on storage.objects
  for select using (bucket_id = 'sell-phone-images');

drop policy if exists "public upload sell phone images" on storage.objects;
create policy "public upload sell phone images" on storage.objects
  for insert with check (bucket_id = 'sell-phone-images' and (storage.foldername(name))[1] = 'requests');

-- allow the client-side rollback to remove files it just uploaded
drop policy if exists "public rollback sell phone images" on storage.objects;
create policy "public rollback sell phone images" on storage.objects
  for delete using (bucket_id = 'sell-phone-images' and (storage.foldername(name))[1] = 'requests');

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

-- ---------------------------------------------------------------------
-- 6. SEED DATA (idempotent)
-- ---------------------------------------------------------------------
insert into cms_pages (slug, title, content) values
  ('terms', 'Terms & Conditions', 'All sales are final. CellKore maintains a strict No Return & Exchange Policy across retail and wholesale channels. Devices are certified and graded prior to listing.'),
  ('privacy', 'Privacy Policy', 'CellKore respects your privacy. We only collect the information necessary to process orders, quotes, and support requests, and we never sell your personal data.'),
  ('about', 'About CellKore', 'CellKore is your premium electronics hub for buying, wholesaling, and selling devices across the United States and Canada.'),
  ('sell-success', 'Quote Request Received', 'Thank you for your submission. A CellKore support agent will call or email you within 24 hours with an official quote for your device.')
on conflict (slug) do nothing;

insert into country_contact_info (country, whatsapp_number, email, landline) values
  ('US', null, null, null),
  ('CA', null, null, null)
on conflict (country) do nothing;

insert into categories (name, slug, sort_order) values
  ('iPhones', 'iphones', 1),
  ('Samsungs', 'samsungs', 2),
  ('Tablets', 'tablets', 3),
  ('iPads', 'ipads', 4),
  ('Watches', 'watches', 5),
  ('Laptops', 'laptops', 6)
on conflict (slug) do nothing;

insert into social_links (platform, url, is_active) values
  ('Facebook', 'https://facebook.com', false),
  ('Instagram', 'https://instagram.com', false),
  ('WhatsApp', 'https://wa.me/', false)
on conflict do nothing;

-- Create your first super admin (replace the values, then uncomment):
-- The password hash must be a bcrypt hash — generate one with:
--   node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
-- insert into admin_users (full_name, email, password_hash, role)
-- values ('Super Admin', 'admin@cellkore.com', '$2a$10$REPLACE_WITH_BCRYPT_HASH', 'super_admin');
