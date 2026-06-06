/**
 * @file src/app/stories/page.tsx
 * @description Family narratives and oral history archive.
 * Requirement: Provides an interface for reading and submitting multi-generational stories.
 */

import StoryArchive from '@/components/stories/StoryArchive'
import StorySubmissionForm from '@/components/stories/StorySubmissionForm'
import { ScrollText } from 'lucide-react'

export default function StoriesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: History Stream */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Preserved Stories</h2>
              <p className="text-sm text-gray-500">Echoes of the past, captured for the future.</p>
            </div>
            <StoryArchive />
          </div>

          {/* Right: Submission */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-1">Record a Story</h2>
                <p className="text-sm text-gray-500">Every voice matters. Share a memory.</p>
              </div>
              <StorySubmissionForm />
              
              <div className="mt-8 p-8 bg-indigo-600 rounded-[32px] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <h3 className="font-black text-xl mb-3 relative z-10">Voice Narratives</h3>
                <p className="text-sm text-indigo-100 mb-6 opacity-90 relative z-10 leading-relaxed">
                  Prefer speaking to typing? Use our AI-transcription tool to capture oral histories directly from your voice.
                </p>
                <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black transition-all hover:bg-indigo-50 shadow-xl flex items-center justify-center gap-2">
                  <ScrollText size={20} /> Start Recording
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
