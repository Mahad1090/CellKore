'use client'

import { useEffect, useState } from 'react'
import { mockWholesaleTiers } from '@/lib/mock-admin-data'
import { Edit, Trash2, Plus } from 'lucide-react'

interface WholesaleTier {
  id: string
  product_id: string
  min_quantity: number
  max_quantity: number | null
  price_per_unit: number
  product_name?: string
}

export default function AdminWholesalePage() {
  const [tiers, setTiers] = useState<WholesaleTier[]>(mockWholesaleTiers)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    product_id: '',
    min_quantity: '',
    max_quantity: '',
    price_per_unit: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Using mock data for demo
    setTiers(mockWholesaleTiers)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const data = {
        ...formData,
        min_quantity: parseInt(formData.min_quantity),
        max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : null,
        price_per_unit: parseFloat(formData.price_per_unit),
      }

      if (editingId) {
        const { error } = await supabase
          .from('wholesale_price_tiers')
          .update(data)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('wholesale_price_tiers')
          .insert([data])

        if (error) throw error
      }

      setEditingId(null)
      setFormData({ product_id: '', min_quantity: '', max_quantity: '', price_per_unit: '' })
      fetchData()
    } catch (error) {
      console.error('Error saving tier:', error)
      alert('Error saving tier. Please try again.')
    }
  }

  const editTier = (tier: WholesaleTier) => {
    setEditingId(tier.id)
    setFormData({
      product_id: tier.product_id,
      min_quantity: tier.min_quantity.toString(),
      max_quantity: tier.max_quantity?.toString() || '',
      price_per_unit: tier.price_per_unit.toString(),
    })
  }

  const deleteTier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tier?')) return

    try {
      const { error } = await supabase.from('wholesale_price_tiers').delete().eq('id', id)
      if (error) throw error
      setTiers(tiers.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting tier:', error)
    }
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Wholesale Pricing</h1>
          <p className="text-slate-400">Manage wholesale price tiers</p>
        </div>

        {/* Form */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editingId ? 'Edit Price Tier' : 'Add Price Tier'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Product *</label>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Min Quantity *</label>
                <input
                  type="number"
                  name="min_quantity"
                  value={formData.min_quantity}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 10"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Max Quantity (optional)</label>
                <input
                  type="number"
                  name="max_quantity"
                  value={formData.max_quantity}
                  onChange={handleInputChange}
                  placeholder="e.g., 50"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Price Per Unit *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    name="price_per_unit"
                    value={formData.price_per_unit}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                {editingId ? 'Update' : 'Add'} Tier
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ product_id: '', min_quantity: '', max_quantity: '', price_per_unit: '' })
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tiers List */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">Loading tiers...</p>
            </div>
          ) : tiers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No wholesale tiers yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Min Qty</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Max Qty</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Price/Unit</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier) => (
                    <tr key={tier.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{tier.product_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">{tier.min_quantity}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">{tier.max_quantity || '∞'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">${tier.price_per_unit.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => editTier(tier)}
                            className="p-2 hover:bg-slate-600 rounded transition text-blue-400"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTier(tier.id)}
                            className="p-2 hover:bg-slate-600 rounded transition text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
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
