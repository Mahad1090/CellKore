'use client'

import { useEffect, useState } from 'react'
import { mockCMSPages } from '@/lib/mock-admin-data'
import { Edit, Trash2 } from 'lucide-react'

interface CmsPage {
  id: string
  slug: string
  title: string
  content: string | null
  updated_at: string
}

export default function AdminContentPage() {
  const [pages, setPages] = useState<CmsPage[]>(mockCMSPages)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
  })

  const fetchPages = async () => {
    // Using mock data
    setPages(mockCMSPages)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        const { error } = await supabase
          .from('cms_pages')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('cms_pages')
          .insert([formData])

        if (error) throw error
      }

      setEditingId(null)
      setFormData({ slug: '', title: '', content: '' })
      fetchPages()
    } catch (error) {
      console.error('Error saving page:', error)
      alert('Error saving page. Please try again.')
    }
  }

  const editPage = (page: CmsPage) => {
    setEditingId(page.id)
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content || '',
    })
  }

  const deletePage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return

    try {
      const { error } = await supabase.from('cms_pages').delete().eq('id', id)
      if (error) throw error
      setPages(pages.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting page:', error)
    }
  }

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">CMS Pages</h1>
          <p className="text-slate-400">Manage static content pages</p>
        </div>

        {/* Form */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editingId ? 'Edit Page' : 'Add New Page'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., about-us"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., About Us"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Content</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Page content..."
                rows={6}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                {editingId ? 'Update' : 'Create'} Page
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null)
                    setFormData({ slug: '', title: '', content: '' })
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Pages List */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">Loading pages...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No pages yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Slug</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Last Updated</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr key={page.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{page.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">{page.slug}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">
                          {new Date(page.updated_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => editPage(page)}
                            className="p-2 hover:bg-slate-600 rounded transition text-blue-400"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePage(page.id)}
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
