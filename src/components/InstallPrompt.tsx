'use client'

import { useState, useEffect } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { X, Share, PlusSquare, Download } from 'lucide-react'

export default function InstallPrompt() {
  const { canInstall, installApp, isInstalled, isIOS } = usePWAInstall()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const lastDismissed = localStorage.getItem('install-prompt-dismissed')
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    const isRecentlyDismissed = lastDismissed && (Date.now() - parseInt(lastDismissed) < sevenDaysMs)
    
    if (canInstall && !isInstalled && !isRecentlyDismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [canInstall, isInstalled])

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('install-prompt-dismissed', Date.now().toString())
  }

  if (!showPrompt || dismissed || isInstalled) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[1000] animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Download size={24} />
            </div>
            <button onClick={handleDismiss} className="text-white/60 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <h3 className="text-xl font-black tracking-tight mb-1 relative z-10">Install Kulika</h3>
          <p className="text-indigo-100 text-sm font-medium relative z-10">Get the full experience on your device</p>
        </div>

        <div className="p-6">
          {isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 font-medium">To install on your iPhone/iPad:</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600">
                    <Share size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">1. Tap the Share button in Safari</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600">
                    <PlusSquare size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">2. Select 'Add to Home Screen'</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 font-medium">
                Install our app for quick access and offline support. No store required!
              </p>
              <button
                onClick={installApp}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group"
              >
                Install Now
                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          )}
          
          <button
            onClick={handleDismiss}
            className="w-full mt-3 py-3 text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
