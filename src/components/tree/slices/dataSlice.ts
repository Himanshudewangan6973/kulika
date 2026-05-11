import { LayoutNode, LayoutEdge, BendPoint } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import { detectCycle } from '../engine/utils';
import { normalizeToUnified } from '@/lib/schemas/memberSchema';
import { resolveMemberId } from '@/lib/pending-members';

const supabase = createClient();

export interface DataSlice {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  pendingRelationships: any[];
  isCalculating: boolean;
  
  setNodes: (nodes: LayoutNode[] | ((nds: LayoutNode[]) => LayoutNode[])) => void;
  setEdges: (edges: LayoutEdge[] | ((eds: LayoutEdge[]) => LayoutEdge[])) => void;
  setIsCalculating: (is: boolean) => void;
  addNodesAndEdges: (newNodes: LayoutNode[], newEdges: LayoutEdge[]) => void;
  
  // Persistence Actions
  submitChange: (change: any) => Promise<boolean>;
  fetchRelatives: (memberId: string) => Promise<void>;
  fetchMoreGenerations: (maxGeneration: number) => Promise<void>;
  persistEdgeCustomization: (edgeId: string, relationshipId: string, lineStyle?: string) => Promise<boolean>;
  
  // Edge Manipulation
  addEdgeBendPoint: (edgeId: string, point: { x: number, y: number }) => void;
  updateEdgeBendPoint: (edgeId: string, pointId: string, x: number, y: number) => void;
  removeEdgeBendPoint: (edgeId: string, pointId: string) => void;
}

export const createDataSlice: any = (set: any, get: any) => ({
  nodes: [],
  edges: [],
  pendingRelationships: [],
  isCalculating: false,

  setNodes: (update: LayoutNode[] | ((nds: LayoutNode[]) => LayoutNode[])) => set((state: any) => ({
    nodes: typeof update === 'function' ? update(state.nodes) : update
  }), false, 'data/setNodes'),

  setEdges: (update: LayoutEdge[] | ((eds: LayoutEdge[]) => LayoutEdge[])) => set((state: any) => ({
    edges: typeof update === 'function' ? update(state.edges) : update
  }), false, 'data/setEdges'),

  setIsCalculating: (isCalculating: boolean) => set({ isCalculating }, false, 'data/setIsCalculating'),

  addNodesAndEdges: (newNodes: LayoutNode[], newEdges: LayoutEdge[]) => {
    set((state: any) => {
      const existingNodeIds = new Set(state.nodes.map((n: LayoutNode) => n.id));
      const filteredNewNodes = newNodes.filter((n: LayoutNode) => !existingNodeIds.has(n.id));
      const existingEdgeIds = new Set(state.edges.map((e: LayoutEdge) => e.id));
      const filteredNewEdges = newEdges.filter((e: LayoutEdge) => !existingEdgeIds.has(e.id));
      
      return {
        nodes: [...state.nodes, ...filteredNewNodes],
        edges: [...state.edges, ...filteredNewEdges]
      }
    }, false, 'data/addNodesAndEdges');
  },

  addEdgeBendPoint: (edgeId: string, point: { x: number, y: number }) => set((state: any) => ({
    edges: state.edges.map((edge: LayoutEdge) => 
      edge.id === edgeId 
        ? { ...edge, bendPoints: [...edge.bendPoints, { id: uuidv4(), ...point }] }
        : edge
    )
  }), false, 'data/addEdgeBendPoint'),

  updateEdgeBendPoint: (edgeId: string, pointId: string, x: number, y: number) => set((state: any) => ({
    edges: state.edges.map((edge: LayoutEdge) => 
      edge.id === edgeId 
        ? { ...edge, bendPoints: edge.bendPoints.map((p: BendPoint) => p.id === pointId ? { ...p, x, y } : p) }
        : edge
    )
  }), false, 'data/updateEdgeBendPoint'),

  removeEdgeBendPoint: (edgeId: string, pointId: string) => set((state: any) => ({
    edges: state.edges.map((edge: LayoutEdge) => 
      edge.id === edgeId 
        ? { ...edge, bendPoints: edge.bendPoints.filter((p: BendPoint) => p.id !== pointId) }
        : edge
    )
  }), false, 'data/removeEdgeBendPoint'),

  submitChange: async (change: any) => {
    // Real Supabase Integration
    if (change.change_type === 'new_relationship') {
      const hasCycle = detectCycle(get().nodes, get().edges, { 
        sourceId: change.proposed_data.source_id, 
        targetId: change.proposed_data.target_id 
      });
      if (hasCycle) {
        get().showNotification('Circular relationship detected!', 'error');
        return false;
      }
    }

    try {
      if (!supabase) throw new Error('Supabase not initialized');

      // Map change_type to submission_type correctly
      // Both 'new_member' and 'new_member_with_relation' are new member submissions
      const isNewMember = change.change_type === 'new_member' || change.change_type === 'new_member_with_relation';
      const submissionType = isNewMember ? 'New Member' : 'Relationship';

      // Get submitter info
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
        try {
          const normalized = normalizeToUnified(change.proposed_data);
          const parent1Id = normalized.parent1Id ? resolveMemberId(normalized.parent1Id) : null;
          const parent2Id = normalized.parent2Id ? resolveMemberId(normalized.parent2Id) : null;

          const optimisticNode: LayoutNode = {
            id: pendingId,
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            collapsed: true,
            visible: true,
            data: {
              id: pendingId,
              firstName: normalized.firstName,
              lastName: normalized.lastName,
              avatarUrl: normalized.profilePhotoUrl ?? null,
              generation: 1,
              parent1Id: parent1Id ?? null,
              parent2Id: parent2Id ?? null,
              spouseIds: []
            }
          };

          const optimisticEdges: LayoutEdge[] = [];
          if (parent1Id) {
            optimisticEdges.push({
              id: `e-${parent1Id}-${pendingId}`,
              sourceId: parent1Id,
              targetId: pendingId,
              source: { x: 0, y: 0 },
              target: { x: 0, y: 0 },
              type: 'parent',
              bendPoints: []
            });
          }
          if (parent2Id) {
            optimisticEdges.push({
              id: `e-${parent2Id}-${pendingId}`,
              sourceId: parent2Id,
              targetId: pendingId,
              source: { x: 0, y: 0 },
              target: { x: 0, y: 0 },
              type: 'parent',
              bendPoints: []
            });
          }

          get().addNodesAndEdges([optimisticNode], optimisticEdges);
        } catch (updateError) {
          console.warn('Could not update tree state with new pending member:', updateError);
        }
      }

      console.log(`✅ Successfully submitted ${submissionType}:`, inboxEntry.id);
      get().showNotification('✅ Your pending member has been added to the tree and submitted for review!', 'success');
      return true;
    } catch (err: any) {
      console.error('❌ Submission failed:', err);
      const errorMessage = err.message || 'Failed to submit. Please check your connection and try again.';
      get().showNotification(errorMessage, 'error');
      return false;
    }
  },

  fetchRelatives: async (memberId: string) => {
    // Logic moved here for Supabase integration
  },

  fetchMoreGenerations: async (maxGeneration: number) => {
    if (!supabase) return;
    try {
      get().setIsCalculating(true);
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .lte('generation', maxGeneration)
        .order('generation', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        return;
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
            id: member.id,
            firstName: normalized.firstName,
            lastName: normalized.lastName,
            avatarUrl: normalized.profilePhotoUrl,
            generation: member.generation || 1,
            parent1Id: normalized.parent1Id,
            parent2Id: normalized.parent2Id,
            spouseIds: member.spouseIds || []
          }
        } as LayoutNode;
      });

      const edges: LayoutEdge[] = [];
      nodes.forEach((node) => {
        const p1 = node.data.parent1Id ? resolveMemberId(node.data.parent1Id) : null;
        const p2 = node.data.parent2Id ? resolveMemberId(node.data.parent2Id) : null;

        if (p1) {
          edges.push({
            id: `e-${p1}-${node.id}`,
            sourceId: p1,
            targetId: node.id,
            source: { x: 0, y: 0 },
            target: { x: 0, y: 0 },
            type: 'parent',
            bendPoints: []
          });
        }
        if (p2) {
          edges.push({
            id: `e-${p2}-${node.id}`,
            sourceId: p2,
            targetId: node.id,
            source: { x: 0, y: 0 },
            target: { x: 0, y: 0 },
            type: 'parent',
            bendPoints: []
          });
        }
      });

      get().addNodesAndEdges(nodes, edges);
    } catch (err: any) {
      console.error('Failed to fetch more generations:', err);
      get().showNotification(err.message || 'Unable to expand lineage', 'error');
    } finally {
      get().setIsCalculating(false);
    }
  },

  persistEdgeCustomization: async (edgeId: string, relationshipId: string, lineStyle: string = 'bezier') => {
    try {
      const edge = get().edges.find((e: LayoutEdge) => e.id === edgeId);
      if (!edge) {
        throw new Error(`Edge ${edgeId} not found`);
      }

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
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to save customization');
      }

      get().showNotification('Edge customization saved successfully');
      return true;
    } catch (err: any) {
      console.error('Error persisting edge customization:', err);
      get().showNotification(err.message || 'Failed to save customization', 'error');
      return false;
    }
  }
});
