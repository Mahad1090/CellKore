# CellKore Admin Panel - Quick Start Guide

## 🚀 Getting Started

### Step 1: Access the Admin Panel
```
URL: http://localhost:3001/admin/login
```

### Step 2: Login with Demo Account
```
Email: admin@cellkore.com
Password: admin123
```

### Step 3: Explore the Dashboard
You'll see:
- Real-time statistics
- Recent activity feed
- Quick action buttons

## 📋 Main Features at a Glance

### Products (`/admin/products`)
Manage your entire product catalog
- **Add**: Create new products with pricing and details
- **Edit**: Update product information
- **Delete**: Remove products
- **Search**: Find products by name or SKU
- **Toggle**: Activate/deactivate products

### Categories (`/admin/categories`)
Organize products into categories
- Create category hierarchies
- Set display order
- Manage category metadata

### Wholesale (`/admin/wholesale`)
Create bulk pricing for resellers
- Set quantity minimums
- Define per-unit pricing
- Create tiered pricing structures

### Marketplaces (`/admin/marketplaces`)
Manage contact info by country
- Add WhatsApp numbers
- Store email addresses
- Save landline numbers

### Sell Requests (`/admin/sell-requests`)
Handle customer phone sell requests
- Track request status
- Record offered prices
- Manage customer contacts

### Inquiries (`/admin/inquiries`)
Respond to customer messages
- View contact form submissions
- Mark as responded
- Keep communication history

### Content (`/admin/content`)
Publish static pages
- Create About, Terms, Privacy pages
- Edit page content
- Manage page slugs

### Orders (`/admin/orders`)
Monitor customer purchases
- View all orders
- Track order status
- Monitor payment status

### Settings (`/admin/settings`)
Configure site-wide options
- Manage social media links
- Add/edit/delete links
- Toggle link visibility

### Analytics (`/admin/analytics`)
View business metrics
- Total revenue
- Average order value
- Order counts
- Customer statistics

## ⚡ Common Tasks

### Add a New Product
1. Click **Products** in sidebar
2. Click **Add Product** button
3. Fill in:
   - Product Name (required)
   - Brand
   - SKU
   - Price (required)
   - Condition (New/Refurbished/Used)
   - Description
4. Click **Create Product**

**Time**: 2-3 minutes

### Create Wholesale Pricing
1. Click **Wholesale** in sidebar
2. Click **Add Price Tier**
3. Select product
4. Set minimum quantity (e.g., 10 units)
5. Set price per unit
6. Optionally set maximum quantity
7. Click **Add Tier**

**Time**: 1-2 minutes

### Respond to Customer Inquiry
1. Click **Inquiries** in sidebar
2. View inquiry list
3. Click eye icon to see details
4. Review customer message
5. Click **Mark Responded**

**Time**: 1 minute

### Create Static Page
1. Click **Content** in sidebar
2. Click **Add New Page**
3. Enter:
   - Slug (e.g., "about-us")
   - Title (e.g., "About Us")
   - Content
4. Click **Create Page**

**Time**: 5-10 minutes

### Add Social Media Link
1. Click **Settings** in sidebar
2. Scroll to "Add New Link" section
3. Enter platform name (e.g., "Instagram")
4. Enter URL (e.g., "https://instagram.com/cellkore")
5. Click **Add Link**

**Time**: 1 minute

## 🔒 Security Tips

- **Never share** your admin login credentials
- **Change password** from default immediately (coordinate with support)
- **Log out** after each session
- **Use strong passwords** with mix of letters, numbers, and symbols
- **Report suspicious** activity immediately

## 🆘 Need Help?

### Frequently Asked Questions

**Q: How do I add a new admin user?**
A: Contact your administrator - new admin accounts must be created via database.

**Q: Can I undo a deletion?**
A: No. Always confirm before deleting. Check the confirmation dialog.

**Q: How do I change my password?**
A: Contact your administrator - password resets are managed by support team.

**Q: What if I'm locked out?**
A: Contact your administrator to reset your session.

**Q: Can I edit product specifications?**
A: Not yet in this version. Contact support for spec management.

### Troubleshooting

**Problem: Can't login**
- Verify email is correct (admin@cellkore.com for demo)
- Check password is accurate
- Clear browser cookies and try again

**Problem: Products not appearing**
- Ensure product is marked as "Active"
- Verify price is set correctly
- Check product has a category assigned

**Problem: Can't add wholesale tier**
- Ensure product is marked as "Wholesale"
- Verify minimum quantity is set
- Check price per unit is a valid number

**Problem: Page not accessible**
- Verify page slug is correct
- Ensure page is saved (no errors shown)
- Wait 10 seconds for cache to clear

## 📊 Dashboard Overview

The dashboard shows real-time:
- Total Products: All products in system
- Active Listings: Products available to customers
- Categories: Product categories
- Orders: Total customer orders
- Revenue: Total sales amount
- Pending Inquiries: Customer messages needing response

## 🎯 Best Practices

### Product Management
✓ Use descriptive product names
✓ Keep pricing competitive
✓ Write clear descriptions
✓ Update availability regularly
✓ Monitor out-of-stock products

### Customer Communication
✓ Respond to inquiries within 24 hours
✓ Provide accurate phone sell offers
✓ Update request status regularly
✓ Keep contact info current

### Content Management
✓ Proofread before publishing
✓ Keep information accurate
✓ Update regularly
✓ Use clear language

### Wholesale Operations
✓ Set competitive bulk pricing
✓ Monitor inventory levels
✓ Respond to wholesale inquiries
✓ Track wholesale orders

## 📱 Mobile Access

The admin panel works on tablets and larger phones, but is optimized for desktop. For best experience use:
- Desktop browser (Chrome, Firefox, Safari)
- Laptop or large monitor
- Full keyboard and mouse

## ⌨️ Keyboard Shortcuts

- **Tab**: Navigate between form fields
- **Enter**: Submit form (when button is focused)
- **Escape**: Close modal dialogs
- **Ctrl/Cmd + S**: Often submits forms

## 🔄 Refresh & Updates

Data updates in real-time from Supabase. To manually refresh:
- **Refresh page**: F5 or Cmd+R
- **Clear cache**: Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
- **Re-login**: Sign out and sign back in

## 📞 Support

For issues not covered here:
1. Check ADMIN_GUIDE.md for detailed documentation
2. Check ADMIN_IMPLEMENTATION.md for technical details
3. Contact your development team
4. Note error messages to provide to support

---

**Ready to go?** Navigate to `/admin/login` and start managing CellKore!

**Last Updated**: 2024
**Version**: 1.0.0
