import { LayoutNode, LayoutEdge } from '../types';

/**
 * Detects if adding a relationship would create a cycle (circular reference)
 * in the family tree using Depth-First Search (DFS).
 */
export const detectCycle = (
  nodes: LayoutNode[], 
  edges: LayoutEdge[], 
  newEdge: { sourceId: string; targetId: string }
): boolean => {
  const adj = new Map<string, string[]>();
  
  // Build adjacency list
  edges.forEach(e => {
    if (!adj.has(e.sourceId)) adj.set(e.sourceId, []);
    adj.get(e.sourceId)!.push(e.targetId);
  });
  
  // Add the proposed edge
  if (!adj.has(newEdge.sourceId)) adj.set(newEdge.sourceId, []);
  adj.get(newEdge.sourceId)!.push(newEdge.targetId);

  const visited = new Set<string>();
  const recStack = new Set<string>();

  const isCyclic = (v: string): boolean => {
    if (!visited.has(v)) {
      visited.add(v);
      recStack.add(v);

      const neighbors = adj.get(v) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && isCyclic(neighbor)) {
          return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
    }
    recStack.delete(v);
    return false;
  };

  // Check from the start of the new edge
  return isCyclic(newEdge.sourceId);
};

/**
 * Estimates birth year for sorting when date is missing.
 * Logic: Use parent's birth + 25 years, or sibling's birth - 1 year.
 */
export const estimateBirthYear = (node: LayoutNode, allNodes: LayoutNode[]): number => {
  if (node.data.birthDate) return new Date(node.data.birthDate).getFullYear();
  
  // 1. Try to find a sibling's birth year
  const siblings = allNodes.filter(n => 
    n.id !== node.id && 
    n.data.parent1Id === node.data.parent1Id && 
    node.data.parent1Id !== undefined &&
    n.data.birthDate
  );
  
  if (siblings.length > 0) {
    const years = siblings.map(s => new Date(s.data.birthDate!).getFullYear());
    return Math.min(...years) - 1; // Assume they are slightly younger than existing known siblings
  }

  // 2. Try to find a parent's birth year
  const parent = allNodes.find(n => n.id === node.data.parent1Id && n.data.birthDate);
  if (parent) {
    return new Date(parent.data.birthDate!).getFullYear() + 25; // Estimate 25 years gap
  }

  return 9999; // Final fallback
};
