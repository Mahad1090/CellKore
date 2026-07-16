'use client'

import { useEffect, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { mockMarketplaces } from '@/lib/mock-admin-data'

interface ContactInfo {
  id: string
  country: string
  whatsapp?: string | null
  email?: string | null
  landline?: string | null
}

export default function AdminMarketplacesPage() {
  const [contacts, setContacts] = useState<ContactInfo[]>(mockMarketplaces)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    country: '',
    whatsapp: '',
    email: '',
    landline: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        const { error } = await supabase
          .from('country_contact_info')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('country_contact_info')
          .insert([formData])

        if (error) throw error
      }

      setEditingId(null)
      setFormData({ country: '', whatsapp_number: '', email: '', landline: '' })
      fetchContacts()
    } catch (error) {
      console.error('Error saving contact:', error)
      alert('Error saving contact. Please try again.')
    }
  }

  const editContact = (contact: ContactInfo) => {
    setEditingId(contact.id)
    setFormData({
      country: contact.country,
      whatsapp_number: contact.whatsapp_number || '',
      email: contact.email || '',
      landline: contact.landline || '',
    })
  }

  const deleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const { error } = await supabase.from('country_contact_info').delete().eq('id', id)
      if (error) throw error
      setContacts(contacts.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting contact:', error)
    }
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Marketplace Contact Info</h1>
          <p className="text-slate-400">Manage contact information for each country</p>
        </div>

        {/* Form */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editingId ? 'Edit Contact Info' : 'Add Contact Info'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Country *</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Country</option>
                <option value="US">United States (US)</option>
                <option value="CA">Canada (CA)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">WhatsApp Number</label>
              <input
                type="tel"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contact@cellkore.com"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Landline</label>
              <input
                type="tel"
                name="landline"
                value={formData.landline}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                {editingId ? 'Update' : 'Add'} Contact
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ country: '', whatsapp_number: '', email: '', landline: '' })
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Contacts List */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No contacts yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Country</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">WhatsApp</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Landline</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{contact.country}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">{contact.whatsapp_number || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">{contact.email || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">{contact.landline || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => editContact(contact)}
                            className="p-2 hover:bg-slate-600 rounded transition text-blue-400"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteContact(contact.id)}
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
