-- Reviews & Testimonials upgrade
-- Run this on an existing CellKore database after deploying the app changes.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'review_status') then
    create type review_status as enum ('pending', 'approved', 'rejected');
  end if;
end$$;

create table if not exists product_reviews (
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
create index if not exists idx_product_reviews_product_id on product_reviews(product_id);
create index if not exists idx_product_reviews_status on product_reviews(status);

create table if not exists store_testimonials (
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
create index if not exists idx_store_testimonials_status on store_testimonials(status);

alter table product_reviews enable row level security;
alter table store_testimonials enable row level security;

drop policy if exists "public approved reviews" on product_reviews;
create policy "public approved reviews" on product_reviews for select using (status = 'approved');
drop policy if exists "authenticated own reviews" on product_reviews;
create policy "authenticated own reviews" on product_reviews for select to authenticated using (status = 'approved' or auth.uid() = user_id);
drop policy if exists "authenticated submit reviews" on product_reviews;
create policy "authenticated submit reviews" on product_reviews for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "public approved testimonials" on store_testimonials;
create policy "public approved testimonials" on store_testimonials for select using (status = 'approved');
drop policy if exists "authenticated own testimonials" on store_testimonials;
create policy "authenticated own testimonials" on store_testimonials for select to authenticated using (status = 'approved' or auth.uid() = user_id);
drop policy if exists "authenticated submit testimonials" on store_testimonials;
create policy "authenticated submit testimonials" on store_testimonials for insert to authenticated with check (auth.uid() = user_id);
