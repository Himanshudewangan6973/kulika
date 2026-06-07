'use client';

import { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X, RefreshCw } from 'lucide-react';

export default function PWAUpdatePrompt() {
  const { updateAvailable, updateApp, isUpdating, dismissUpdatePrompt } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (updateAvailable && !showPrompt) {
      // Show after 2 seconds
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [updateAvailable, showPrompt]);

  if (!showPrompt || !updateAvailable) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[1001] animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-blue-100 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <RefreshCw size={24} className={isUpdating ? 'animate-spin' : ''} />
            </div>
            <button 
              onClick={() => {
                dismissUpdatePrompt();
                setShowPrompt(false);
              }} 
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <h3 className="text-xl font-black tracking-tight mb-1 relative z-10">Update Available</h3>
          <p className="text-blue-100 text-sm font-medium relative z-10">A new version of Kulika is ready</p>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 font-medium mb-6">
            We've added new features and fixed some bugs. Update now to get the best experience.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={updateApp}
              disabled={isUpdating}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Update Now'}
              {!isUpdating && <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />}
            </button>
            <button
              onClick={() => {
                dismissUpdatePrompt();
                setShowPrompt(false);
              }}
              className="w-full py-3 text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
