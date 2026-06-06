/**
 * @file src/components/tree/engine/pathfinder.ts
 * @description Utility for finding the shortest ancestral/relationship path between two members.
 * Requirement: Supports the "Bloodline Shortest-Path" feature to identify complex cousin/in-law relations.
 */

import { LayoutNode, LayoutEdge } from '../types';

export interface PathStep {
  memberId: string;
  relation: string;
}

export function findRelationshipPath(
  nodes: LayoutNode[],
  _edges: LayoutEdge[],
  startId: string,
  endId: string
): PathStep[] | null {
  const adj = new Map<string, { neighborId: string, type: string }[]>();

  // Build bidirectional adjacency map from member structural data
  nodes.forEach(n => {
    if (!adj.has(n.id)) adj.set(n.id, []);
    
    // Parents
    if (n.data.parent1Id) {
      adj.get(n.id)!.push({ neighborId: n.data.parent1Id, type: 'Parent' });
      if (!adj.has(n.data.parent1Id)) adj.set(n.data.parent1Id, []);
      adj.get(n.data.parent1Id)!.push({ neighborId: n.id, type: 'Child' });
    }
    if (n.data.parent2Id) {
      adj.get(n.id)!.push({ neighborId: n.data.parent2Id, type: 'Parent' });
      if (!adj.has(n.data.parent2Id)) adj.set(n.data.parent2Id, []);
      adj.get(n.data.parent2Id)!.push({ neighborId: n.id, type: 'Child' });
    }
    
    // Spouses
    if (n.data.spouseIds) {
      n.data.spouseIds.forEach(sId => {
        adj.get(n.id)!.push({ neighborId: sId, type: 'Spouse' });
        if (!adj.has(sId)) adj.set(sId, []);
        adj.get(sId)!.push({ neighborId: n.id, type: 'Spouse' });
      });
    }
  });

  // BFS for shortest path
  const queue: { id: string, path: PathStep[] }[] = [{ id: startId, path: [{ memberId: startId, relation: 'Self' }] }];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;

    if (id === endId) return path;

    const neighbors = adj.get(id) || [];
    for (const { neighborId, type } of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({
          id: neighborId,
          path: [...path, { memberId: neighborId, relation: type }]
        });
      }
    }
  }

  return null;
}

/**
 * Calculates the materialized ancestor path for every node in the graph.
 * This is an expensive O(N*D) operation but enables O(1) relationship checks later.
 */
export function calculateAncestorClosure(nodes: LayoutNode[]): Record<string, string[]> {
  const ancestorMap: Record<string, string[]> = {};
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  function getAncestors(id: string, visited: Set<string> = new Set()): string[] {
    if (ancestorMap[id]) return ancestorMap[id];
    if (visited.has(id)) return []; // Loop detection

    const node = nodeMap.get(id);
    if (!node) return [];

    visited.add(id);
    const p1 = node.data.parent1Id;
    const p2 = node.data.parent2Id;

    const ancestors = new Set<string>();
    if (p1) {
      ancestors.add(p1);
      getAncestors(p1, visited).forEach(a => ancestors.add(a));
    }
    if (p2) {
      ancestors.add(p2);
      getAncestors(p2, visited).forEach(a => ancestors.add(a));
    }

    ancestorMap[id] = Array.from(ancestors);
    return ancestorMap[id];
  }

  nodes.forEach(n => getAncestors(n.id));
  return ancestorMap;
}
