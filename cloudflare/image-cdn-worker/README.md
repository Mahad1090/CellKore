# cellkore-image-cdn

Caching reverse proxy in front of `wftsurnpdjkrohmtgbgl.supabase.co/storage/v1/object/public/*`
(product / sell-phone / repair images only — `shipping-labels` is explicitly
blocked, see Fix 3).

Deployed manually through the Cloudflare dashboard (no wrangler/CLI, no
account credentials needed in this repo). `dashboard-paste.js` is the single
source of truth — paste its contents into the Worker's online editor.

## Deploy (dashboard)

1. dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**.
   Name it `cellkore-image-cdn`.
2. **Edit code** → replace the default script with the contents of
   `dashboard-paste.js` → **Save and Deploy**.
3. Worker → **Settings** → **Variables and Secrets** → add `SUPABASE_HOST`
   = `wftsurnpdjkrohmtgbgl.supabase.co` (type **Text**, not Secret) → save
   (redeploy if it doesn't happen automatically).
4. Copy the `*.workers.dev` URL from the Worker's **Overview** page.

## Verify

```
WORKER="https://cellkore-image-cdn.<your-subdomain>.workers.dev"
PATH="/storage/v1/object/public/product-images/products/iphone-12-e711c785-d655-403d-8e89-71432316c079/1784581342902-screenshot-2026-07-01-175018.png"

curl -sI "$WORKER$PATH" | grep -i "cf-cache-status\|content-type"   # first hit: MISS
curl -sI "$WORKER$PATH" | grep -i "cf-cache-status"                  # second hit: HIT
curl -sI "$WORKER/storage/v1/object/public/shipping-labels/anything" | head -1   # expect 404
```

## Wire it into the app

Once verified, set in the app's environment:

```
NEXT_PUBLIC_IMAGE_CDN_HOST=https://cellkore-image-cdn.<your-subdomain>.workers.dev
```

`lib/image-cdn.ts` only rewrites URLs when this is set — new uploads start
getting proxied URLs immediately after a redeploy with that var set. Existing
rows still point at the raw Supabase host until
`sql/2026-08-02-repoint-image-urls-to-cdn.sql` is run (write-only for now —
do not run until the Worker above is verified working end to end).

## Updating the Worker later

Edit `dashboard-paste.js` in this repo, then copy/paste the new contents into
the Worker's online editor and **Save and Deploy** again — there's no
automatic sync between this repo and the deployed Worker.
