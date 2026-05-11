import { describe, it, expect } from 'vitest';
import { detectCycle, estimateBirthYear } from './utils';
import { LayoutNode, LayoutEdge } from '../types';

describe('Genealogy Engine Utilities', () => {
  const mockNodes: LayoutNode[] = [
    { id: '1', data: { firstName: 'Grandpa', generation: 1, birthDate: '1900-01-01' } } as any,
    { id: '2', data: { firstName: 'Father', generation: 2, parent1Id: '1', birthDate: '1930-01-01' } } as any,
    { id: '3', data: { firstName: 'Son', generation: 3, parent1Id: '2' } } as any,
  ];

  const mockEdges: LayoutEdge[] = [
    { sourceId: '1', targetId: '2', type: 'parent' } as any,
    { sourceId: '2', targetId: '3', type: 'parent' } as any,
  ];

  describe('Circular Relationship Detection (DFS)', () => {
    it('should allow valid parent-child relationships', () => {
      const newEdge = { sourceId: '3', targetId: '4' }; // Adding a grandson
      expect(detectCycle(mockNodes, mockEdges, newEdge)).toBe(false);
    });

    it('should detect direct parent-child circularity', () => {
      const newEdge = { sourceId: '2', targetId: '1' }; // Making father the parent of grandpa
      expect(detectCycle(mockNodes, mockEdges, newEdge)).toBe(true);
    });

    it('should detect multi-generational circularity', () => {
      const newEdge = { sourceId: '3', targetId: '1' }; // Son becomes parent of grandpa
      expect(detectCycle(mockNodes, mockEdges, newEdge)).toBe(true);
    });
  });

  describe('Birth Year Estimation', () => {
    it('should return exact year if date exists', () => {
      expect(estimateBirthYear(mockNodes[0], mockNodes)).toBe(1900);
    });

    it('should estimate based on parent (+25 years)', () => {
      const nodeWithNoDate = mockNodes[2]; // Son of '2' (born 1930)
      expect(estimateBirthYear(nodeWithNoDate, mockNodes)).toBe(1955);
    });

    it('should fallback to 9999 for completely unlinked nodes', () => {
      const orphanNode = { id: 'x', data: { firstName: 'Orphan' } } as any;
      expect(estimateBirthYear(orphanNode, [])).toBe(9999);
    });
  });
});
