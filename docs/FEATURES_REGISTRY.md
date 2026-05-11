# Features Registry

## Implemented Features

### 1. Hybrid Rendering Engine
- **Purpose:** Scale tree to 5000+ nodes.
- **Status:** Complete.
- **Files:** `TreeViewport.tsx`, `TreeCanvas.tsx`, `TreeSVG.tsx`
- **Dependencies:** D3, React.

### 2. Multi-Directional Layout
- **Purpose:** Support TB, BT, LR, RL orientations.
- **Status:** Complete.
- **Files:** `layout.worker.ts`, `useTreeLayout.ts`, `TreeToolbar.tsx`.

### 3. Off-Thread Processing (Web Worker)
- **Purpose:** Prevent UI freezing during layout calculations.
- **Status:** Complete.
- **Files:** `layout.worker.ts`, `useTreeLayout.ts`.

### 4. Multi-State Interactive Nodes
- **Purpose:** Provide deep information without cluttering the global view.
- **Status:** Complete (Collapsed, Hover, Expanded states).
- **Files:** `FamilyNode.tsx`.
- **Dependencies:** Framer Motion, Lucide React.

### 5. Advanced Relationship Management
- **Purpose:** Support modern family structures and customized connections.
- **Status:** Complete (10+ types, visual encoding).
- **Files:** `FamilyEdge.tsx`, `types/index.ts`, `AddRelationshipModal.tsx`.

### 6. Edge Customization
- **Purpose:** Allow users to manually bend and style lines.
- **Status:** Complete.
- **Files:** `path-utils.ts`, `FamilyEdge.tsx`, `TreeToolbar.tsx`.

### 7. Circular Relationship Detection (DFS)
- **Purpose:** Prevent infinite loops in family hierarchies.
- **Status:** Complete.
- **Files:** `engine/utils.ts`, `store.ts`.

### 8. Viewport Culling & LOD
- **Purpose:** Maximize FPS by skipping rendering of off-screen or tiny elements.
- **Status:** Complete.
- **Files:** `TreeCanvas.tsx`, `TreeSVG.tsx`.

## Partially Implemented / Stubbed Features

### 1. Supabase Syncing
- **Purpose:** Sync local Zustand state with the PostgreSQL database.
- **Status:** Partial. The `submitChange` function is now wired to Supabase inbox writes and the tree confirmation flow works, but the `fetchRelatives` backend path is still a stub.
- **Files:** `store.ts`, `slices/dataSlice.ts`.

### 2. Multi-Spouse Layout Handling
- **Purpose:** Properly align multiple spouses side-by-side.
- **Status:** Partial. D3 stratify logic handles it basically, but specific visual spacing offsets are stubbed in the worker.
- **Files:** `layout.worker.ts`.

## Planned Features

### 1. Real-time Collaboration
- **Purpose:** Allow multiple users to edit the tree simultaneously.
- **Dependencies:** Supabase Realtime subscriptions.

### 2. Minimap Navigation
- **Purpose:** High-level orientation window.
- **Dependencies:** Separate low-detail canvas synchronized to main viewport.

### 3. Export to PDF/Image
- **Purpose:** Allow users to print their lineage.

## Experimental Systems

### 1. Image Pre-Caching
- **Purpose:** Prevent canvas flicker by loading `HTMLImageElement`s into a `Map` before rendering.
- **Status:** Experimental. Working well but may need memory limits if 5000+ distinct high-res avatars are loaded.
- **Files:** `hooks/useImageCache.ts`.
