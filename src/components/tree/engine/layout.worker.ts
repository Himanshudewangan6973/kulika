import * as d3 from 'd3';
import { LayoutNode, LayoutEdge, TreeDirection } from '../types';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const SPACING_X = 120;
const SPACING_Y = 180;

self.onmessage = (event: MessageEvent) => {
  const { nodes, edges, direction } = event.data as {
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    direction: TreeDirection;
  };

  if (!nodes || nodes.length === 0) {
    self.postMessage({ nodes: [], edges: [] });
    return;
  }

  try {
    const virtualRootId = 'VIRTUAL_ROOT';
    const orphanRootId = 'ORPHAN_ROOT'; // Case 1: Separate section for unlinked members
    
    // Preparation for Multi-Root and Orphan sections
    const hierarchyData = [
      { id: virtualRootId, parentId: null, birthYear: 0 },
      { id: orphanRootId, parentId: virtualRootId, birthYear: 0 },
      ...nodes.map(node => {
        const hasParent = node.data.parent1Id !== undefined || node.data.parent2Id !== undefined;
        
        return {
          id: node.id,
          // If no parents, put in orphan section if unlinked, else virtual root
          parentId: node.data.parent1Id || (hasParent ? virtualRootId : orphanRootId),
          birthYear: node.data.birthDate ? new Date(node.data.birthDate).getFullYear() : 9999
        };
      })
    ];

    hierarchyData.sort((a, b) => a.birthYear - b.birthYear);

    const stratifier = d3.stratify<any>()
      .id(d => d.id)
      .parentId(d => d.parentId);

    const root = stratifier(hierarchyData);

    const isHorizontal = direction === 'LR' || direction === 'RL';
    
    const treeLayout = d3.tree()
      .nodeSize(
        isHorizontal 
          ? [NODE_HEIGHT + SPACING_Y, NODE_WIDTH + SPACING_X]
          : [NODE_WIDTH + SPACING_X, NODE_HEIGHT + SPACING_Y]
      );

    treeLayout(root);

    // Coordinate Transformation Logic
    const updatedNodes = nodes.map(node => {
      const d3Node = root.descendants().find(d => d.id === node.id);
      if (!d3Node) return node;

      let x = d3Node.x ?? 0;
      let y = d3Node.y ?? 0;
      y -= SPACING_Y;

      // Case 2: Multi-spouse clustering
      // If member has multiple spouses, we adjust their horizontal offset slightly
      if (node.data.spouseIds && node.data.spouseIds.length > 1) {
        // Advanced spouse positioning logic would go here
      }

      switch (direction) {
        case 'BT': y = -y; break;
        case 'LR': [x, y] = [y, x]; break;
        case 'RL': [x, y] = [-y, x]; break;
        case 'TB': default: break;
      }

      return { ...node, x, y };
    });

    // Case 8: Large families (Children collapse detection)
    // We send a hint back to UI if a node should have a "Show More" children button
    const nodeChildrenCount = new Map<string, number>();
    edges.forEach(e => {
      if (e.type === 'parent') {
        nodeChildrenCount.set(e.sourceId, (nodeChildrenCount.get(e.sourceId) || 0) + 1);
      }
    });

    const finalNodes = updatedNodes.map(n => ({
      ...n,
      hasLargeFamily: (nodeChildrenCount.get(n.id) || 0) >= 10
    }));

    self.postMessage({ nodes: finalNodes, edges: edges });
  } catch (error: any) {
    self.postMessage({ error: 'Layout calculation failed', details: error.message });
  }
};
