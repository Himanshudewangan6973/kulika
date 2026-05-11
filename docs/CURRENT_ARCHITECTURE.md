# Current Architecture

## Folder Structure (Visualization Engine)
\`\`\`text
src/components/tree/
├── engine/                 # Core math, layout, and workers
│   ├── layout.worker.ts    # D3 Tree solver (runs off-main-thread)
│   ├── path-utils.ts       # SVG/Canvas path generators (bezier, elbow, custom)
│   ├── utils.ts            # DFS circular detection, estimation logic
│   └── validation.ts       # Zod schemas for data integrity
├── hooks/
│   ├── useTreeLayout.ts    # Orchestrates Worker + Zustand bridge
│   └── useImageCache.ts    # Memory cache for canvas avatars
├── types/
│   └── index.ts            # Shared domain & visual types
├── TreeViewport.tsx        # D3-Zoom orchestrator & Hybrid Switcher
├── TreeCanvas.tsx          # High-performance mass renderer (>1000 nodes)
├── TreeSVG.tsx             # Interactive high-fidelity renderer (<1000 nodes)
├── FamilyNode.tsx          # Framer Motion multi-state UI component
├── FamilyEdge.tsx          # SVG Edge with bend point interactions
├── TreeToolbar.tsx         # Global UI controls (zoom, layout, styles)
├── AddRelativeModal.tsx    # Radix UI creation form
└── store.ts                # Zustand global state
\`\`\`

## Rendering Architecture
The system uses a **Synchronized Viewport** hybrid model.
1. **D3-Zoom:** Bound to an invisible div to handle pan/zoom gestures smoothly.
2. **Hybrid Switcher (`TreeViewport.tsx`):**
   - **`TreeSVG`:** Renders `<svg>` for lines and absolute-positioned `<div>`s for nodes. Perfect for small trees where DOM interaction is needed.
   - **`TreeCanvas`:** Renders raw pixels using `requestAnimationFrame`. Employs **Level of Detail (LOD)** (circles -> images/text -> placeholders) depending on zoom scale.

## D3 Integration
D3 is used purely for math, not DOM manipulation.
- `d3.stratify()`: Converts flat database rows into hierarchy (handling `VIRTUAL_ROOT` for orphans).
- `d3.tree()`: Solves spatial coordinates avoiding overlaps.
- `d3.zoom()`: Captures wheel/touch events.

## Data Flow & Event System
1. Action (e.g., Change Direction) -> Zustand Store -> State Update.
2. Hook (`useTreeLayout`) detects state change -> Dispatches to Web Worker.
3. Web Worker calculates -> Dispatches back to Main Thread -> Zustand Store updates `nodes/edges`.
4. Renderers (`TreeCanvas`/`TreeSVG`) read new coordinates and repaint automatically.
5. All interactive UI elements (Nodes/Edges) call `e.stopPropagation()` to prevent hijacking the global D3 pan/zoom events.

## Interaction System
- **Nodes:** Debounced hover (150ms) prevents flickering. Syncs with global `expandedNode` state.
- **Edges:** Thick invisible hit-boxes (`stroke-width: 16`) allow easy double-clicking to add bend points.
- **Modals:** Built with Radix-UI for accessibility and portal-rendering to escape z-index traps.
