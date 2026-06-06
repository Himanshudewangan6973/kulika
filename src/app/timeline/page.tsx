/**
 * @file src/app/timeline/page.tsx
 * @description Generational journey timeline page.
 * Requirement: Provides a chronological voyage through family history, milestones, and achievements.
 */

import TimelineView from '@/components/timeline/TimelineView'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function TimelinePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="p-8 md:p-12 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">The Roots of Heritage</h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            A chronological voyage through our collective history, marking every milestone, birth, and achievement that shaped our family today.
          </p>
          <div className="w-20 h-1.5 bg-indigo-500 rounded-full mx-auto mt-8"></div>
        </div>

        <TimelineView />

        <div className="mt-20 p-12 bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-8 rotate-3">
            <Plus size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4">Help us fill the timeline</h3>
          <p className="text-slate-500 max-w-md mb-10 leading-relaxed">
            Every story matters. Help us document the missing pieces of our family history for future generations.
          </p>
          <Link href="/submit" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3">
            <Plus size={20} /> Add New Event
          </Link>
        </div>
      </div>
    </main>
  )
}
