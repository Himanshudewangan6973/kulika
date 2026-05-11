'use client';

import React, { useEffect, useRef, memo } from 'react';
import { useTreeStore } from './store';
import { getCachedImage } from './hooks/useImageCache';

const TreeCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodes = useTreeStore(state => state.nodes);
  const edges = useTreeStore(state => state.edges);
  const viewport = useTreeStore(state => state.viewport);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let animationFrameId: number;
    let lastState = '';

    const render = () => {
      // Optimization: Avoid expensive redraws if viewport hasn't changed
      const currentState = `\${viewport.x},\${viewport.y},\${viewport.zoom}`;
      if (currentState === lastState) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastState = currentState;

      ctx.clearRect(0, 0, rect.width, rect.height);
      
      const showUnlinked = useTreeStore.getState().showUnlinked;
      let filteredNodes = nodes;
      let filteredEdges = edges;

      if (!showUnlinked) {
        filteredNodes = nodes.filter(n => {
          const hasParent = n.data.parent1Id || n.data.parent2Id;
          const hasChildren = edges.some(e => e.sourceId === n.id);
          const hasSpouse = edges.some(e => (e.sourceId === n.id || e.targetId === n.id) && e.type === 'spouse');
          return hasParent || hasChildren || hasSpouse;
        });
        const nodeIds = new Set(filteredNodes.map(n => n.id));
        filteredEdges = edges.filter(e => nodeIds.has(e.sourceId) || nodeIds.has(e.targetId));
      }

      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);

      const viewMinX = -viewport.x / viewport.zoom;
      const viewMaxX = viewMinX + rect.width / viewport.zoom;
      const viewMinY = -viewport.y / viewport.zoom;
      const viewMaxY = viewMinY + rect.height / viewport.zoom;

      ctx.lineWidth = 2 / viewport.zoom;
      ctx.strokeStyle = '#94a3b8';
      
      filteredEdges.forEach(edge => {
        if (
           (edge.source.x > viewMinX && edge.source.x < viewMaxX && edge.source.y > viewMinY && edge.source.y < viewMaxY) ||
           (edge.target.x > viewMinX && edge.target.x < viewMaxX && edge.target.y > viewMinY && edge.target.y < viewMaxY)
        ) {
          ctx.beginPath();
          ctx.moveTo(edge.source.x, edge.source.y);
          ctx.lineTo(edge.target.x, edge.target.y);
          ctx.stroke();
        }
      });

      filteredNodes.forEach(node => {
        if (node.x > viewMinX && node.x < viewMaxX && node.y > viewMinY && node.y < viewMaxY) {
          if (viewport.zoom < 0.3) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#cbd5e1';
            ctx.fill();
            ctx.stroke();
          } else if (viewport.zoom < 0.8) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            
            const img = getCachedImage(node.data?.avatarUrl);
            if (img && img.complete) {
              ctx.save();
              ctx.clip();
              ctx.drawImage(img, node.x - 15, node.y - 15, 30, 30);
              ctx.restore();
            } else {
              ctx.fillStyle = '#3b82f6';
              ctx.font = '10px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(node.data?.firstName?.[0] || '?', node.x, node.y);
            }

            ctx.fillStyle = '#1e293b';
            ctx.font = `${12 / viewport.zoom}px Arial`;
            ctx.fillText(node.data?.firstName || '', node.x, node.y + 25);
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(node.x - 15, node.y - 15, 30, 30);
          }
        }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, edges, viewport]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} 
    />
  );
};

export default memo(TreeCanvas);
