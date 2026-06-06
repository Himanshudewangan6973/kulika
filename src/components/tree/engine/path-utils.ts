import { Point, BendPoint } from '../types';

export const getStraightPath = (source: Point, target: Point): string => {
  return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
};

export const getBezierPath = (source: Point, target: Point): string => {
  const dy = target.y - source.y;
  const controlPoint1 = { x: source.x, y: source.y + dy / 2 };
  const controlPoint2 = { x: target.x, y: target.y - dy / 2 };
  
  return `M ${source.x} ${source.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${target.x} ${target.y}`;
};

export const getOrthogonalPath = (source: Point, target: Point): string => {
  const midY = source.y + (target.y - source.y) / 2;

  // Vertical Step (TB)
  if (Math.abs(target.y - source.y) > Math.abs(target.x - source.x)) {
    return `M ${source.x} ${source.y} V ${midY} H ${target.x} V ${target.y}`;
  } 
  
  // Horizontal Step (LR)
  const midX = source.x + (target.x - source.x) / 2;
  return `M ${source.x} ${source.y} H ${midX} V ${target.y} H ${target.x}`;
};

export const getCustomPath = (source: Point, target: Point, bendPoints: BendPoint[]): string => {
  if (bendPoints.length === 0) return getStraightPath(source, target);
  
  let path = `M ${source.x} ${source.y}`;
  bendPoints.forEach(p => {
    path += ` L ${p.x} ${p.y}`;
  });
  path += ` L ${target.x} ${target.y}`;
  
  return path;
};
