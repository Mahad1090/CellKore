-- The 2026-08-14-sell-device-config.sql migration created these tables
-- without RLS (matching categories/product_types/etc.), which relies on the
-- anon/authenticated Postgres roles having a SELECT grant. Older catalog
-- tables got that grant automatically when the project was first set up;
-- brand-new tables need it applied explicitly.
grant select on sell_device_models to anon, authenticated;
grant select on sell_problem_options to anon, authenticated;
