/**
 * Pending Member ID Management
 * 
 * Handles the mapping between temporary pending member IDs and their eventual database IDs.
 * This solves the problem where relationships created to pending members would break when approved.
 */

import { v4 as uuidv4 } from 'uuid'

interface PendingMemberMap {
  tempId: string;       // Temporary UUID
  inboxId: string;      // Inbox submission ID
  permanentId?: string; // Real database ID (after approval)
}

const STORAGE_KEY = 'kulika_pending_member_map'

/**
 * Get the current pending member ID mapping from localStorage
 */
export function getPendingMemberMap(): Map<string, PendingMemberMap> {
  if (typeof window === 'undefined') return new Map();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Map();
    
    const data = JSON.parse(stored);
    return new Map(Object.entries(data));
  } catch (e) {
    console.warn('Failed to load pending member map:', e);
    return new Map();
  }
}

/**
 * Save the pending member ID mapping to localStorage
 */
function savePendingMemberMap(map: Map<string, PendingMemberMap>) {
  if (typeof window === 'undefined') return;
  
  try {
    const data = Object.fromEntries(map);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save pending member map:', e);
  }
}

/**
 * Create a new temporary ID for a pending member
 */
export function createPendingMemberId(inboxId: string): string {
  const map = getPendingMemberMap();
  const tempId = `pending-${uuidv4()}`;
  
  map.set(tempId, {
    tempId,
    inboxId
  });
  
  savePendingMemberMap(map);
  return tempId;
}

/**
 * Link a temporary ID to its permanent database ID (after approval)
 */
export function linkPermanentId(tempId: string, permanentId: string) {
  const map = getPendingMemberMap();
  const entry = map.get(tempId);
  
  if (entry) {
    entry.permanentId = permanentId;
    map.set(tempId, entry);
    savePendingMemberMap(map);
  }
}

/**
 * Get the permanent ID for a temporary pending ID
 * Returns the input if it's not a pending ID
 */
export function resolveMemberId(memberId: string): string {
  if (!memberId.startsWith('pending-')) {
    return memberId;
  }
  
  const map = getPendingMemberMap();
  const entry = map.get(memberId);
  
  return entry?.permanentId || memberId;
}

/**
 * Clean up a temporary ID after approval
 */
export function removePendingMemberId(tempId: string) {
  const map = getPendingMemberMap();
  map.delete(tempId);
  savePendingMemberMap(map);
}

/**
 * Check if a member ID is pending (temporary)
 */
export function isPendingMemberId(memberId: string): boolean {
  return memberId.startsWith('pending-');
}
