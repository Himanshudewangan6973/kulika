/**
 * @file src/components/pwa/OfflineSyncProvider.tsx
 * @description Client component to initialize the offline sync manager on app load.
 * Requirement: Sets up IndexedDB and event listeners for background synchronization when online.
 */

'use client';

import { useEffect } from 'react';
import { offlineSync } from '@/lib/offline-sync';

export default function OfflineSyncProvider() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      offlineSync.init().catch(console.error);

      const handleOnline = () => {
        console.log('App is online. Attempting background sync...');
        offlineSync.syncToServer().catch(console.error);
      };

      window.addEventListener('online', handleOnline);

      // Attempt initial sync if already online
      if (navigator.onLine) {
        offlineSync.syncToServer().catch(console.error);
      }

      return () => {
        window.removeEventListener('online', handleOnline);
      };
    }
  }, []);

  return null;
}
