-- If Supabase auto-enabled RLS on these tables at creation (recent projects
-- do this by default, even via the raw SQL Editor), the previous GRANT
-- SELECT alone wasn't enough — a table-level grant doesn't bypass RLS, it
-- only matters once a policy actually allows the row through. This adds an
-- explicit public-read policy for active rows, matching how the storefront
-- reads categories/spec_templates/etc. (those tables just predate whatever
-- default enabled RLS here, so no explicit policy has been needed for them).

alter table sell_device_models enable row level security;
drop policy if exists "public can read active sell device models" on sell_device_models;
create policy "public can read active sell device models"
  on sell_device_models
  for select
  to anon, authenticated
  using (is_active = true);

alter table sell_problem_options enable row level security;
drop policy if exists "public can read active sell problem options" on sell_problem_options;
create policy "public can read active sell problem options"
  on sell_problem_options
  for select
  to anon, authenticated
  using (is_active = true);
