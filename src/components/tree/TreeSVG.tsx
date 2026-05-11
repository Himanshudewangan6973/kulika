'use client';

import React, { memo, useMemo } from 'react';
import { useTreeStore } from './store';
import FamilyNode from './FamilyNode';
import FamilyEdge from './FamilyEdge';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 250;

const TreeSVG = () => {
  const nodes = useTreeStore(state => state.nodes);
  const edges = useTreeStore(state => state.edges);
  const viewport = useTreeStore(state => state.viewport);
  const showUnlinked = useTreeStore(state => state.showUnlinked);

  // Optimization: Viewport Culling & Linkage Filtering
  const visibleNodes = useMemo(() => {
    let filteredNodes = nodes;
    
    if (!showUnlinked) {
      filteredNodes = nodes.filter(n => {
        const hasParent = n.data.parent1Id || n.data.parent2Id;
        const hasChildren = edges.some(e => e.sourceId === n.id);
        const hasSpouse = edges.some(e => (e.sourceId === n.id || e.targetId === n.id) && e.type === 'spouse');
        return hasParent || hasChildren || hasSpouse;
      });
    }

    const viewMinX = -viewport.x / viewport.zoom;
    const viewMaxX = viewMinX + window.innerWidth / viewport.zoom;
    const viewMinY = -viewport.y / viewport.zoom;
    const viewMaxY = viewMinY + window.innerHeight / viewport.zoom;

    return filteredNodes.filter(n => {
      return (
        n.x + NODE_WIDTH > viewMinX &&
        n.x - NODE_WIDTH < viewMaxX &&
        n.y + NODE_HEIGHT > viewMinY &&
        n.y - NODE_HEIGHT < viewMaxY
      );
    });
  }, [nodes, edges, viewport, showUnlinked]);

  const visibleEdges = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    return edges.filter(e => visibleNodeIds.has(e.sourceId) || visibleNodeIds.has(e.targetId));
  }, [edges, visibleNodes]);

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, left: 0, width: '100%', height: '100%', 
      pointerEvents: 'none' 
    }}>
      {/* 1. Edges rendered via SVG */}
      <svg 
        style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        {visibleEdges.map(edge => (
          <FamilyEdge key={edge.id} edge={edge} />
        ))}
      </svg>

      {/* 2. Nodes rendered via standard React/DOM for interactivity */}
      <div 
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        {visibleNodes.map(node => (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              pointerEvents: 'auto',
              transform: 'translate(-50%, -50%)' // Center node on coordinate
            }}
          >
            <FamilyNode member={node.data} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(TreeSVG);
