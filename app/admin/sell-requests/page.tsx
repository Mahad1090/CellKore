'use client'

import { useEffect, useState } from 'react'
import { mockSellRequests } from '@/lib/mock-admin-data'
import { Eye, Edit, Trash2 } from 'lucide-react'

interface SellRequest {
  id: string
  device_brand: string
  device_model: string
  condition: string
  description: string | null
  contact_phone: string | null
  contact_email: string | null
  status: string
  offered_price: number | null
  submitted_at: string
}

export default function AdminSellRequestsPage() {
  const [requests, setRequests] = useState<SellRequest[]>(mockSellRequests)
  const [loading, setLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<SellRequest | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    status: '',
    offered_price: '',
  })

  const fetchRequests = async () => {
    // Using mock data
    setRequests(mockSellRequests)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const data = {
        status: formData.status,
        offered_price: formData.offered_price ? parseFloat(formData.offered_price) : null,
      }

      const { error } = await supabase
        .from('sell_phone_requests')
        .update(data)
        .eq('id', editingId)

      if (error) throw error

      setEditingId(null)
      setFormData({ status: '', offered_price: '' })
      fetchRequests()
    } catch (error) {
      console.error('Error updating request:', error)
      alert('Error updating request. Please try again.')
    }
  }

  const startEditingRequest = (request: SellRequest) => {
    setEditingId(request.id)
    setFormData({
      status: request.status,
      offered_price: request.offered_price?.toString() || '',
    })
  }

  const deleteRequest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return

    try {
      const { error } = await supabase.from('sell_phone_requests').delete().eq('id', id)
      if (error) throw error
      setRequests(requests.filter(r => r.id !== id))
    } catch (error) {
      console.error('Error deleting request:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-900/30 text-yellow-400'
      case 'reviewed': return 'bg-blue-900/30 text-blue-400'
      case 'quoted': return 'bg-purple-900/30 text-purple-400'
      case 'contacted': return 'bg-green-900/30 text-green-400'
      case 'closed': return 'bg-red-900/30 text-red-400'
      default: return 'bg-slate-600/30 text-slate-300'
    }
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Sell Requests</h1>
          <p className="text-slate-400">Manage customer phone sell requests</p>
        </div>

        {/* Requests List */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No sell requests yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Device</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Condition</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Contact</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Offered Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Submitted</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{request.device_brand} {request.device_model}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-600 text-slate-200 capitalize">
                          {request.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {request.contact_phone && <p className="text-slate-300">{request.contact_phone}</p>}
                          {request.contact_email && <p className="text-slate-400">{request.contact_email}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{request.offered_price ? `$${request.offered_price.toFixed(2)}` : '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">
                          {new Date(request.submitted_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="p-2 hover:bg-slate-600 rounded transition text-green-400"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startEditingRequest(request)}
                            className="p-2 hover:bg-slate-600 rounded transition text-blue-400"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRequest(request.id)}
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

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold text-white mb-4">Update Request</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="quoted">Quoted</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Offered Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      name="offered_price"
                      value={formData.offered_price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setFormData({ status: '', offered_price: '' })
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold text-white mb-4">Request Details</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-400">Device</p>
                  <p className="text-white font-medium">{selectedRequest.device_brand} {selectedRequest.device_model}</p>
                </div>
                <div>
                  <p className="text-slate-400">Condition</p>
                  <p className="text-white font-medium capitalize">{selectedRequest.condition}</p>
                </div>
                <div>
                  <p className="text-slate-400">Description</p>
                  <p className="text-white">{selectedRequest.description || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Phone</p>
                  <p className="text-white">{selectedRequest.contact_phone || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Email</p>
                  <p className="text-white">{selectedRequest.contact_email || '—'}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
