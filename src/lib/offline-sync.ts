import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface KulikaDB extends DBSchema {
  pendingChanges: {
    key: string;
    value: {
      id: string;
      type: 'claim' | 'member' | 'story' | 'event';
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
      synced: boolean;
    };
  };
  offlineCache: {
    key: string;
    value: {
      key: string;
      data: any;
      timestamp: number;
    };
  };
}

class OfflineSyncManager {
  private db: IDBPDatabase<KulikaDB> | null = null;

  async init() {
    if (typeof window === 'undefined') return;
    
    this.db = await openDB<KulikaDB>('kulika-offline', 1, {
      upgrade(db) {
        // Pending changes store
        if (!db.objectStoreNames.contains('pendingChanges')) {
          db.createObjectStore('pendingChanges', { keyPath: 'id' });
        }

        // Offline cache store
        if (!db.objectStoreNames.contains('offlineCache')) {
          db.createObjectStore('offlineCache', { keyPath: 'key' });
        }
      },
    });
  }

  /**
   * Queue a change to be synced when online
   */
  async queueChange(
    type: 'claim' | 'member' | 'story' | 'event',
    action: 'create' | 'update' | 'delete',
    data: any
  ) {
    if (!this.db) await this.init();
    if (!this.db) return;

    const change = {
      id: `${type}-${action}-${Date.now()}`,
      type,
      action,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    await this.db!.add('pendingChanges', change);

    // Trigger background sync if available
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      (registration as any).sync.register('sync-changes');
    }

    return change;
  }

  /**
   * Get all pending changes
   */
  async getPendingChanges() {
    if (!this.db) await this.init();
    if (!this.db) return [];
    return this.db!.getAll('pendingChanges');
  }

  /**
   * Mark change as synced
   */
  async markSynced(changeId: string) {
    if (!this.db) await this.init();
    if (!this.db) return;

    const change = await this.db!.get('pendingChanges', changeId);
    if (change) {
      change.synced = true;
      await this.db!.put('pendingChanges', change);
    }
  }

  /**
   * Clear synced changes
   */
  async clearSyncedChanges() {
    if (!this.db) await this.init();
    if (!this.db) return;

    const allChanges = await this.db!.getAll('pendingChanges');
    for (const change of allChanges) {
      if (change.synced) {
        await this.db!.delete('pendingChanges', change.id);
      }
    }
  }

  /**
   * Cache data for offline access
   */
  async cacheData(key: string, data: any) {
    if (!this.db) await this.init();
    if (!this.db) return;

    await this.db!.put('offlineCache', {
      key,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string) {
    if (!this.db) await this.init();
    if (!this.db) return null;

    const item = await this.db!.get('offlineCache', key);
    return item?.data || null;
  }

  /**
   * Sync pending changes with server
   */
  async syncToServer() {
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      console.log('Offline - skipping sync');
      return;
    }

    const changes = await this.getPendingChanges();
    const unsyncedChanges = changes.filter((c) => !c.synced);

    for (const change of unsyncedChanges) {
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(change),
        });

        if (response.ok) {
          await this.markSynced(change.id);
        }
      } catch (error) {
        console.error('Sync failed for change:', change.id, error);
      }
    }

    // Clear old synced changes
    await this.clearSyncedChanges();
  }
}

export const offlineSync = new OfflineSyncManager();
