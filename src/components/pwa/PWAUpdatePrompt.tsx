'use client';

import { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

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

  if (!showPrompt || isUpdating) return null;

  return (
    <div className="fixed bottom-20 right-4 max-w-sm bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Download className="text-blue-600 mt-1 flex-shrink-0" size={20} />

          <div>
            <h3 className="font-semibold text-sm mb-1">Update Available</h3>
            <p className="text-xs text-gray-600">
              A new version is available. Update now to get the latest features and fixes.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            dismissUpdatePrompt();
            setShowPrompt(false);
          }}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex gap-2 mt-4 pt-3 border-t">
        <button
          onClick={() => {
            dismissUpdatePrompt();
            setShowPrompt(false);
          }}
          className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition"
        >
          Later
        </button>
        <button
          onClick={updateApp}
          className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition"
        >
          Update Now
        </button>
      </div>
    </div>
  );
}
