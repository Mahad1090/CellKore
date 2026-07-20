-- Lets each wholesale lot item row (product_variants) carry its own photo,
-- so the manifest table can show a picture per item instead of only lot-level images.

alter table product_variants add column image_url text;
