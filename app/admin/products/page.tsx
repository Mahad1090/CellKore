'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string | null
  brand: string | null
  base_price: number
  condition: string
  is_active: boolean
  created_at: string
}

// Mock products data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 14 Pro',
    sku: 'IP14P-001',
    brand: 'Apple',
    base_price: 999,
    condition: 'New',
    is_active: true,
    created_at: '2024-01-15',
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24',
    sku: 'SG24-001',
    brand: 'Samsung',
    base_price: 899,
    condition: 'New',
    is_active: true,
    created_at: '2024-01-14',
  },
  {
    id: '3',
    name: 'Google Pixel 8',
    sku: 'GP8-001',
    brand: 'Google',
    base_price: 799,
    condition: 'Refurbished',
    is_active: true,
    created_at: '2024-01-13',
  },
]

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts)

  useEffect(() => {
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredProducts(filtered)
  }, [searchTerm, products])

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      setProducts(products.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', id)

      if (error) throw error
      setProducts(products.map(p => p.id === id ? { ...p, is_active: !isActive } : p))
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Products</h1>
            <p className="text-slate-400">Manage all product listings</p>
          </div>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 mb-4">No products found</p>
              <Link
                href="/admin/products/new"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Create the first product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">SKU</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Condition</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{product.name}</p>
                        {product.brand && <p className="text-slate-400 text-sm">{product.brand}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">{product.sku || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">${product.base_price.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-600 text-slate-200 capitalize">
                          {product.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(product.id, product.is_active)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            product.is_active
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-2 hover:bg-slate-600 rounded transition text-blue-400"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 hover:bg-slate-600 rounded transition text-red-400"
                            title="Delete"
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
