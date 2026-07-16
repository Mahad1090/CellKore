# CellKore Admin Panel Guide

## Overview

The CellKore Admin Panel is a comprehensive management system that allows administrators to control all aspects of the website without needing technical knowledge. It's built with Next.js and Supabase PostgreSQL.

## Features

### Authentication & Security
- Secure admin login system with email and password
- Role-based access control (Super Admin, Editor, Support)
- Protected routes that redirect unauthorized users to login
- Session management via Supabase Auth

### Dashboard
- Real-time statistics and analytics
- Quick action buttons for common tasks
- Recent activity feed showing latest products, orders, and inquiries
- Key metrics visualization

### Product Management
- **Add/Edit/Delete Products**: Full CRUD operations for products
- **SKU Management**: Track products with unique stock keeping units
- **Pricing Control**: Set base prices and manage pricing
- **Product Status**: Toggle products active/inactive for customer visibility
- **Wholesale Flagging**: Mark products as wholesale items
- **Condition Tracking**: Classify products as New, Refurbished, or Used

### Category Management
- Create and organize product categories
- Set category display order
- Manage category metadata
- Active/inactive status control

### Marketplace Management
- Manage contact information for different countries (US, CA)
- Store WhatsApp numbers, email addresses, and landline numbers
- Centralized contact management for customer support

### Wholesale System
- **Price Tier Management**: Create bulk pricing tiers
- **Quantity-based Pricing**: Set minimum quantities and price per unit
- **Flexible Pricing**: Optional maximum quantities for tier ranges
- **Product Association**: Link wholesale tiers to specific products

### Sell Requests Management
- **View Customer Requests**: See all phone sell requests
- **Status Tracking**: Monitor request lifecycle (Submitted → Reviewed → Quoted → Contacted → Closed)
- **Price Offers**: Record offered prices for customer phones
- **Contact Information**: Store and manage customer details

### Contact Inquiries
- **Inquiry Management**: View all customer contact form submissions
- **Status Tracking**: Mark inquiries as New or Responded
- **Response Tracking**: Keep organized records of communications
- **Quick Access**: View full inquiry details in modal windows

### Content Management
- **CMS Pages**: Create and edit static pages (About, Terms, Privacy, etc.)
- **Page Slugs**: URL-friendly page identifiers
- **Content Editor**: Rich text editing for page content
- **Publication Control**: Active/inactive status for pages

### Settings
- **Social Links Management**: Add and manage social media links
- **Platform Management**: Support for multiple social platforms
- **Activity Control**: Enable/disable social links
- **Link Verification**: Active status indicators

### Orders Management
- **Order Viewing**: See all customer orders
- **Order Details**: Review order amounts, statuses, and payment info
- **Status Breakdown**: Pending, Processing, Shipped, Delivered, Cancelled
- **Payment Tracking**: Track payment status (Unpaid, Paid, Refunded, Failed)

### Analytics
- **Revenue Metrics**: Total revenue and average order value
- **Order Analytics**: Total orders and status breakdown
- **Customer Insights**: Total customer count
- **Performance Dashboard**: Visual representation of key metrics

## Access & Login

### Demo Credentials
- **Email**: admin@cellkore.com
- **Password**: admin123

### Accessing the Admin Panel
1. Navigate to `/admin/login`
2. Enter your admin credentials
3. You'll be redirected to the dashboard if authentication is successful

### Creating New Admin Accounts
Admin accounts must be created directly in the Supabase database:

```sql
INSERT INTO admin_users (full_name, email, password_hash, role) 
VALUES ('Admin Name', 'admin@email.com', 'hashed_password', 'editor');
```

## Sidebar Navigation

The admin panel sidebar provides quick access to:

- **Dashboard** - Overview and statistics
- **Products** - Product management
- **Categories** - Category management
- **Marketplaces** - Contact information
- **Wholesale** - Wholesale pricing tiers
- **Sell Requests** - Customer phone sell requests
- **Inquiries** - Contact form submissions
- **Content** - CMS page management
- **Analytics** - Business metrics and insights
- **Settings** - Site configuration

## Workflow Examples

### Adding a New Product

1. Go to **Products** → **Add Product**
2. Fill in product details:
   - Product Name (required)
   - Brand
   - SKU (optional but recommended)
   - Category
   - Condition (New/Refurbished/Used)
   - Base Price (required)
   - Description
   - Location
3. Set Active status and Wholesale flag if needed
4. Click **Create Product**

### Managing Wholesale Pricing

1. Go to **Wholesale** → **Add Price Tier**
2. Select a product (must be marked as wholesale)
3. Set minimum quantity and price per unit
4. Optional: Set maximum quantity for tiered pricing
5. Click **Add Tier**

### Responding to a Customer Inquiry

1. Go to **Inquiries**
2. Click the eye icon to view inquiry details
3. Review customer message and contact information
4. Click **Mark Responded** when you've contacted the customer
5. Status changes from New to Responded

### Creating Static Content

1. Go to **Content** → **Add New Page**
2. Enter slug (e.g., "about-us")
3. Enter page title (e.g., "About Us")
4. Add page content
5. Click **Create Page**

The page will be accessible at `/pages/{slug}`

## Database Structure

The admin panel uses Supabase PostgreSQL with the following key tables:

- `admin_users` - Admin account information and roles
- `products` - Product catalog
- `categories` - Product categories
- `product_marketplaces` - Product availability by country
- `product_specifications` - Product specs (display size, storage, etc.)
- `product_variants` - Product color/storage variants
- `wholesale_price_tiers` - Bulk pricing rules
- `sell_phone_requests` - Customer phone sell requests
- `contact_inquiries` - Website contact form submissions
- `country_contact_info` - Marketplace contact information
- `cms_pages` - Static content pages
- `social_links` - Social media links
- `orders` - Customer orders

## Best Practices

### Product Management
- Always use descriptive product names
- Keep SKUs consistent and meaningful
- Set accurate pricing to avoid customer confusion
- Mark inactive products when they're out of stock
- Use high-quality product descriptions

### Wholesale Operations
- Verify wholesale pricing is competitive
- Monitor quantity minimums to avoid overstock
- Update pricing tiers regularly
- Keep track of wholesale customer requests

### Customer Communication
- Respond to inquiries promptly
- Keep phone sell request offers competitive
- Update request status as you progress through the workflow
- Document all communications

### Content Management
- Keep page content accurate and up-to-date
- Use clear, professional language
- Review content before publishing
- Maintain consistent branding

## Security & Permissions

### Role Levels
- **Super Admin**: Full access to all features
- **Editor**: Can manage products, categories, and content
- **Support**: Can view inquiries and manage customer communications

### Best Practices
- Change default admin password immediately
- Use strong, unique passwords
- Don't share admin login credentials
- Log out after each session
- Review admin activity regularly

## Troubleshooting

### Can't Login
- Verify email address is correct
- Check password is accurate
- Ensure account exists in admin_users table
- Contact your database administrator if issues persist

### Products Not Showing
- Verify product is marked as Active
- Check product belongs to a category
- Ensure product price is set correctly
- Verify product_marketplaces associations exist

### Wholesale Tiers Not Working
- Verify product is marked as wholesale
- Check tier quantity ranges don't overlap
- Ensure prices are correctly formatted
- Verify product exists before adding tier

## Support

For technical support or issues:
1. Check this guide for common solutions
2. Review your browser console for error messages
3. Check Supabase dashboard for database issues
4. Contact your development team for assistance

---

**Version**: 1.0.0
**Last Updated**: 2024
**Built with**: Next.js 16, React 19, Supabase, Tailwind CSS
