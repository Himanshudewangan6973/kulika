/**
 * @file src/app/error.tsx
 * @description Global error boundary for the Kulika application.
 * Requirement: Catches unhandled runtime errors in the UI, logs them, and provides a graceful recovery UI.
 */

'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled UI Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
          <AlertTriangle size={40} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          We encountered an unexpected error. Don&apos;t worry, your data is safe.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <RefreshCcw size={18} />
            Try Again
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            <Home size={18} />
            Return Home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left overflow-auto max-h-40">
            <p className="text-xs font-mono text-slate-400 break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
