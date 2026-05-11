# AI Continuation Context

## Project Purpose
"Roots of Heritage" (kulika) is a React 18 / Next.js 14 family tree visualizer capable of handling 5000+ nodes at 60fps. It supports complex family structures (adoptive, step, multi-spouse) and collaborative community submissions via an approval queue.

## Current Architecture
- **State:** Zustand (`src/components/tree/store.ts`). Atomic updates. Strict immutability.
- **Layout Engine:** Web Worker (`src/components/tree/engine/layout.worker.ts`). Uses `d3-hierarchy` (stratify, tree). Solves coordinates, handles direction (TB, BT, LR, RL), and prevents UI jank.
- **Rendering:** Hybrid. Managed by `TreeViewport.tsx`.
  - `< 1000 nodes`: `TreeSVG.tsx` + `FamilyNode.tsx` (Framer Motion DOM nodes, high interaction).
  - `> 1000 nodes`: `TreeCanvas.tsx` (Native Canvas 2D, Level of Detail (LOD) circles/images, high performance).
- **Database:** Supabase (PostgreSQL). Core table `family_members`. Advanced links in `relationships`. Path visuals in `edge_customizations`.

## Existing Systems
- **Interactions:** D3-zoom drives viewport state. Nodes have Collapsed, Hover (150ms debounce), and Expanded states.
- **Edge Editing:** Users can double-click custom lines to add draggable bend points.
- **Validation:** `AddRelativeModal.tsx` uses `react-hook-form` + `zod`.
- **Edge Cases Handled:** Circular relationship prevention (DFS), Orphan/unlinked member clustering (`VIRTUAL_ROOT`), Same-sex parent UI.

## Important Technical Decisions
- **No React Flow:** Removed due to DOM bloat. Replaced with pure D3 math + Custom React/Canvas renderers.
- **Viewport Culling:** Renderers ONLY loop through nodes/edges visible inside the current zoom/pan bounding box.
- **Image Caching:** Avatar URLs are preloaded into `HTMLImageElement` memory objects (`useImageCache.ts`) to prevent Canvas flickering.

## Current Pending Work
- **Supabase API Hookup:** `submitChange` is now connected to Supabase; `fetchRelatives` still needs implementation.
- **Multi-spouse alignment:** Visual spacing in the layout worker for members with 2+ spouses.

## Coding Conventions
1. **Never block the main thread:** Heavy math goes in `utils.ts` or workers.
2. **Immutability:** Zustand setters must return new object references.
3. **Atomic Selectors:** `useTreeStore(state => state.specificField)` only.

## How to Continue
1. Read this file.
2. Check `docs/KNOWN_ISSUES.md` and `docs/FUTURE_ROADMAP.md`.
3. If instructed to add a feature, prefer extending the Zustand store and the Layout Worker before touching the UI.
4. If writing UI, use Radix-UI primitives and Tailwind.
