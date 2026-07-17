# CellKore Complete Master Development Prompt

You are a senior Next.js, React, and Supabase developer. You are tasked with implementing the full-stack **CellKore** application, an e-commerce platform for buying, wholesaling, and selling devices. 

Build the storefront and administration panels module-by-module. For each module, implement both the frontend interfaces and backend API routes concurrently, strictly adhering to the requirements, database structures, and edge case guards below.

---

## CORE PLATFORM ARCHITECTURE & UI RULES
- **No Compromise on UI Quality**: Under no circumstances should the design or user experience be simplified or compromised. The interface must look and feel highly premium, luxury, and professional. Implement polished details: smooth hover transitions, micro-interactions, subtle glassmorphism effects, border beam animations, clean alignment, and consistent padding. Avoid bare-bones tables, default form styles, or generic blocks.
- **Fixed Browser Theme**: Storefront colors and styling must remain **identical and consistent** regardless of whether the user's browser is in Light Mode or Dark Mode. Ignore `@media (prefers-color-scheme: dark)` system overrides.
- **Dynamic CSS Variables**: NEVER hardcode color hex codes. Always bind colors to CSS variables: `var(--primary)` / `bg-primary`, `var(--accent)` / `bg-accent`, `var(--background)` / `bg-background`, and `var(--foreground)` / `text-foreground`.
- **Admin Panel Theme override**: When the body has `.admin-theme-wrapper`, the color variables must override to dark slate/obsidian (`#121212` for primary/accent) for the admin dashboard.
- **No Browser Popups**: Never use native `window.alert()`, `window.confirm()`, or `window.prompt()`. All notifications, warnings, and confirmations must use custom, theme-compliant modals, overlay panels, or toast alerts styled with Tailwind.
- **No Returns Policy**: All sales are final. Display the *"No Return & Exchange Policy"* notice on checkout pages and wholesale lot detail pages.

---

## DATABASE SCHEMA DDL
```sql
create type product_condition as enum ('new', 'used', 'refurbished');
create type marketplace_type as enum ('US', 'CA');
create type address_type as enum ('shipping', 'billing');
create type order_status as enum ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
create type payment_status as enum ('unpaid', 'paid', 'refunded', 'failed');
create type inquiry_status as enum ('new', 'responded');
create type sell_phone_status as enum ('submitted', 'reviewed', 'quoted', 'contacted', 'closed');
create type admin_role as enum ('super_admin', 'editor', 'support');

create table users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  phone text,
  country text,
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

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role admin_role not null default 'editor',
  created_at timestamptz not null default now()
);

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

create table product_marketplaces (
  product_id uuid not null references products(id) on delete cascade,
  marketplace marketplace_type not null,
  primary key (product_id, marketplace)
);

create table product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  spec_name text not null,
  spec_value text not null
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  color text,
  stock_quantity int not null default 0,
  price_adjustment numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  is_primary boolean not null default false
);

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
  session_id text,
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

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  quantity int not null check (quantity > 0),
  unit_price_at_purchase numeric(10,2) not null
);

create table wholesale_price_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  min_quantity int not null,
  max_quantity int,
  price_per_unit numeric(10,2) not null
);

create table wholesale_variant_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  color text not null
);

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

create table contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  country text,
  status inquiry_status not null default 'new',
  submitted_at timestamptz not null default now()
);

create table country_contact_info (
  id uuid primary key default gen_random_uuid(),
  country text not null unique,
  whatsapp_number text,
  email text,
  landline text
);

create table cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text,
  updated_at timestamptz not null default now()
);

create table social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  is_active boolean not null default true
);

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now()
);
```

---

## MODULE-BY-MODULE SPECIFICATIONS

### MODULE 1: Geolocation Marketplace Routing & Detection

#### A. Frontend Specifications
- **Marketplace Determination**:
  - Dynamically geolocates visitor country on first load.
  - Visitors from the **United States** are shown the **US Marketplace** version of the catalog.
  - Visitors from **Canada** are shown the **Canada Marketplace** version of the catalog.
  - Visitors from **outside the US and Canada** (International) must be shown a clean selection banner/tabs in the website header or banner area allowing them to toggle manually between the **US Marketplace**, **Canada Marketplace**, or **Both**.
  - A persistent manual override country selector dropdown must be placed in the header navbar so any user can change their marketplace target manually at any time.

#### B. Backend Specifications
- **IP Geolocation Route (`/app/api/geolocation/route.ts`)**:
  - Action (GET): Read client IP headers (`x-forwarded-for`, `x-real-ip`, or `req.ip`). Query location metadata to resolve country code. Return JSON: `{ countryCode: "US" | "CA" | "INT" }`.
- **Marketplace Mapping**:
  - Establish a client-side context (or middleware check) mapping selected marketplace code (`US` or `CA`) to product lookup filters.
  - Perform SQL joins matching catalog queries against `product_marketplaces` relation table.

#### C. Database Mapping
- Tables: `product_marketplaces`.

#### D. Edge Cases & Safety
- **IP Geolocation Failure**: If detection times out, blocks, or fails, default the catalog to showing the **US Marketplace** dynamically. Render a custom notification toast informing the user they are viewing the US catalog, with a link to change it.
- **Manual Overrides Persistence**: Ensure that manually selected marketplaces are saved to a persistent cookie (`cellkore_marketplace`) and bypass automatic IP geolocation lookup during future site sessions.

---

### MODULE 2: Dynamic Category Navigation & Catalog Display

#### A. Frontend Specifications
- **Navigation Header (`components/navigation.tsx`)**:
  - Logo, Brand Name (CellKore), and tagline: "Your Premium Electronics Hub".
  - Search bar input, user login/signup action triggers, dynamic cart count, and wishlist indicators.
  - **"For Buyers" Button**: Redirection button linking directly to terms and conditions (`/terms`).
  - **Dynamic Category Navigation**: Queries the database to list active categories (`categories` table where `is_active = true` ordered by `sort_order`). Renders tab links dynamically for iPhones, Samsungs, Tablets, iPads, Watches, and Laptops.
- **Catalog Grid (`app/page.tsx`)**:
  - Display cards with product photo, title, condition (New, Used, Refurbished), base price, and location. Cards click through to `/products/[id]`.
- **Product Details Page (`app/products/[id]/page.tsx`)**:
  - Picture carousel displaying sorted images.
  - Display specifications list: **Display Size, Storage Capacity, Charging Type, Battery Capacity, Front Camera, Back Camera** (key-values fetched from `product_specifications`).
  - Selection options for variants (colors, quantity) verifying inventory levels.

#### B. Backend Specifications
- **Active Listing Resolvers**:
  - Query filters: Fetch products where `is_active = true` and `is_wholesale = false`.
  - Sort results by category ranking orders or creation timestamps.

#### C. Database Mapping
- Tables: `categories`, `products`, `product_specifications`, `product_variants`, `product_images`.

#### D. Edge Cases & Safety
- **Out of Stock**: Disable variant items in selector buttons on the product details page if stock levels are zero. If all variants for a product are depleted, show a badge *"Out of Stock"* on the catalog grid card.
- **Variant Deletion**: If a variant is deleted by admins while sitting in a user's active cart, auto-remove it on cart load.

---

### MODULE 3: Wholesale lot Manifest & Pricing Tiers

#### A. Frontend Specifications
- **Wholesale Grid (`app/wholesale/page.tsx`)**:
  - Listing page containing wholesale lots (`products` where `is_wholesale = true`).
  - Displays lot cards showing lot image, total lot quantity, total price, and condition.
- **Wholesale Lot Details (`app/wholesale/[id]/page.tsx`)**:
  - Manifest Inventory Table showing columns: **Model, Storage Capacity, Carrier, Grade, Quantity, and Color** (combining product details with variant color fields).
  - Bulk Pricing Tiers Table: Lists price breaks based on quantity constraints (fetched from `wholesale_price_tiers`).
  - **Final Checkout Buttons**: Triggers checkout with warning text: *"Returns and Exchanges are not supported. All wholesale transactions are final."*

#### B. Backend Specifications
- **Pricing Calculation Logic**:
  - Match item quantities directly against database tiers (`wholesale_price_tiers`).
  - Apply the matching tier unit price: `unit_price = tier.price_per_unit` where `quantity >= min_quantity` and `quantity <= max_quantity` (or open-ended if `max_quantity` is null).

#### C. Database Mapping
- Tables: `products` (where `is_wholesale = true`), `wholesale_price_tiers`, `wholesale_variant_colors`.

#### D. Edge Cases & Safety
- **Overlapping Pricing Tiers**: Enforce backend/admin validation rules preventing users from saving overlapping minimum and maximum quantity bounds.
- **Out of Stock**: If a wholesale lot variant drops to zero, disable the checkout trigger button and badge the lot card as "Sold Out".

---

### MODULE 4: "Sell Your Phone" Quote Request Queue

#### A. Frontend Specifications
- **Submission Form (`app/sell/page.tsx`)**:
  - Steps: Captures Device Brand, Model, Storage, RAM, Color, Condition, damages, and comments.
  - Multi-file image selector: Compresses and accepts files.
  - Contact inputs: Name, Email, and Phone number.
  - **Success Screen**: Shows a confirmation screen explaining that a CellKore support agent will call/email them within 24 hours with an official quote. No native window popups allowed.

#### B. Backend Specifications
- **Storage Bucket Management**:
  - Configure storage bucket name: `sell-phone-images`. Set policy to **Public Read**.
  - Securely upload photos using naming convention: `sell-phone-images/requests/[request_id]/[timestamp]-[filename]`.
- **Submission API**:
  - Writes new request details to `sell_phone_requests` setting status = `'submitted'`.
  - Links uploaded storage URLs into `sell_phone_images` table.

#### C. Database Mapping
- Tables: `sell_phone_requests`, `sell_phone_images`.

#### D. Edge Cases & Safety
- **File Limit & Compress**: Block files > 5MB. Compress images client-side before upload to prevent timeouts on slow networks.
- **Rollback uploads**: If image uploads fail during submission, delete any uploaded files from storage to prevent dead files, and abort writing to `sell_phone_requests`.

---

### MODULE 5: Checkout Funnel, Promo Codes, & Payment

#### A. Frontend Specifications
- **Shopping Cart View (`app/cart/page.tsx`)**:
  - Adjust quantity buttons, subtotal, and dynamic tax calculation.
- **Banu-Style Checkout (`app/checkout/page.tsx`)**:
  - **Local Storage Draft Saving**: Auto-saves address inputs, email, phone, and options to `localStorage` under `cellkore_checkout_draft` to prevent data loss on page refresh.
  - **Input pre-filling sequence**: On load, prefill fields in order: Draft -> User database address (if signed in) -> geolocated country.
  - **Gift Options**: Checkbox *"This order is a gift"*. If checked, displays Recipient Name, phone, message, and options for **Gift Card (+$5)** and **Gift Wrapping (+$10)**.
  - Validation: Enforce client-side ZIP/postal format checks for US/CA, and phone length validation.
  - Payment Gateways: Integrates Smart PayPal SDK buttons and Stripe checkout redirects.
  - Warning Banner: *"Returns and Exchanges are not supported. All checkout items are final."*

#### B. Backend Specifications
- **Stripe Checkout API (`/api/checkout/stripe/route.ts`)**:
  - Accept items, check database stock availability. Calculate US/CA tax rates based on province/state. 
  - Apply coupon validations by querying active promotions.
  - Create Stripe Checkout session and bind metadata parameters (`order_reference`, shipping address details, and item details).
- **Stripe Webhook API (`/api/webhooks/stripe/route.ts`)**:
  - Verify signature. On event `checkout.session.completed`, write to `orders` and `order_items` tables using service-role client (bypassing RLS), decrement variant stock quantity in `product_variants`, and clear user's cart records.
- **PayPal Capture API (`/api/checkout/paypal/capture/route.ts`)**:
  - Captures payment, verifies status, executes database order writes, and decrements stock.
- **Cart Merge Logic**:
  - Upon user sign-in, merge `localStorage` guest items into the database `cart_items` table and clear local storage.

#### C. Database Mapping
- Tables: `users`, `addresses`, `orders`, `order_items`, `carts`, `cart_items`, `wishlists`.

#### D. Edge Cases & Safety
- **Concurrent Stock Depletion**: Perform atomic stock level verification on the backend immediately before Stripe session creation or PayPal captures. If stock drops below selection, abort payment and return explicit stock error message to display in custom storefront warning.
- **Payment succeeds, Database Order creation fails**: Bind order references (`CK-[YEAR]-[5_RANDOM_DIGITS]`) to Stripe metadata. If database writes fail on webhook delivery, flag order details immediately to admin log.

---

### MODULE 6: Admin Panel & Role-Based Access Control (RBAC)

#### A. Frontend Specifications
- **Login Portal (`/admin/login`)**:
  - User and password authentication matching role credentials.
- **Dashboard Overview (`/admin/dashboard`)**:
  - Metric Cards: Active Listings, Categories, Orders, Wholesale Lots, Sell Requests, Pending Inquiries.
  - Quick Actions: Add Product, Manage Categories, View Orders.
- **Admin Management Panels**:
  - **Product CRUD Panel**:
    - Standard fields: Name, SKU, Brand, Base Price, Location, Description, active checkbox, and wholesale lot toggle.
    - **Auto-SKU Generator**: A button next to the SKU input field inside the Product Creator form. When clicked, it parses the selected brand, name, variant color, and storage capacity to automatically generate a standardized product SKU (e.g. `CK-IPH15-BL-128`).
    - **Specifications Creator Interface (Key-Value Editor)**: An interactive sub-form table. Allows admins to dynamically add, edit, or remove specifications. Displays a dropdown containing default specification keys: **Display Size, Storage Capacity, Charging Type, Battery Capacity, Front Camera, Back Camera, Custom Spec Key** (a text input field letting the admin write custom keys). Values are inputted via text fields. Clicking Save inserts or updates entries in the `product_specifications` table for the matching product ID.
    - **Variants stock & price adjuster manager**: An editable grid table. Admins can add rows with fields: Color name, Stock Quantity integer number input, and Price Adjustment decimal input (positive/negative relative price). Syncs with the `product_variants` table.
    - **Marketplaces Config**: Checkboxes for US Marketplace and Canada Marketplace. Selected checkboxes write relations directly to the `product_marketplaces` table, linking or unlinking the product to targeted regional feeds.
    - **Image Upload Manager**: Form letting admins paste image URLs, sort them, and toggle a checkbox to mark a primary/thumbnail product image (`product_images` table).
  - **Category Management Panel**:
    - CRUD grid setting name, slug, active status, sort order, and **Category Image**. Category images must support direct file uploads.
  - **Wholesale Price Tier Editor**:
    - Form matching specific lots. Admins can add brackets containing: Minimum Quantity, Maximum Quantity (optional), and Price Per Unit.
  - **Marketplaces Offices Contact Config**:
    - Form editing WhatsApp number, email, and landline listings for both US and CA offices in the `country_contact_info` table.
  - **Sell Phone Requests Queue (`/admin/sell-requests/page.tsx`)**:
    - Searchable table list of all phone sell requests.
    - Detail Modal: Displays device details, damage details, contact details, and submitted device photos.
    - Actions: Offered Price input box, and a dropdown status selector: `submitted` → `reviewed` → `quoted` → `contacted` → `closed`.
  - **Contact Inquiries Queue**:
    - Displays submitted forms. Form filter options (Status: All, New, Responded) and a checkbox to toggle status between `new` and `responded`.
  - **CMS Rich-text Editor**:
    - Selector dropdown (Terms and Conditions, Privacy Policy, About Us) loading body text area from `cms_pages` table, with saving triggers.
  - **Orders status monitor**:
    - List of orders with details. Status dropdown updates order state (`pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`) and payment state (`unpaid`, `paid`, `refunded`, `failed`).
  - **Admin User Management CRUD Panel (Super Admin Only)**:
    - Dedicated management panel containing a table of existing admin user profiles.
    - Actions: Create, Edit, or Delete admin user credentials and assign roles (`super_admin`, `editor`, `support`) matching the `admin_users` table.
  - **Newsletter Subscribers Panel**:
    - Table list showing subscriber email addresses and dates subscribed.
    - Action: A button to **Export as CSV** downloading the email logs immediately.
  - **Settings & Social Links Manager**:
    - Table containing platforms (Facebook, Instagram, WhatsApp, etc.). Admins can input URLs and toggle an active status checkbox (`social_links` table).
  - **Analytics Metrics & Data Visualizations**:
    - Layout showing charts and key performance metrics:
      * Monthly Revenue (Bar Chart aggregating prices from paid orders).
      * Top Selling Categories (Horizontal Bar Chart or List).
      * Order Status and Payment Status breakdowns (Pie Charts).
      * Total site subscribers counter.

#### B. Backend Specifications
- **Next.js Auth Middleware (`/middleware.ts`)**:
  - Intercepts requests targeting `/admin` and `/api/admin/*`.
  - Verifies session tokens, checks user details against `admin_users` table, and checks roles:
    * `super_admin`: Full database write capabilities, system configurations, and editing admin accounts.
    * `editor`: CRUD operations on product catalogs, wholesale details, and CMS pages. Read-only access to orders/inquiries.
    * `support`: Write capabilities to Sell Request offered prices, Inquiry statuses, and Orders shipping parameters. Read-only access to product details.
  - Returns `403 Forbidden` if role permissions do not match the API route criteria.

#### C. Database Mapping
- Tables: `admin_users`, `country_contact_info`, `cms_pages`, `social_links`, `newsletter_subscribers`.

#### D. Edge Cases & Safety
- **Direct API Bypass**: Secure all administrative REST APIs on the backend by querying the admin session JWT role permissions rather than relying solely on frontend routing guards.
- **Category Deletion**: Prevent deletion of active categories linked to products. Require products to be reassigned before category deletion is permitted.

---

## 7. Premium UX, Storage, & Supabase Infrastructure Configurations

### A. Storage Bucket Structure
- Configure a Supabase storage bucket named `sell-phone-images`.
- Set the bucket access control policy to **Public Read** so uploaded images can be displayed securely on the support admin dashboard without expiring signature parameters.
- Structure uploaded file naming conventions cleanly: `sell-phone-images/requests/[request_id]/[timestamp]-[filename]`.

### B. Supabase Row Level Security (RLS) Policies
Implement database access policies directly to secure data:
- **Public Read Access**: Grant to `products`, `product_variants`, `product_specifications`, `product_images`, `categories`, `wholesale_price_tiers`, `country_contact_info`, `cms_pages`, and `social_links` tables.
- **Authenticated Access (Owner Only)**: Grant read/write access to `wishlists`, `carts`, `cart_items`, `orders`, `order_items`, and `addresses` only if the user ID matches the logged-in session ID (`auth.uid() = user_id`).
- **Support & Admin Queue Permissions**: Enforce write restrictions. Only users authenticated as admins (where `auth.uid()` matches an ID in `admin_users`) can modify records in all tables, insert items, delete product listings, or update sell/contact statuses.

### C. Guest Cart to Account Merging Logic
- Implement client-side synchronization: When a guest customer adds items to their browser cart (`localStorage`) and subsequently signs in or registers:
  1. Trigger an API check comparing local cart IDs to database records.
  2. Merge matching items (incrementing quantities).
  3. Push unique guest items directly to the `cart_items` table in Supabase.
  4. Clear the local storage cart and redirect to the cart view seamlessly.

### D. Loading shimmers & Page transitions
- Implement Tailwind pulse shimmer loading states (`animate-pulse`) for all catalog cards, detail forms, tables, and product lists.
- Place placeholder blocks matching layout dimensions to avoid dynamic content shifts when fetching data from Supabase asynchronously.

### E. Human-Readable Order References
- Do not expose database UUIDs to clients during invoices or order processing.
- Generate an incremental, user-friendly order reference key during checkout submission backend queries (formatted as: `CK-[YEAR]-[5_DIGITS_RANDOM]`).

---

## 8. Full Backend API & Middleware Logic Specifications (File-by-File)

### A. Stripe Session Creation Endpoint (`/app/api/checkout/stripe/route.ts`)
- **Action (POST)**:
  1. Parse incoming parameters: `cartItems` array (with `productId`, `variantId`, `quantity`), `shippingAddress` details, and optional `promoCode`.
  2. Query Supabase (using a transaction-safe client):
     - Resolve the base prices and variant adjustments for each item.
     - Validate that `stock_quantity >= quantity` for every variant. If out of stock, immediately throw a `400` response: `{ error: "Variant out of stock", variantId }`.
  3. Apply dynamic promo discount rules: Query promotions matching the `promoCode`, checking country and email eligibility, subtracting value from the subtotal.
  4. Calculate country-based tax: Compute US states tax or Canadian provincial tax rates dynamically.
  5. Format the Stripe Line Items mapping (representing model names and pictures).
  6. Create the Stripe Session binding custom metadata parameters:
     - `order_reference`: E.g. `CK-2026-98273`
     - `shipping_address_line1`, `city`, `postal_code`, `country`
     - Detailed array representation of variant IDs and quantities.
  7. Return JSON payload: `{ sessionId: session.id, url: session.url }`.

### B. Stripe Webhook Capture Endpoint (`/app/api/webhooks/stripe/route.ts`)
- **Action (POST)**:
  1. Retrieve raw request body text and signature headers. Verify signature matches the local configuration key.
  2. Parse Event Type: On event `checkout.session.completed`:
     - Access metadata parameters.
     - Initialize Supabase database write operations using the service-role client (to bypass RLS rules safely):
       1. Check if `addresses` record exists; if not, insert shipping address details.
       2. Insert new parent order record to `orders` (setting status = `paid`, payment_status = `paid`, total_amount = total).
       3. Loop line items to write records to `order_items`.
       4. Decrement variant stock parameters: Run update queries subtracting quantity from `product_variants.stock_quantity`.
       5. Delete active items from user's `cart_items` database table matching the transaction session user ID.
  3. Return HTTP `200` to acknowledge.

### C. PayPal Capture Endpoint (`/app/api/checkout/paypal/capture/route.ts`)
- **Action (POST)**:
  1. Parse input parameter `paypalOrderId`.
  2. Trigger payment capture request to PayPal Gateway API.
  3. Verify payload response matches `status === "COMPLETED"`.
  4. Perform atomic Supabase writes (using service role client):
     - Insert transaction values to `orders` and `order_items`.
     - Decrement product variant stock counts.
     - Purge checkout cart items from database.
  5. Return JSON success confirmation: `{ success: true, orderId: order.id }`.

### D. Promotion Code Checking Endpoint (`/app/api/promotions/auto/route.ts`)
- **Action (POST)**:
  1. Accept payload: `subtotal`, `cartItems`, `country`, `userEmail`, `promoCode`.
  2. Search active rules: Apply discount values (percentage/fixed value) if preconditions match.
  3. Return JSON payload: `{ valid: true, discountAmount: X, updatedTotal: Y }` or `{ valid: false, message: "Code invalid or expired" }`.

### E. Geolocation Handler Endpoint (`/app/api/geolocation/route.ts`)
- **Action (GET)**:
  1. Extract client IP address by checking header strings: `x-forwarded-for`, `x-real-ip`, or `req.ip`.
  2. Run query check against a geo-lookup provider or resolve location using hosting provider metadata headers.
  3. Return JSON payload: `{ countryCode: "US" | "CA" | "INT" }`.

### F. Next.js Admin Authentication Middleware (`/middleware.ts`)
- **Action (Interception)**:
  1. Match requests targeting `/admin` and `/api/admin/*` directories.
  2. Check authentication tokens: Read cookies and parse active Supabase JWT session payload.
  3. For API calls, execute db query check on `admin_users` table matching user ID:
     - Verify database record exists and role maps to `super_admin`, `editor`, or `support`.
     - If unauthorized, abort request and return `403 Forbidden` response.
     - If not signed in, redirect login views to `/admin/login`.

---

## 9. STRICT DYNAMIC-ONLY (NON-HARDCODING) POLICY

To prevent structural page bugs, code errors, and cheap UI artifacts, you must follow these absolute rules:

### A. Zero Hardcoded Data & Text Copy
- **Storefront Copy**: The phone selling success instructions, about us details, landline contacts, and office locations must NOT be written as static text strings in HTML components. They must be resolved dynamically by querying the `cms_pages` (e.g. `terms`, `about`, `privacy`), `country_contact_info`, or `social_links` tables.
- **Mock Catalogs**: You are strictly forbidden from placing static mock arrays of products, categories, specs, or wholesale lot lists inside page files. All catalog displays must load from database fetches.

### B. Zero Hardcoded Credentials & Host URLs
- **Private keys**: Database access variables, Stripe secret keys, and PayPal IDs must be loaded dynamically from env files (`process.env`).
- **Callback links**: Success/failure cancel redirects for Stripe/PayPal must construct URLs dynamically using `window.location.origin` or host headers, never hardcoded `localhost` or domain links.

### C. Zero Hardcoded Theme Assets
- **Layout Styling**: Never hardcode colors inside CSS classes (e.g. do not write `bg-[#115eb4]` or `text-[#000000]`). You must use CSS variable directives (e.g. `bg-primary`, `text-foreground`) to guarantee elements react dynamically when presets or dark modes are selected in the theme controls.

Important : Write clean code and remove the unusable stale code and further make folders in supabase bucket for images, separate folder for every product with its relevant name and id and sub folder for variants, use proper folder management inside for image storing.