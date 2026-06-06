'use client';

import { useEffect } from 'react';
import TreeViewport from './TreeViewport';
import { useTreeStore } from './store';
import { LayoutNode, LayoutEdge } from './types';
import { normalizeToUnified } from '@/lib/schemas/memberSchema';
import { resolveMemberId } from '@/lib/pending-members';

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
        let normalized;
        try {
          normalized = normalizeToUnified(member);
        } catch (e) {
          console.warn('Failed to normalize member, using raw data:', member.full_name, e);
          normalized = member;
        }
        
        return {
          id: member.id,
          x: 0, y: 0,
          width: 200,
          height: 100,
          collapsed: true,
          visible: true,
          data: {
            id: member.id,
            full_name: normalized.full_name || member.full_name || 'Unknown',
            given_name: normalized.given_name || member.given_name || '',
            middle_names: normalized.middle_names || member.middle_names || '',
            surname: normalized.surname || member.surname || '',
            preferred_display_name: normalized.preferred_display_name || member.preferred_display_name || '',
            native_name: normalized.native_name || member.native_name || '',
            community_id: normalized.community_id || member.community_id || '',
            community_override: normalized.community_override || member.community_override || '',
            name_notes: normalized.name_notes || member.name_notes || '',
            bio: normalized.bio || member.bio || '',
            birthDate: normalized.dateOfBirth || member.birth_date || member.dateOfBirth || '',
            dateOfBirth: normalized.dateOfBirth || member.birth_date || member.dateOfBirth || '',
            dateOfDeath: normalized.dateOfDeath || member.dateOfDeath || '',
            avatarUrl: normalized.profilePhotoUrl || member.profile_photo_url || member.profilePhotoUrl || null,
            profilePhotoUrl: normalized.profilePhotoUrl || member.profile_photo_url || member.profilePhotoUrl || null,
            firstName: normalized.given_name || member.given_name || (normalized.full_name || member.full_name || '').split(' ')[0] || '',
            lastName: normalized.surname || member.surname || (normalized.full_name || member.full_name || '').split(' ').slice(1).join(' ') || '',
            parent1Id: normalized.parent1Id || member.parent1_id || member.parent1Id || null,
            parent2Id: normalized.parent2Id || member.parent2_id || member.parent2Id || null,
            spouseIds: member.spouseIds || [],
            generation: member.generation || 1,
            status: member.status || normalized.status || 'Approved',
            isTemporary: Boolean(member.isTemporary),
            isLocalPreview: Boolean(member.isLocalPreview),
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
            bendPoints: [],
            isPending: node.data.status === 'Pending' || node.data.isTemporary,
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
            bendPoints: [],
            isPending: node.data.status === 'Pending' || node.data.isTemporary,
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
