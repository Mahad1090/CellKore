-- Repoints existing product/sell-phone/repair image URLs from the raw
-- Supabase Storage host to the caching CDN Worker (Fix 2). Does NOT touch
-- shipping-labels-related columns (label_url / outbound_label_url /
-- shipping_label_url) — that bucket is going private + signed-URL only
-- (Fix 3), not cached.
--
-- APPLIED 2026-08-02 against production. Kept for the record — do not
-- re-run without re-checking the WHERE clauses first (they now match
-- nothing, since the affected rows already point at the CDN host).

begin;

update categories
set image_url = regexp_replace(image_url, '^https://wftsurnpdjkrohmtgbgl\.supabase\.co', 'https://cellkore-image-cdn.cellkoree.workers.dev')
where image_url like 'https://wftsurnpdjkrohmtgbgl.supabase.co/storage/v1/object/public/%';

update product_images
set image_url = regexp_replace(image_url, '^https://wftsurnpdjkrohmtgbgl\.supabase\.co', 'https://cellkore-image-cdn.cellkoree.workers.dev')
where image_url like 'https://wftsurnpdjkrohmtgbgl.supabase.co/storage/v1/object/public/%';

update product_variants
set image_url = regexp_replace(image_url, '^https://wftsurnpdjkrohmtgbgl\.supabase\.co', 'https://cellkore-image-cdn.cellkoree.workers.dev')
where image_url like 'https://wftsurnpdjkrohmtgbgl.supabase.co/storage/v1/object/public/%';

update sell_phone_images
set image_url = regexp_replace(image_url, '^https://wftsurnpdjkrohmtgbgl\.supabase\.co', 'https://cellkore-image-cdn.cellkoree.workers.dev')
where image_url like 'https://wftsurnpdjkrohmtgbgl.supabase.co/storage/v1/object/public/%';

update repair_images
set image_url = regexp_replace(image_url, '^https://wftsurnpdjkrohmtgbgl\.supabase\.co', 'https://cellkore-image-cdn.cellkoree.workers.dev')
where image_url like 'https://wftsurnpdjkrohmtgbgl.supabase.co/storage/v1/object/public/%';

commit;

-- Sanity check after running: every row above should now start with the CDN
-- host, and spot-checking a couple of URLs in a browser should render the
-- same image as before.
