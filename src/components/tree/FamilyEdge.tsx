'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { LayoutEdge, EdgeStyle, RelationshipType } from './types';
import { 
  getStraightPath, 
  getBezierPath, 
  getOrthogonalPath, 
  getCustomPath 
} from './engine/path-utils';
import { useTreeStore } from './store';

interface FamilyEdgeProps {
  edge: LayoutEdge;
}

const RELATIONSHIP_STYLES: Record<RelationshipType, { stroke: string; dash?: string }> = {
  parent: { stroke: '#1e293b' },
  spouse: { stroke: '#ec4899' }, // Pink for spouse
  sibling: { stroke: '#3b82f6', dash: '10,5' },
  'step-parent': { stroke: '#f97316', dash: '5,5' },
  'adoptive-parent': { stroke: '#22c55e', dash: '5,5' },
  guardian: { stroke: '#6366f1', dash: '8,4' },
  foster: { stroke: '#a855f7', dash: '2,2' },
  'in-law': { stroke: '#94a3b8', dash: '10,10' },
  unknown: { stroke: '#ef4444', dash: '2,2' },
  custom: { stroke: '#64748b', dash: '5,2' },
};

const FamilyEdge = ({ edge }: FamilyEdgeProps) => {
  const globalStyle = useTreeStore(state => state.edgeStyle);
  const addBendPoint = useTreeStore(state => state.addEdgeBendPoint);
  const removeBendPoint = useTreeStore(state => state.removeEdgeBendPoint);
  const updateBendPoint = useTreeStore(state => state.updateEdgeBendPoint);
  
  const activeStyle = edge.style || globalStyle;
  const relStyle = RELATIONSHIP_STYLES[edge.type] || RELATIONSHIP_STYLES.parent;

  const path = useMemo(() => {
    switch (activeStyle) {
      case 'straight': return getStraightPath(edge.source, edge.target);
      case 'bezier': return getBezierPath(edge.source, edge.target);
      case 'orthogonal': return getOrthogonalPath(edge.source, edge.target);
      case 'custom': return getCustomPath(edge.source, edge.target, edge.bendPoints);
      default: return getStraightPath(edge.source, edge.target);
    }
  }, [activeStyle, edge.source, edge.target, edge.bendPoints]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (activeStyle !== 'custom') return;
    e.stopPropagation();
    
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    
    const viewport = useTreeStore.getState().viewport;
    const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
    
    addBendPoint(edge.id, { x, y });
  }, [activeStyle, edge.id, addBendPoint]);

  return (
    <g className={`group ${edge.isPending ? 'opacity-50' : ''}`}>
      {/* Interaction Buffer */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="cursor-pointer"
        onDoubleClick={handleDoubleClick}
      />
      
      {/* Visible Path */}
      <path
        d={path}
        fill="none"
        stroke={relStyle.stroke}
        strokeWidth={edge.isPending ? 1.5 : 2}
        strokeDasharray={relStyle.dash}
        className={`transition-all duration-300 group-hover:stroke-blue-500 group-hover:stroke-[3px] ${edge.isPending ? 'animate-pulse' : ''}`}
      />

      {/* Relationship Tag (Only on hover or for custom/unknown) */}
      {(edge.type === 'custom' || edge.type === 'unknown') && (
        <foreignObject
          x={(edge.source.x + edge.target.x) / 2 - 30}
          y={(edge.source.y + edge.target.y) / 2 - 10}
          width={60}
          height={20}
          className="pointer-events-none"
        >
          <div className={`text-[8px] font-bold text-center rounded-full px-1 py-0.5 border shadow-sm ${
            edge.type === 'unknown' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}>
            {edge.customDescription || edge.type.toUpperCase()}
          </div>
        </foreignObject>
      )}

      {/* Bend Points */}
      {activeStyle === 'custom' && edge.bendPoints.map((p) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={4}
          className="fill-white stroke-blue-500 stroke-2 cursor-move hover:r-6 transition-all"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            removeBendPoint(edge.id, p.id);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            const handleMouseMove = (moveEvent: MouseEvent) => {
              const svg = (e.target as Element).closest('svg');
              if (!svg) return;
              const rect = svg.getBoundingClientRect();
              const viewport = useTreeStore.getState().viewport;
              
              const x = (moveEvent.clientX - rect.left - viewport.x) / viewport.zoom;
              const y = (moveEvent.clientY - rect.top - viewport.y) / viewport.zoom;
              
              updateBendPoint(edge.id, p.id, x, y);
            };
            
            const handleMouseUp = () => {
              window.removeEventListener('mousemove', handleMouseMove);
              window.removeEventListener('mouseup', handleMouseUp);
            };
            
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
          }}
        />
      ))}

      {/* Unknown Warning Marker */}
      {edge.type === 'unknown' && (
        <circle 
          cx={(edge.source.x + edge.target.x) / 2} 
          cy={(edge.source.y + edge.target.y) / 2} 
          r={6} 
          fill="#ef4444" 
        />
      )}
    </g>
  );
};

export default memo(FamilyEdge);
