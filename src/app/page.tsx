/**
 * @file src/app/page.tsx
 * @description The landing page for Kulika, serving as the main entry point to all key features.
 * Requirement: Provides a professional, visually appealing dashboard for users to explore their heritage.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { useFamilySpaceStore } from '@/store/familySpaceStore'
import { 
  TreeDeciduous, 
  Image as ImageIcon, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  ScrollText, 
  Hourglass,
  ChevronRight,
  Map as MapIcon,
  Globe
} from 'lucide-react'
import OnboardingOverlay from '@/components/family-spaces/OnboardingOverlay'
import CommunityPrompt from '@/components/auth/CommunityPrompt'

export default function Home() {
  const { user } = useAuth()
  const { currentSpace, loading: isSpaceLoading } = useFamilySpaceStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50">
      <OnboardingOverlay />
      <CommunityPrompt />

      <div className="max-w-6xl w-full px-6 py-12 pb-24 flex flex-col items-center text-center">
        <div className="mb-16">
          <h1 className="text-6xl font-black text-slate-900 tracking-tight mb-4">
            kulika<span className="text-indigo-600">.</span>
          </h1>
          <p className="text-2xl font-medium text-slate-500 max-w-2xl mx-auto tracking-tight">
            Roots of Heritage
          </p>
          <div className="w-20 h-1.5 bg-indigo-500/20 rounded-full mx-auto mt-6 mb-12"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12 max-w-3xl mx-auto w-full px-4">
            {user?.community_id && mounted && (
              <div className="flex-1 bg-white px-8 py-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center animate-in fade-in slide-in-from-left-4 duration-700 hover:shadow-md transition-all group">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                  <Globe size={28} />
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1 leading-none">Your Community</p>
                  <h2 className="text-xl font-black text-slate-800 leading-none">{user.community_name}</h2>
                </div>
              </div>
            )}

            {currentSpace && mounted ? (
              <div className="flex-1 bg-white px-8 py-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center animate-in fade-in slide-in-from-right-4 duration-700 hover:shadow-md transition-all group">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                  <TreeDeciduous size={28} />
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1 leading-none">Active Tree</p>
                  <h2 className="text-xl font-black text-slate-800 leading-none">{currentSpace.name}</h2>
                </div>
              </div>
            ) : !isSpaceLoading && user && mounted && (
              <div className="flex-1 bg-amber-50 border border-amber-200 rounded-[32px] p-8 animate-bounce shadow-lg flex flex-col items-center">
                 <h3 className="text-amber-900 font-black mb-2">No Family Tree Found</h3>
                 <p className="text-amber-700 text-xs font-bold text-center leading-relaxed">
                   Please select an existing family or create a new one from the header to begin.
                 </p>
              </div>
            )}
          </div>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            An AI-powered sanctuary for preserving family history across generations. 
            Discover, document, and share your lineage with ease.
          </p>
        </div>

        {/* Primary Discovery Feature */}
        <div className="w-full max-w-4xl mb-8">
          <Link href="/search" className="group block relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-teal-400 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative px-6 py-5 bg-white border border-slate-100 rounded-3xl flex items-center justify-between shadow-xl shadow-slate-200/50 hover:border-indigo-100 transition-all">
              <div className="flex items-center space-x-5 text-left">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Search size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Semantic Discovery</h3>
                  <p className="text-sm text-slate-500 italic">Ask anything: &quot;Who moved to Raipur in 1960?&quot;</p>
                </div>
              </div>
              <div className="flex items-center text-indigo-600 font-bold group-hover:translate-x-1 transition-transform text-sm">
                Search Registry <ChevronRight className="ml-1" size={16} />
              </div>
            </div>
          </Link>
        </div>

        {/* Core Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full mb-10">
          <FeatureCard 
            href={mounted && currentSpace?.id ? `/tree?communityId=${currentSpace.id}` : "/tree"}
            title="Family Tree"
            desc="Lineage mapping"
            icon={<TreeDeciduous size={20} />}
            color="bg-emerald-50 text-emerald-600"
            hoverColor="hover:border-emerald-200"
          />
          <FeatureCard 
            href={mounted && currentSpace?.id ? `/media?communityId=${currentSpace.id}` : "/media"}
            title="Media Gallery"
            desc="Photos & videos"
            icon={<ImageIcon size={20} />}
            color="bg-amber-50 text-amber-600"
            hoverColor="hover:border-amber-200"
          />
          <FeatureCard 
            href={mounted && currentSpace?.id ? `/stories?communityId=${currentSpace.id}` : "/stories"}
            title="Narratives"
            desc="Oral histories"
            icon={<ScrollText size={20} />}
            color="bg-sky-50 text-sky-600"
            hoverColor="hover:border-sky-200"
          />
          <FeatureCard 
            href={mounted && currentSpace?.id ? `/timeline?communityId=${currentSpace.id}` : "/timeline"}
            title="Timeline"
            desc="Heritage voyage"
            icon={<Hourglass size={20} />}
            color="bg-purple-50 text-purple-600"
            hoverColor="hover:border-purple-200"
          />
          <FeatureCard 
            href={mounted && currentSpace?.id ? `/analytics?communityId=${currentSpace.id}` : "/analytics"}
            title="Migration Map"
            desc="Geographic paths"
            icon={<MapIcon size={20} />}
            color="bg-rose-50 text-rose-600"
            hoverColor="hover:border-rose-200"
          />
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap justify-center gap-3 py-6 border-t border-slate-200 w-full max-w-4xl">
          <Link 
            href={mounted && currentSpace?.id ? `/submit?communityId=${currentSpace.id}` : "/submit"} 
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 text-sm"
          >
            <UserPlus size={18} />
            Add Member
          </Link>
          <Link 
            href={mounted && currentSpace?.id ? `/admin/inbox?communityId=${currentSpace.id}` : "/admin/inbox"} 
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm text-sm"
          >
            <ShieldCheck size={18} />
            Admin Panel
          </Link>
        </div>

        <footer className="mt-12 text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-widest font-black text-slate-500">
              Roots of Dewangan Heritage OS
            </p>
            <p className="text-[10px] font-bold">
              Developed by <span className="text-indigo-500">Dewangan Tech Community</span> • Support: <a href="mailto:support@dewangan.org" className="hover:underline">support@dewangan.org</a>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({ href, title, desc, icon, color, hoverColor }: any) {
  return (
    <Link 
      href={href} 
      className={`p-5 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-all group ${hoverColor} hover:shadow-md`}
    >
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-sm font-black text-slate-800 mb-1">{title}</h3>
      <p className="text-slate-400 text-[10px] leading-tight font-medium">{desc}</p>
    </Link>
  )
}
