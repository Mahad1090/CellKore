'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Package, ShoppingCart, MessageSquare, Phone } from 'lucide-react'

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
  icon: React.ReactNode
  color: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      setLoading(true)

      // Fetch recent products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(2)

      // Fetch recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(2)

      // Fetch recent inquiries
      const { data: inquiries } = await supabase
        .from('contact_inquiries')
        .select('id, email, submitted_at')
        .order('submitted_at', { ascending: false })
        .limit(2)

      const activities: Activity[] = []

      products?.forEach((product: any) => {
        activities.push({
          id: `product-${product.id}`,
          type: 'Product',
          description: `New product: ${product.name}`,
          timestamp: product.created_at,
          icon: <Package className="w-4 h-4" />,
          color: 'bg-blue-900/30 text-blue-400',
        })
      })

      orders?.forEach((order: any) => {
        activities.push({
          id: `order-${order.id}`,
          type: 'Order',
          description: `New order for $${order.total_amount}`,
          timestamp: order.created_at,
          icon: <ShoppingCart className="w-4 h-4" />,
          color: 'bg-green-900/30 text-green-400',
        })
      })

      inquiries?.forEach((inquiry: any) => {
        activities.push({
          id: `inquiry-${inquiry.id}`,
          type: 'Inquiry',
          description: `Contact from ${inquiry.email}`,
          timestamp: inquiry.submitted_at,
          icon: <MessageSquare className="w-4 h-4" />,
          color: 'bg-purple-900/30 text-purple-400',
        })
      })

      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setActivities(activities.slice(0, 6))
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h2 className="text-lg font-semibold text-white mb-6">Recent Activity</h2>

      {loading ? (
        <p className="text-slate-400 text-center py-4">Loading activity...</p>
      ) : activities.length === 0 ? (
        <p className="text-slate-400 text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className={`rounded-lg p-4 ${activity.color} flex items-start gap-3`}>
              <div className="mt-1">{activity.icon}</div>
              <div className="flex-1">
                <p className="font-medium text-sm">{activity.description}</p>
                <p className="text-xs opacity-75">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
