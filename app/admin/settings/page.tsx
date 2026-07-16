'use client'

import { useEffect, useState } from 'react'
import { mockSocialLinks } from '@/lib/mock-admin-data'
import { Save } from 'lucide-react'

interface SocialLink {
  id: string
  platform: string
  url: string
  is_active: boolean
}

export default function AdminSettingsPage() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(mockSocialLinks)
  const [loading, setLoading] = useState(false)
  const [newLink, setNewLink] = useState({ platform: '', url: '', is_active: true })

  const fetchSocialLinks = async () => {
    // Using mock data
    setSocialLinks(mockSocialLinks)
  }

  const addSocialLink = async () => {
    if (!newLink.platform || !newLink.url) {
      alert('Please fill in all fields')
      return
    }

    try {
      const { error } = await supabase
        .from('social_links')
        .insert([newLink])

      if (error) throw error
      setNewLink({ platform: '', url: '', is_active: true })
      fetchSocialLinks()
    } catch (error) {
      console.error('Error adding social link:', error)
      alert('Error adding social link. Please try again.')
    }
  }

  const updateSocialLink = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .update({ is_active: !isActive })
        .eq('id', id)

      if (error) throw error
      fetchSocialLinks()
    } catch (error) {
      console.error('Error updating social link:', error)
    }
  }

  const deleteSocialLink = async (id: string) => {
    if (!confirm('Are you sure?')) return

    try {
      const { error } = await supabase.from('social_links').delete().eq('id', id)
      if (error) throw error
      setSocialLinks(socialLinks.filter(l => l.id !== id))
    } catch (error) {
      console.error('Error deleting social link:', error)
    }
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage site-wide settings and configurations</p>
        </div>

        {/* Social Links */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Social Links</h2>

          {/* Add New Link */}
          <div className="mb-8 pb-8 border-b border-slate-700">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Add New Link</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Platform</label>
                  <input
                    type="text"
                    value={newLink.platform}
                    onChange={(e) => setNewLink(prev => ({ ...prev, platform: e.target.value }))}
                    placeholder="e.g., Facebook, Instagram"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">URL</label>
                  <input
                    type="url"
                    value={newLink.url}
                    onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={addSocialLink}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Save className="w-4 h-4" />
                Add Link
              </button>
            </div>
          </div>

          {/* Existing Links */}
          {loading ? (
            <p className="text-slate-400 text-center py-4">Loading links...</p>
          ) : socialLinks.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No social links added yet</p>
          ) : (
            <div className="space-y-3">
              {socialLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition">
                  <div>
                    <p className="text-white font-medium">{link.platform}</p>
                    <p className="text-slate-400 text-sm truncate">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateSocialLink(link.id, link.is_active)}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        link.is_active
                          ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                          : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                      }`}
                    >
                      {link.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => deleteSocialLink(link.id)}
                      className="px-3 py-1 rounded text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Site Info */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mt-6">
          <h2 className="text-lg font-semibold text-white mb-4">Admin Information</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Admin Panel Version</span>
              <span className="text-white font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Database</span>
              <span className="text-white font-medium">Supabase PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Updated</span>
              <span className="text-white font-medium">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
