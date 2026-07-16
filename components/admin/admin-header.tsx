'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/contexts/admin-context'
import { LogOut, User, ChevronDown } from 'lucide-react'

export function AdminHeader() {
  const router = useRouter()
  const { adminUser, signOut } = useAdmin()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = async () => {
    await signOut()
    router.push('/admin/login')
  }

  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-white">CellKore Admin</h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-700 transition"
        >
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">{adminUser?.name}</p>
            <p className="text-xs text-slate-400 capitalize">Administrator</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 z-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-600 rounded-lg transition text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
