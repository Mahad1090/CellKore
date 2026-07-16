'use client'

import Link from 'next/link'
import { Plus, Edit, Eye } from 'lucide-react'

const actions = [
  {
    title: 'Add New Product',
    description: 'Create a new product listing',
    href: '/admin/products/new',
    icon: Plus,
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    title: 'Manage Categories',
    description: 'View and edit all categories',
    href: '/admin/categories',
    icon: Edit,
    color: 'bg-purple-600 hover:bg-purple-700',
  },
  {
    title: 'View Orders',
    description: 'Check recent orders and status',
    href: '/admin/orders',
    icon: Eye,
    color: 'bg-green-600 hover:bg-green-700',
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href}
            href={action.href}
            className={`${action.color} rounded-lg p-6 text-white transition block group`}
          >
            <div className="flex items-start justify-between mb-2">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold mb-1">{action.title}</h3>
            <p className="text-sm opacity-90">{action.description}</p>
          </Link>
        )
      })}
    </div>
  )
}
