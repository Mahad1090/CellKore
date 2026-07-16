'use client'

import { useEffect, useState } from 'react'
import { mockAnalytics } from '@/lib/mock-admin-data'
import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react'

interface Analytics {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  totalCustomers: number
  newCustomersThisMonth: number
  topProducts: Array<{ name: string; sales: number }>
  ordersByStatus: Record<string, number>
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics>(mockAnalytics)
  const [loading, setLoading] = useState(false)

  const fetchAnalytics = async () => {
    // Using mock data
    setAnalytics(mockAnalytics as Analytics)
  }

  if (loading) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-400 text-center py-8">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-slate-400">Business insights and performance metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-white">
                  ${analytics?.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-900/30">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-white">{analytics?.totalOrders}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-900/30">
                <ShoppingCart className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Average Order Value</p>
                <p className="text-3xl font-bold text-white">
                  ${analytics?.averageOrderValue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-900/30">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-white">{analytics?.totalCustomers}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-900/30">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Order Status Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(analytics?.ordersByStatus || {}).map(([status, count]) => (
              <div key={status} className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1 capitalize">{status}</p>
                <p className="text-2xl font-bold text-white">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mt-6">
          <h2 className="text-lg font-semibold text-white mb-6">Revenue Trend</h2>
          <div className="h-64 flex items-center justify-center bg-slate-700/30 rounded-lg">
            <p className="text-slate-400">Chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}
