/**
 * @file src/app/tree/error.tsx
 * @description Specific error boundary for the Family Tree view.
 * Requirement: Ensures tree-specific rendering errors don't crash the entire app and allows re-attempting tree load.
 */

'use client';

import { useEffect } from 'react';
import { TreeDeciduous, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function TreeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Family Tree Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
          <TreeDeciduous size={40} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Tree Rendering Failed</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          We had trouble drawing the family tree. This can sometimes happen with complex lineages or connectivity issues.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
          >
            <RefreshCcw size={18} />
            Reload Tree
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
