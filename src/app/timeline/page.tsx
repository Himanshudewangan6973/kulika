import TimelineView from '@/components/timeline/TimelineView'
import Link from 'next/link'

export default function TimelinePage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-6 py-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-primary hover:text-primary-dark transition-colors">
            <span className="text-xl">←</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historical Timeline</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Generational Journey</p>
          </div>
        </div>
      </header>

      <div className="p-12 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900">The Roots of Heritage</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            A chronological voyage through our collective history, marking every milestone, birth, and achievement that shaped our family today.
          </p>
        </div>

        <TimelineView />

        <div className="mt-20 p-12 bg-white rounded-3xl border border-gray-100 shadow-xl text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-primary mb-6">
            <span className="text-3xl">🏁</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">To Be Continued...</h3>
          <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
            The timeline grows with every new generation. Help us fill the gaps by adding more events and stories to our digital sanctuary.
          </p>
          <Link href="/stories" className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg">
            Add New Event
          </Link>
        </div>
      </div>
    </main>
  )
}
