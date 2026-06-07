'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { LogOut } from 'lucide-react'
import FamilySpaceSelector from '@/components/family-spaces/FamilySpaceSelector'
import { ShareButton } from '@/components/ui/ShareButton'

export default function GlobalHeader() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="w-full h-14 flex items-center justify-between px-2 md:px-8 bg-white/80 backdrop-blur-md fixed top-0 left-0 right-0 z-[1000] border-b border-slate-200/50 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <FamilySpaceSelector />
        <ShareButton 
          title="Join my family tree on kulika" 
          text="I'm documenting our family heritage on kulika. Join me!" 
          url={typeof window !== 'undefined' ? window.location.origin : ''} 
        />
      </div>
      
      {user ? (
        <div className="flex items-center gap-2 md:gap-4 bg-white p-1.5 md:p-2 pl-4 md:pl-5 pr-2 md:pr-3 rounded-full shadow-sm border border-slate-200 hover:border-indigo-100 transition-all group flex-shrink-0 ml-2">
          <div className="text-right">
            <p className="text-xs md:text-sm font-black text-slate-800 leading-tight">{user.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 md:p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors shadow-sm"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-2">
          <Link
            href="/tree"
            className="px-4 md:px-6 py-1.5 md:py-2 bg-white text-slate-600 border border-slate-200 rounded-full font-bold hover:bg-slate-50 transition-all shadow-sm text-xs md:text-sm whitespace-nowrap"
          >
            Visitor
          </Link>
          <Link
            href="/auth"
            className="px-4 md:px-6 py-1.5 md:py-2 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg text-xs md:text-sm whitespace-nowrap"
          >
            Sign In
          </Link>
        </div>
      )}
    </header>
  )
}
