# Admin Panel Access Guide

## Fixed Issue

The admin panel was not opening because you were trying to access it on **port 3001**, but the dev server runs on **port 3000**.

## Correct URL

**Replace:** `http://localhost:3001/admin/login`  
**With:** `http://localhost:3000/admin/login`

## Access the Admin Panel

1. Open your browser and navigate to: **`http://localhost:3000/admin/login`**

2. You should see the Admin Panel login page with:
   - Blue lock icon
   - "Admin Panel" heading
   - Email and password input fields
   - Demo credentials displayed at the bottom

## Demo Credentials

- **Email:** admin@cellkore.com
- **Password:** admin123

## What's Available in the Admin Panel

After logging in, you'll have access to:

1. **Dashboard** - Overview with statistics and quick actions
2. **Products** - Full CRUD for managing phone products
3. **Categories** - Manage product categories
4. **Marketplaces** - Manage marketplace locations and contact info
5. **Wholesale** - Manage wholesale pricing tiers
6. **Sell Requests** - Track customer phone sell requests
7. **Inquiries** - Manage contact inquiries from customers
8. **Content** - Manage CMS pages and static content
9. **Orders** - View customer orders
10. **Settings** - Configure social media and app settings
11. **Analytics** - View sales analytics and metrics

## Architecture

- **Same Database:** Admin and customer website share the same Supabase database
- **Single Deployment:** Both admin and customer interfaces deploy as one Next.js app
- **Protected Routes:** Admin routes automatically redirect to login if not authenticated
- **Real-time Sync:** Changes in admin panel immediately reflect on the customer website

## Notes

- All admin routes are protected with authentication
- The admin layout includes a responsive sidebar for navigation
- Admin pages are located in `/app/admin/` directory
- Shared components are in `/components/admin/`
- Admin authentication utilities are in `/lib/admin-auth.ts`

## Troubleshooting

If you still can't access the page:

1. **Check the port:** Ensure the dev server is running on port 3000
2. **Verify the URL:** Should be `http://localhost:3000/admin/login` (not 3001)
3. **Restart the server:** Stop the dev server (`Ctrl+C`) and run `npm run dev` again
4. **Clear browser cache:** Try opening in an incognito/private window

The dev server is currently running and the admin panel is ready to use!
