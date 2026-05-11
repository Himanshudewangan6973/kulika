import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-surface">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col gap-12 text-center">
        <div>
          <h1 className="text-5xl font-extrabold text-primary mb-4">kulika</h1>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
            Roots of Heritage Heritage.
          </p>
          <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
            An AI-powered sanctuary for preserving family history across generations.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          <Link 
            href="/tree" 
            className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Explore Family Tree
          </Link>
          <Link 
            href="/media" 
            className="px-8 py-4 bg-amber-500 text-white rounded-xl font-bold text-lg hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Media Gallery
          </Link>
          <Link 
            href="/submit" 
            className="px-8 py-4 bg-white text-primary border-2 border-primary rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-md transform hover:-translate-y-1"
          >
            Add Member
          </Link>
          <Link 
            href="/admin/inbox" 
            className="px-8 py-4 bg-gray-100 text-gray-700 border-2 border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all shadow-sm transform hover:-translate-y-1"
          >
            Admin
          </Link>
        </div>

        <div className="w-full max-w-4xl">
          <Link href="/search" className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-green-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative px-8 py-6 bg-white ring-1 ring-gray-900/5 rounded-3xl leading-none flex items-center justify-between shadow-xl">
              <div className="flex items-center space-x-6">
                <span className="text-3xl">🔍</span>
                <div className="space-y-2 text-left">
                  <p className="text-gray-800 font-bold text-lg">Semantic Discovery</p>
                  <p className="text-gray-500 text-sm">Ask anything: &quot;Who moved to Raipur in 1960?&quot;</p>
                </div>
              </div>
              <span className="text-primary font-bold transition-all group-hover:translate-x-2">Search Registry →</span>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-4">
          <Link href="/tree" className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🌳</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Family Tree</h3>
            <p className="text-gray-500 text-sm">Interactive lineage mapping.</p>
          </Link>
          
          <Link href="/media" className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">📸</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Media Gallery</h3>
            <p className="text-gray-500 text-sm">Photos & video archives.</p>
          </Link>

          <Link href="/stories" className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-success mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">📜</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Narratives</h3>
            <p className="text-gray-500 text-sm">Oral history preservation.</p>
          </Link>

          <Link href="/timeline" className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">⏳</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Timeline</h3>
            <p className="text-gray-500 text-sm">Chronological journey.</p>
          </Link>
        </div>

        <div className="mt-12 pt-12 border-t border-gray-100 w-full">
          <p className="text-sm text-gray-400 uppercase tracking-widest">
            Phase 1: Core Features in Development
          </p>
        </div>
      </div>
    </main>
  );
}
