'use client'

import { useEffect, useState } from 'react'
import { DashboardStats } from '@/components/admin/dashboard-stats'
import { RecentActivity } from '@/components/admin/recent-activity'
import { QuickActions } from '@/components/admin/quick-actions'

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

// Mock data for demo purposes
const mockStats: Stats = {
  totalProducts: 45,
  activeListings: 38,
  totalCategories: 8,
  totalMarketplaces: 12,
  totalSellRequests: 23,
  pendingInquiries: 7,
  totalOrders: 156,
  wholesaleListings: 15,
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>(mockStats)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Simulate loading
    setLoading(false)
    setStats(mockStats)
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Welcome to CellKore Admin Panel</p>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Stats */}
        <>
          <DashboardStats stats={stats} />
          <RecentActivity />
        </>
      </div>
    </div>
  )
}
