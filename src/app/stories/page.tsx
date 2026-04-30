import StoryArchive from '@/components/stories/StoryArchive'
import StorySubmissionForm from '@/components/stories/StorySubmissionForm'
import Link from 'next/link'

export default function StoriesPage() {
  return (
    <main className="min-h-screen bg-surface pb-20">
      <header className="bg-white border-b border-gray-200 px-6 py-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-primary hover:text-primary-dark transition-colors">
            <span className="text-xl">←</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Narrative Archive</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Oral History Preservation</p>
          </div>
        </div>
      </header>

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
              
              <div className="mt-8 p-6 bg-blue-600 rounded-2xl text-white shadow-xl">
                <h3 className="font-bold text-lg mb-2">Voice Recording</h3>
                <p className="text-sm text-blue-100 mb-4 opacity-80">Prefer speaking to typing? Use our AI-transcription tool to record oral histories.</p>
                <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-all border border-white/30">
                  🎙️ Start Recording
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
