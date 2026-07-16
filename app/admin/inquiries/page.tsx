'use client'

import { useEffect, useState } from 'react'
import { mockInquiries } from '@/lib/mock-admin-data'
import { Trash2, Eye } from 'lucide-react'

interface Inquiry {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  country: string | null
  status: string
  submitted_at: string
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>(mockInquiries)
  const [loading, setLoading] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)

  const fetchInquiries = async () => {
    // Using mock data
    setInquiries(mockInquiries)
  }

  const markAsResponded = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ status: 'responded' })
        .eq('id', id)

      if (error) throw error
      fetchInquiries()
    } catch (error) {
      console.error('Error updating inquiry:', error)
    }
  }

  const deleteInquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return

    try {
      const { error } = await supabase.from('contact_inquiries').delete().eq('id', id)
      if (error) throw error
      setInquiries(inquiries.filter(i => i.id !== id))
    } catch (error) {
      console.error('Error deleting inquiry:', error)
    }
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Contact Inquiries</h1>
          <p className="text-slate-400">Manage customer inquiries from the contact form</p>
        </div>

        {/* Inquiries List */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">Loading inquiries...</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No inquiries yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Country</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Submitted</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{inquiry.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">{inquiry.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-600 text-slate-200">
                          {inquiry.country || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          inquiry.status === 'new'
                            ? 'bg-yellow-900/30 text-yellow-400'
                            : 'bg-green-900/30 text-green-400'
                        }`}>
                          {inquiry.status === 'new' ? 'New' : 'Responded'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">
                          {new Date(inquiry.submitted_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedInquiry(inquiry)}
                            className="p-2 hover:bg-slate-600 rounded transition text-blue-400"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {inquiry.status === 'new' && (
                            <button
                              onClick={() => markAsResponded(inquiry.id)}
                              className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition"
                            >
                              Mark Responded
                            </button>
                          )}
                          <button
                            onClick={() => deleteInquiry(inquiry.id)}
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

        {/* Details Modal */}
        {selectedInquiry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold text-white mb-4">Inquiry Details</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-400">Name</p>
                  <p className="text-white font-medium">{selectedInquiry.name}</p>
                </div>
                <div>
                  <p className="text-slate-400">Email</p>
                  <p className="text-white">{selectedInquiry.email}</p>
                </div>
                <div>
                  <p className="text-slate-400">Phone</p>
                  <p className="text-white">{selectedInquiry.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Country</p>
                  <p className="text-white">{selectedInquiry.country || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Message</p>
                  <p className="text-white whitespace-pre-wrap">{selectedInquiry.message}</p>
                </div>
                <div className="flex gap-2">
                  {selectedInquiry.status === 'new' && (
                    <button
                      onClick={() => {
                        markAsResponded(selectedInquiry.id)
                        setSelectedInquiry(null)
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition"
                    >
                      Mark Responded
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedInquiry(null)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
