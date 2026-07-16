'use client'

import { useEffect, useState } from 'react'
import { mockOrders } from '@/lib/mock-admin-data'
import { Eye } from 'lucide-react'

interface Order {
  id: string
  marketplace: string
  status: string
  payment_status: string
  total_amount: number
  created_at: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [loading, setLoading] = useState(false)

  const fetchOrders = async () => {
    // Using mock data
    setOrders(mockOrders)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/30 text-yellow-400'
      case 'paid': return 'bg-green-900/30 text-green-400'
      case 'processing': return 'bg-blue-900/30 text-blue-400'
      case 'shipped': return 'bg-purple-900/30 text-purple-400'
      case 'delivered': return 'bg-green-900/30 text-green-400'
      case 'cancelled': return 'bg-red-900/30 text-red-400'
      default: return 'bg-slate-600/30 text-slate-300'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return 'bg-red-900/30 text-red-400'
      case 'paid': return 'bg-green-900/30 text-green-400'
      case 'refunded': return 'bg-blue-900/30 text-blue-400'
      case 'failed': return 'bg-red-900/30 text-red-400'
      default: return 'bg-slate-600/30 text-slate-300'
    }
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Orders</h1>
          <p className="text-slate-400">View all customer orders</p>
        </div>

        {/* Orders List */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Marketplace</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Payment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4">
                        <p className="text-white font-mono text-sm">{order.id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-600 text-slate-200">
                          {order.marketplace}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">${order.total_amount.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button className="p-2 hover:bg-slate-600 rounded transition text-blue-400">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
