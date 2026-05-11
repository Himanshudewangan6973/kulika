'use client';

import React, { useEffect } from 'react';
import TreeViewport from './TreeViewport';
import { useTreeStore } from './store';
import { LayoutNode, LayoutEdge } from './types';
import { normalizeToUnified } from '@/lib/schemas/memberSchema';
import { resolveMemberId } from '@/lib/pending-members';
import { v4 as uuidv4 } from 'uuid';

interface TreePageClientProps {
  initialMembers: any[];
}

export default function TreePageClient({ initialMembers }: TreePageClientProps) {
  const setNodes = useTreeStore(state => state.setNodes);
  const setEdges = useTreeStore(state => state.setEdges);
  const notification = useTreeStore(state => state.notification);

  useEffect(() => {
    if (initialMembers && initialMembers.length > 0) {
      const nodes: LayoutNode[] = initialMembers.map(member => {
        // Normalize all member data to unified schema
        const normalized = normalizeToUnified(member);
        
        return {
          id: member.id,
          x: 0, y: 0,
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
        };
      });

      const edges: LayoutEdge[] = [];
      nodes.forEach(node => {
        // Resolve parent IDs (converts temporary pending IDs to permanent if available)
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

      setNodes(nodes);
      setEdges(edges);
    }
  }, [initialMembers, setNodes, setEdges]);

  return (
    <div className="w-full h-[800px] relative border border-gray-200 rounded-2xl overflow-hidden shadow-inner bg-gray-50">
      {notification && (
        <div className={`absolute top-4 right-4 z-50 max-w-xs rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl transition-all ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {notification.message}
        </div>
      )}
      <TreeViewport />
    </div>
  );
}
