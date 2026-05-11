# Project Overview: Roots of Heritage

## Purpose and Goals
"Roots of Heritage" (kulika) is a highly scalable, interactive family tree and genealogy documentation platform. Its primary goal is to preserve and visualize multi-generational family lineages, supporting massive datasets of 5000+ members without sacrificing performance or visual fidelity.

## Main Capabilities
- **High-Performance Visualization:** Renders 5000+ nodes smoothly at 60fps using a hybrid SVG/Canvas rendering pipeline.
- **Dynamic Layout Engine:** Offloads complex D3.js tree stratification and layout math to Web Workers to keep the UI responsive.
- **Advanced Relationship Management:** Supports diverse connections (Biological, Adoptive, Step, Guardian, Foster, Unknown, Custom) with distinct visual encodings and customizable paths (bezier, orthogonal, straight, custom bend points).
- **Interactive Multi-State Nodes:** Nodes morph fluidly from high-performance circles (collapsed) to fully interactive, detailed profile cards (expanded).
- **Data Integrity & Review Workflow:** Includes a robust submission queue system (`inbox`) where user additions/edits undergo administrative review.

## Technology Stack
- **Frontend Framework:** React 18, Next.js 14
- **Language:** TypeScript
- **State Management:** Zustand (atomic, decoupled architecture)
- **Math & Graphing:** D3.js (Hierarchy, Tree Layout, Zoom/Pan)
- **Rendering:** HTML Canvas API (mass nodes) + SVG (high-fidelity interactives) + DOM (React/Framer Motion nodes)
- **Animations:** Framer Motion
- **UI Components:** Radix-UI (primitives), Tailwind CSS, Lucide React (icons)
- **Database:** Supabase (PostgreSQL with RLS, Vector search, and JSONB)

## Design Philosophy
1. **Performance First:** Never block the main thread. Culling, LOD (Level of Detail), and Web Workers are non-negotiable.
2. **Graceful Degradation:** Use high-fidelity DOM elements when zoomed in or when the tree is small, but fall back to raw Canvas drawing when navigating massive datasets.
3. **Immutability:** Global state must be strictly immutable to leverage React memoization and prevent cascading re-renders.

## Intended Scalability
- **Data Level:** Indexed PostgreSQL schema supports tens of thousands of members.
- **Client Level:** Quadtree-like culling (bounding box math) limits the render loop strictly to what the user can see.
- **Memory Level:** Caches remote images (Supabase avatars) locally to prevent thrashing the network or Canvas during rendering.

## Overall System Flow
1. **Data Load:** Supabase provides initial data (`family_members`, `relationships`, `edge_customizations`).
2. **Worker Dispatch:** React sends raw data to `layout.worker.ts`.
3. **Calculation:** D3 generates hierarchical coordinates based on current layout direction (TB/BT/LR/RL).
4. **State Sync:** Worker passes coordinates back to Zustand store.
5. **Render:** `TreeViewport` orchestrates `TreeCanvas` (LOD rendering) or `TreeSVG` based on node count, mapping `d3-zoom` events to the store.
