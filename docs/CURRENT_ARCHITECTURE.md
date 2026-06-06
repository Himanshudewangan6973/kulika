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
...
The system uses a **Synchronized Viewport** hybrid model.
...

---

## Enhanced Architecture (v3.0)
The platform is currently transitioning to a **Collaborative Heritage Knowledge Platform**. For detailed technical specifications on this evolution, see:

- **[Incremental Build Guide](./BUILD_GUIDE.md)**: A task-based implementation roadmap.
- **[Types & State Management](./ENHANCED_TYPES_STORES.md)**: Interfaces and Zustand store patterns.
- **[Components & Hooks](./ENHANCED_COMPONENTS_HOOKS.md)**: UI blueprints for confidence indicators, evidence upload, and moderation.
- **[API & Configuration](./ENHANCED_API_CONFIG.md)**: Server-side handlers for claims, duplicate detection, and middleware.
- **[Admin & User Guide](./ENHANCED_ADMIN_USER_GUIDE.md)**: Operating procedures for family owners and moderators.
- **[Testing Suite](./ENHANCED_TESTING.md)**: Strategies for component, hook, and integration testing.
- **[PWA & Offline Sync](./ENHANCED_PWA_OFFLINE.md)**: Service workers, IndexedDB management, and PWA lifecycle.
- **[Deployment & Operations](./ENHANCED_DEPLOYMENT_OPS.md)**: Docker, CI/CD with GitHub Actions, monitoring, and error handling.
- **[Security & API Hardening](./ENHANCED_SECURITY_API.md)**: Rate limiting, security headers, and OpenAPI 3.0 specification.
- **[Database Migrations](./ENHANCED_MIGRATIONS.md)**: Schema versioning and automated migration runners.

---

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
