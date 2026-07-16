'use client'

import { Package, Tag, MapPin, ShoppingCart, Phone, MessageSquare, TrendingUp, Boxes } from 'lucide-react'

interface Stats {
  totalProducts: number
  activeListings: number
  totalCategories: number
  totalMarketplaces: number
  totalSellRequests: number
  pendingInquiries: number
  totalOrders: number
  wholesaleListings: number
}

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  trend?: string
  color: string
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className="text-xs text-green-400 mt-2">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function DashboardStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Products"
        value={stats.totalProducts}
        icon={<Package className="w-6 h-6 text-blue-400" />}
        color="bg-blue-900/30"
        trend="↑ 12 this month"
      />
      <StatCard
        title="Active Listings"
        value={stats.activeListings}
        icon={<TrendingUp className="w-6 h-6 text-green-400" />}
        color="bg-green-900/30"
        trend="↑ 8% growth"
      />
      <StatCard
        title="Categories"
        value={stats.totalCategories}
        icon={<Tag className="w-6 h-6 text-purple-400" />}
        color="bg-purple-900/30"
      />
      <StatCard
        title="Marketplaces"
        value={stats.totalMarketplaces}
        icon={<MapPin className="w-6 h-6 text-orange-400" />}
        color="bg-orange-900/30"
      />
      <StatCard
        title="Orders"
        value={stats.totalOrders}
        icon={<ShoppingCart className="w-6 h-6 text-pink-400" />}
        color="bg-pink-900/30"
      />
      <StatCard
        title="Wholesale Listings"
        value={stats.wholesaleListings}
        icon={<Boxes className="w-6 h-6 text-yellow-400" />}
        color="bg-yellow-900/30"
      />
      <StatCard
        title="Sell Requests"
        value={stats.totalSellRequests}
        icon={<Phone className="w-6 h-6 text-cyan-400" />}
        color="bg-cyan-900/30"
      />
      <StatCard
        title="Pending Inquiries"
        value={stats.pendingInquiries}
        icon={<MessageSquare className="w-6 h-6 text-red-400" />}
        color="bg-red-900/30"
      />
    </div>
  )
}
