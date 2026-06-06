import React, { useState } from 'react';
import { Network, Image, BookOpen, Settings, Search, User, Menu } from 'lucide-react';

type TabView = 'tree' | 'gallery' | 'narratives' | 'settings';

export const MobileLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('tree');

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-500/10">
      
      {/* 1. FIXED TOP APP BAR */}
      <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-1 text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            kulika.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100">
            <Search className="h-5 w-5" />
          </button>
          <button className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100">
            <User className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE APP CONTAINER */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'tree' && (
          <div className="p-4 animate-fadeIn">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Lineage Mapping</h2>
            <p className="text-sm text-slate-500 mb-4">Tap nodes to explore ancestry paths.</p>
            {/* Dynamic Tree Core Canvas Wrapper Goes Here */}
            <div className="h-96 w-full rounded-xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center text-slate-400">
              [Interactive D3 / SVG Mobile Tree Engine Active]
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="p-4 animate-fadeIn">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Media Sanctuary</h2>
            <p className="text-sm text-slate-500 mb-4">Historical visual records archive.</p>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square w-full rounded-xl bg-slate-200 shadow-inner animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'narratives' && (
          <div className="p-4 animate-fadeIn">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Oral Histories</h2>
            <div className="mt-4 space-y-3">
              <div className="h-24 w-full rounded-xl bg-white p-4 border border-slate-200 shadow-sm" />
              <div className="h-24 w-full rounded-xl bg-white p-4 border border-slate-200 shadow-sm" />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 animate-fadeIn">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">System Parameters</h2>
            <div className="mt-4 rounded-xl bg-white border border-slate-200 divide-y divide-slate-100 shadow-sm">
              <div className="p-4 text-sm font-medium text-slate-700">Account Configurations</div>
              <div className="p-4 text-sm font-medium text-slate-700">Offline Cache Synchronization</div>
            </div>
          </div>
        )}
      </main>

      {/* 3. FIXED BOTTOM TAB BAR (THUMB ZONE) */}
      <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg">
        <button 
          onClick={() => setActiveTab('tree')}
          className={`flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'tree' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Network className="h-5 w-5" />
          <span className="text-xs font-semibold tracking-wide">Tree</span>
        </button>

        <button 
          onClick={() => setActiveTab('gallery')}
          className={`flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'gallery' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Image className="h-5 w-5" />
          <span className="text-xs font-semibold tracking-wide">Gallery</span>
        </button>

        <button 
          onClick={() => setActiveTab('narratives')}
          className={`flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'narratives' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-xs font-semibold tracking-wide">Stories</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs font-semibold tracking-wide">Setup</span>
        </button>
      </nav>

    </div>
  );
};
