/**
 * @file src/components/tree/slices/dataPersistence.ts
 * @description persistence logic and async actions for the Family Tree data slice.
 * Requirement: Decouples complex Supabase interactions and async flows from the main state slice.
 */

import { createClient } from '@/lib/supabase/client';
import { LayoutNode, LayoutEdge } from '../types';
import { normalizeToUnified } from '@/lib/schemas/memberSchema';
import { resolveMemberId } from '@/lib/pending-members';
import { detectCycle } from '../engine/utils';

const supabase = createClient();

/**
 * Handles the submission of a new member or relationship to the inbox.
 */
export async function submitChangeToInbox(
  change: any, 
  get: () => any, 
  addNodesAndEdges: (n: LayoutNode[], e: LayoutEdge[]) => void,
  showNotification: (msg: string, type?: string) => void
): Promise<boolean> {
  if (change.change_type === 'new_relationship') {
    const hasCycle = detectCycle(get().nodes, get().edges, { 
      sourceId: change.proposed_data.source_id, 
      targetId: change.proposed_data.target_id 
    });
    if (hasCycle) {
      showNotification('Circular relationship detected!', 'error');
      return false;
    }
  }

  try {
    if (!supabase) {
      return handleOfflineSubmission(change, addNodesAndEdges, showNotification);
    }

    const isNewMember = change.change_type === 'new_member' || change.change_type === 'new_member_with_relation';
    const submissionType = isNewMember ? 'New Member' : 'Relationship';

    const submitterName = change.proposed_data.submitterName || 
                         change.proposed_data.submitter_name || 
                         'System User';
    const submitterEmail = change.proposed_data.submitterEmail || 
                          change.proposed_data.submitter_email || 
                          'noreply@kulika.local';

    const rawData = isNewMember
      ? { ...change.proposed_data, submitterName, submitterEmail }
      : change.proposed_data;

    const { data, error } = await supabase.from('inbox').insert({
      submission_type: submissionType,
      raw_data: rawData,
      status: 'Pending',
      submitter_name: submitterName,
      submitter_email: submitterEmail,
    }).select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No data returned from insertion');

    const inboxEntry = data[0];
    const pendingId = `pending-${inboxEntry.id}`;

    if (isNewMember) {
      const optimistic = createOptimisticMember(change.proposed_data, pendingId);
      addNodesAndEdges([optimistic.node], optimistic.edges);
    }

    showNotification('✅ Your pending member has been added to the tree and submitted for review!', 'success');
    return true;
  } catch (err: any) {
    const errorMsg = err.error?.message || err.message || 'Submission failed. Please try again.'
    console.warn('Submission failed:', errorMsg);
    showNotification(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg, 'error');
    return false;
  }
}

/**
 * Fetches additional generations of the family tree from the database.
 */
export async function fetchGenerations(
  maxGeneration: number,
  currentNodes: LayoutNode[],
  addNodesAndEdges: (n: LayoutNode[], e: LayoutEdge[]) => void,
  setIsCalculating: (is: boolean) => void,
  showNotification: (msg: string, type?: string) => void
): Promise<number> {
  try {
    setIsCalculating(true);

    if (!supabase) {
      showNotification('All generations currently loaded in Preview Mode');
      return 0;
    }

    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .lte('generation', maxGeneration)
      .order('generation', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      showNotification('No more generations found');
      return 0;
    }

    const existingIds = new Set(currentNodes.map((n: any) => n.id));
    const newNodes = data.filter((m: any) => !existingIds.has(m.id));

    if (newNodes.length === 0) {
      showNotification('All available generations are already displayed.');
      return 0;
    }

    const nodes = data.map((member: any) => {
      const normalized = normalizeToUnified(member);
      return {
        id: member.id,
        x: 0,
        y: 0,
        width: 200,
        height: 100,
        collapsed: true,
        visible: true,
        data: {
          ...normalized,
          id: member.id,
          avatarUrl: normalized.profilePhotoUrl,
          firstName: normalized.given_name || normalized.full_name.split(' ')[0] || '',
          lastName: normalized.surname || normalized.full_name.split(' ').slice(1).join(' ') || '',
          generation: member.generation || 1,
          spouseIds: member.spouseIds || []
        }
      } as LayoutNode;
    });

    const edges: LayoutEdge[] = [];
    nodes.forEach((node: any) => {
      const p1 = node.data.parent1Id ? resolveMemberId(node.data.parent1Id) : null;
      const p2 = node.data.parent2Id ? resolveMemberId(node.data.parent2Id) : null;

      if (p1) edges.push(createEdge(p1, node.id));
      if (p2) edges.push(createEdge(p2, node.id));
    });

    addNodesAndEdges(nodes, edges);
    return newNodes.length;
  } catch (err: any) {
    console.warn('Failed to fetch more generations:', err.message);
    showNotification('Preview Mode: All generations are already displayed.');
    return 0;
  } finally {
    setIsCalculating(false);
  }
}

/**
 * Persists visual edge customizations (bend points, style) to the server.
 */
export async function saveEdgeCustomization(
  edgeId: string, 
  relationshipId: string, 
  lineStyle: string,
  edges: LayoutEdge[],
  showNotification: (msg: string, type?: string) => void
) {
  try {
    const edge = edges.find((e: LayoutEdge) => e.id === edgeId);
    if (!edge) throw new Error(`Edge ${edgeId} not found`);

    const response = await fetch('/api/tree/edge-customizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        relationshipId,
        bendPoints: edge.bendPoints,
        lineStyle
      })
    });

    if (!response.ok) {
      const result = await response.json();
      const errorMsg = result.error?.message || result.error || 'Failed to save customization'
      throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
    }

    showNotification('Edge customization saved successfully');
    return true;
  } catch (err: any) {
    console.error('Error persisting edge customization:', err);
    showNotification(err.message || 'Failed to save customization', 'error');
    return false;
  }
}

// --- Internal Helpers ---

function handleOfflineSubmission(change: any, addNodesAndEdges: any, showNotification: any) {
  const pendingId = `pending-local-${Date.now()}`;
  const optimistic = createOptimisticMember(change.proposed_data, pendingId, true);
  addNodesAndEdges([optimistic.node], optimistic.edges);
  showNotification('Preview only: member added locally because Supabase is unavailable.', 'success');
  return true;
}

function createOptimisticMember(data: any, id: string, isOffline: boolean = false) {
  const normalized = normalizeToUnified(data);
  const p1 = normalized.parent1Id ? resolveMemberId(normalized.parent1Id) : null;
  const p2 = normalized.parent2Id ? resolveMemberId(normalized.parent2Id) : null;

  const node: LayoutNode = {
    id,
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    collapsed: true,
    visible: true,
    data: {
      ...normalized,
      id,
      firstName: normalized.given_name || normalized.full_name.split(' ')[0] || '',
      lastName: normalized.surname || normalized.full_name.split(' ').slice(1).join(' ') || '',
      generation: 1,
      status: 'Pending',
      isTemporary: true,
      isLocalPreview: isOffline,
    } as any,
  };

  const edges: LayoutEdge[] = [];
  if (p1) edges.push(createEdge(p1, id, true));
  if (p2) edges.push(createEdge(p2, id, true));

  return { node, edges };
}

function createEdge(sourceId: string, targetId: string, isPending: boolean = false): LayoutEdge {
  return {
    id: `e-${sourceId}-${targetId}`,
    sourceId,
    targetId,
    source: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    type: 'parent',
    bendPoints: [],
    isPending
  };
}
