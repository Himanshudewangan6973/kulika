# State Management

## Overview
State management is handled by **Zustand** (`src/components/tree/store.ts`). The architecture was heavily refactored to support atomic updates and prevent cascading re-renders across a large DOM.

## Store Structure

The state is divided into logical slices:

1. **Structural Data:** `nodes`, `edges` (The source of truth for coordinates and data).
2. **Interaction State:** `expandedNode`, `hoveredNode` (Tracks UI focus).
3. **Configuration:** `lineStyle`, `layoutDirection`, `viewport`, `showUnlinked` (Drives rendering engines).
4. **Metadata:** `pendingRelationships`, `searchQuery`, `notification`, `isCalculating` (Application-level context).

## Atomic Update Pattern
Instead of deeply nested state updates, all setters use strict immutability patterns:
\`\`\`typescript
setEdges: (update) => set((state) => ({
  edges: typeof update === 'function' ? update(state.edges) : update
}), false, 'setEdges')
\`\`\`
*(Redux DevTools are enabled for time-travel debugging).*

## Performance Considerations
- **Separation of Concerns:** Viewport state (`x`, `y`, `zoom`) updates 60 times a second during panning. It is kept in Zustand so the Canvas renderer can access it quickly via `useTreeStore.getState()` inside the `requestAnimationFrame` loop, bypassing React's render cycle completely.
- **Memoized Selectors:** Components must use granular selectors.
  *Good:* `const expandedNode = useTreeStore(state => state.expandedNode === member.id);`
  *Bad:* `const { expandedNode } = useTreeStore();` (Triggers re-render on *any* state change).

## Interaction with Web Workers
1. UI triggers `setLayoutDirection`.
2. React Hook (`useTreeLayout`) observes this via `useEffect`.
3. Hook passes current `nodes/edges` to Worker.
4. Worker processes and triggers `setNodes/setEdges`.
5. Renderers automatically react.

## Optimistic Updates
The `submitChange` function currently implements optimistic UI updates. It creates a temporary node/edge with `id: pending-<uuid>` and updates the store immediately, anticipating server success.
