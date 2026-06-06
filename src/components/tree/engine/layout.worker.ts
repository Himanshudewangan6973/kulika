import dagre from 'dagre';
import { LayoutNode, LayoutEdge, TreeDirection } from '../types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const UNION_SIZE = 12;
const SPACING_X = 100;
const SPACING_Y = 140;

self.onmessage = (event: MessageEvent) => {
  const { nodes, edges, direction, focusNodeId } = event.data as {
    requestId?: number;
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    direction: TreeDirection;
    focusNodeId?: string | null;
  };
  const requestId = event.data.requestId;

  if (!nodes || nodes.length === 0) {
    self.postMessage({ requestId, nodes: [], edges: [] });
    return;
  }

  try {
    // 0. PRE-FILTERING: Remove existing virtual/union nodes from input to prevent duplicates
    const realMembers = nodes.filter(n => !(n.data as any)?.isUnion);

    // 1. DYNAMIC ROOT FOCUSING (Proband Filtering)
    let activeNodes = realMembers;
    if (focusNodeId) {
      activeNodes = performDynamicFocusing(realMembers, edges, focusNodeId, 2).nodes;
    }

    // 2. DAGRE GRAPH INITIALIZATION
    const g = new dagre.graphlib.Graph();
    g.setGraph({ 
      rankdir: direction, 
      nodesep: SPACING_X, 
      ranksep: SPACING_Y,
      marginx: 50,
      marginy: 50
    });
    g.setDefaultEdgeLabel(() => ({}));

    const nodeIds = new Set(activeNodes.map(n => n.id));
    const unionNodes: any[] = [];
    const parentPairs = new Map<string, string>(); // sortedParentIds -> unionId
    const finalEdges: LayoutEdge[] = [];

    // 3. GRAPH CONSTRUCTION WITH UNION NODES
    activeNodes.forEach(node => {
      g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
      
      const p1 = node.data.parent1Id && nodeIds.has(node.data.parent1Id) ? node.data.parent1Id : null;
      const p2 = node.data.parent2Id && nodeIds.has(node.data.parent2Id) ? node.data.parent2Id : null;

      if (p1 && p2) {
        const pairKey = [p1, p2].sort().join('_');
        let unionId = parentPairs.get(pairKey);
        
        if (!unionId) {
          unionId = `union_${pairKey}`;
          parentPairs.set(pairKey, unionId);
          unionNodes.push({ id: unionId, isUnion: true });
          g.setNode(unionId, { width: UNION_SIZE, height: UNION_SIZE });
          
          // Edges from parents to union
          g.setEdge(p1, unionId);
          g.setEdge(p2, unionId);
          
          finalEdges.push(createVirtualEdge(p1, unionId, 'parent'));
          finalEdges.push(createVirtualEdge(p2, unionId, 'parent'));
        }
        
        // Edge from union to child
        g.setEdge(unionId, node.id);
        finalEdges.push(createVirtualEdge(unionId, node.id, 'parent'));
      } else if (p1 || p2) {
        const parentId = (p1 || p2)!;
        g.setEdge(parentId, node.id);
        finalEdges.push(createVirtualEdge(parentId, node.id, 'parent'));
      }
      
      // Handle Spouses (Horizontal links in dagre can be tricky, we link them directly)
      if (node.data.spouseIds) {
        node.data.spouseIds.forEach(sId => {
          if (nodeIds.has(sId)) {
            // Only add spouse edge once
            if (node.id < sId) {
              finalEdges.push(createVirtualEdge(node.id, sId, 'spouse'));
            }
          }
        });
      }
    });

    // 4. PERFORM LAYOUT
    dagre.layout(g);

    // 5. MAP COORDINATES BACK
    const positionedNodes = activeNodes.map(node => {
      const pos = g.node(node.id);
      return { ...node, x: pos.x, y: pos.y, visible: true };
    });

    const positionedUnions = unionNodes.map(u => {
      const pos = g.node(u.id);
      return {
        id: u.id,
        x: pos.x,
        y: pos.y,
        width: UNION_SIZE,
        height: UNION_SIZE,
        data: { id: u.id, full_name: '', isUnion: true } as any,
        collapsed: false,
        visible: true
      };
    });

    // 6. MAP EDGE POINTS
    const positionedEdges = finalEdges.map(edge => {
      const dagreEdge = g.edge(edge.sourceId, edge.targetId);
      const sourcePos = g.node(edge.sourceId);
      const targetPos = g.node(edge.targetId);

      return {
        ...edge,
        source: { x: sourcePos.x, y: sourcePos.y },
        target: { x: targetPos.x, y: targetPos.y },
        bendPoints: dagreEdge?.points?.map((p: any, i: number) => ({ id: `p-${i}`, x: p.x, y: p.y })) || []
      };
    });

    self.postMessage({ 
      requestId, 
      nodes: [...positionedNodes, ...positionedUnions], 
      edges: positionedEdges 
    });

  } catch (error: any) {
    self.postMessage({ requestId, error: 'Dagre Layout failed', details: error.message });
  }
};

function createVirtualEdge(sourceId: string, targetId: string, type: any): LayoutEdge {
  return {
    id: `e-${sourceId}-${targetId}`,
    sourceId,
    targetId,
    source: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    type,
    bendPoints: []
  };
}

function performDynamicFocusing(nodes: LayoutNode[], _edges: LayoutEdge[], rootId: string, depth: number) {
  const adj = new Map<string, Set<string>>();
  
  // Build adjacency from structural parent fields rather than existing visual edges
  nodes.forEach(n => {
    const neighbors = new Set<string>();
    if (n.data.parent1Id) neighbors.add(n.data.parent1Id);
    if (n.data.parent2Id) neighbors.add(n.data.parent2Id);
    if (n.data.spouseIds) n.data.spouseIds.forEach(s => neighbors.add(s));
    
    neighbors.forEach(nb => {
      if (!adj.has(n.id)) adj.set(n.id, new Set());
      if (!adj.has(nb)) adj.set(nb, new Set());
      adj.get(n.id)!.add(nb);
      adj.get(nb)!.add(n.id);
    });
  });

  const visited = new Set<string>();
  const queue: [string, number][] = [[rootId, 0]];
  visited.add(rootId);

  while (queue.length > 0) {
    const [id, d] = queue.shift()!;
    if (d < depth) {
      const neighbors = adj.get(id);
      if (neighbors) {
        neighbors.forEach(nb => {
          if (!visited.has(nb)) {
            visited.add(nb);
            queue.push([nb, d + 1]);
          }
        });
      }
    }
  }

  return { 
    nodes: nodes.filter(n => visited.has(n.id)) 
  };
}
