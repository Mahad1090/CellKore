import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import Link from 'next/link'

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="opacity-90 mt-2">Manage your profile and preferences</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-24">
              <nav className="space-y-1 p-4">
                <Link href="#profile" className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-muted rounded-lg transition font-semibold">
                  <span className="text-lg">👤</span>
                  Profile
                </Link>
                <Link href="#orders" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition">
                  <span className="text-lg">📦</span>
                  Orders
                </Link>
                <Link href="#wishlist" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition">
                  <span className="text-lg">❤️</span>
                  Wishlist
                </Link>
                <Link href="#settings" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition">
                  <span className="text-lg">⚙️</span>
                  Settings
                </Link>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-muted rounded-lg transition">
                  <span className="text-lg">🚪</span>
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Profile Section */}
            <div id="profile" className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Profile Information</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-1">First Name</label>
                    <input type="text" defaultValue="John" className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary bg-background" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-1">Last Name</label>
                    <input type="text" defaultValue="Doe" className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary bg-background" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1">Email</label>
                  <input type="email" defaultValue="john@example.com" className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary bg-background" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1">Phone</label>
                  <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary bg-background" />
                </div>

                <div className="flex gap-4">
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold">
                    Save Changes
                  </button>
                  <button className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Section */}
            <div id="orders" className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Order History</h2>
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No orders yet</p>
                <Link href="/products" className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold">
                  Start Shopping
                </Link>
              </div>
            </div>

            {/* Address Section */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Addresses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Billing Address</h3>
                  <p className="text-sm text-muted-foreground">123 Main Street</p>
                  <p className="text-sm text-muted-foreground">New York, NY 10001</p>
                  <p className="text-sm text-muted-foreground">USA</p>
                  <button className="mt-3 px-4 py-2 text-primary hover:underline text-sm font-semibold">
                    Edit
                  </button>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Shipping Address</h3>
                  <p className="text-sm text-muted-foreground">Same as billing</p>
                  <button className="mt-3 px-4 py-2 text-primary hover:underline text-sm font-semibold">
                    Add Another Address
                  </button>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Security</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-foreground">Password</h3>
                    <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                  </div>
                  <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition font-semibold text-sm">
                    Change Password
                  </button>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Not enabled</p>
                  </div>
                  <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition font-semibold text-sm">
                    Enable
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
