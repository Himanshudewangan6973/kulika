'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTreeStore } from '@/components/tree/store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, ChevronRight } from 'lucide-react';

export default function GlobalWorkGuard() {
  const activeWork = useTreeStore(state => state.activeWork);
  const setActiveWork = useTreeStore(state => state.setActiveWork);
  const pathname = usePathname();
  
  const [interruptedWork, setInterruptedWork] = useState<{
    message: string;
    type: string;
    path: string;
  } | null>(null);

  // Track the previous pathname to detect actual navigation
  const [lastPathname, setLastPathname] = useState(pathname);

  // Detect when user navigates away while work is active
  useEffect(() => {
    // If the path changed while work was active, it's an interruption
    if (activeWork && pathname !== lastPathname) {
      setInterruptedWork({
        message: activeWork.message,
        type: activeWork.type,
        path: lastPathname // Store where they WERE
      });
      // Clear the global work state since we've "interrupted" it by navigating
      setActiveWork(null);
    }
    
    // Always sync the last known path
    if (pathname !== lastPathname) {
      setLastPathname(pathname);
    }
  }, [pathname, lastPathname, activeWork, setActiveWork]);

  if (!interruptedWork) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-24 right-6 left-6 md:left-auto md:right-6 md:w-96 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-rose-100 z-[2000] p-5 flex gap-4 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
        
        <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center bg-rose-50 text-rose-600">
          <ShieldAlert size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">
              Interrupted {interruptedWork.type}
            </span>
            <button onClick={() => setInterruptedWork(null)} className="text-slate-300 hover:text-slate-500">
              <X size={16} />
            </button>
          </div>
          <p className="text-sm font-bold text-slate-800 leading-tight mb-3">
            You navigated away while "{interruptedWork.message}" was in progress.
          </p>
          <div className="flex items-center gap-3 relative z-20">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Dismissing interruption alert');
                setInterruptedWork(null);
              }}
              className="text-xs font-black text-rose-600 flex items-center gap-1 hover:gap-2 transition-all cursor-pointer bg-rose-50/50 px-3 py-1.5 rounded-lg active:scale-95"
            >
              Acknowledge <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
