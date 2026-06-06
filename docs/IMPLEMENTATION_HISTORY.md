# Implementation History

## Phase 1: Prototype (Pre-Refactor)
**What was built:** Initial project scaffolding using `react-flow-renderer` and `dagre` for layout. 
**Why it changed:** React Flow relies heavily on the DOM. As nodes surpassed 1000, React struggled with massive commit phases and DOM updates, destroying framerates. Dagre was also synchronous, causing UI freezes.

## Phase 2: Architecture Overhaul & D3 Introduction
**What was built:** React Flow was completely removed. Replaced with raw `d3-hierarchy` and `d3-zoom`. 
**Why it changed:** D3 provides pure mathematical layout computation without forcing DOM updates. 

## Phase 3: The Hybrid Renderer
**What was built:** The `TreeViewport` orchestrator, splitting rendering into `TreeSVG` (<1000 nodes) and `TreeCanvas` (>1000 nodes).
**Enhancements:** Introduced Level of Detail (LOD) rendering and Viewport Culling based on bounding boxes.

## Phase 4: Web Worker Integration
**What was built:** `layout.worker.ts`.
**Why it changed:** Even D3 math takes hundreds of milliseconds for 5000+ nodes. Moving this to a Web Worker freed the main thread, allowing the UI to show a loading state (`isCalculating`) without stuttering.

## Phase 5: High-Fidelity UI & Interactions
**What was built:** `FamilyNode.tsx` refactored using Framer Motion for smooth state transitions (Collapsed -> Hover -> Expanded). `TreeToolbar` added for zooming and styling.

## Phase 6: Advanced Relationships
**What was built:** Custom SVG path math (`path-utils.ts`) supporting bezier and orthogonal styles. Added interactive bend points via double-click on thick transparent SVG paths. Added 10+ relationship types.

## Phase 7: Edge Case Hardening
**What was built:** 
1. Depth-First Search (DFS) circular relationship detection.
2. `VIRTUAL_ROOT` and `ORPHAN_ROOT` logic in the D3 stratifier to handle disconnected families gracefully.
3. Added `TreeErrorBoundary` to catch extreme mathematical layout failures.

## Phase 8: Submission Pipeline Completion
**What was built:**
- Fully wired the `/tree` submission flow to insert pending `New Member` records into the Supabase `inbox` table.
- Normalized pending member raw data and approved tree-relatives through the admin approval route.
- Added visible pending confirmation UI for tree submissions in `TreePageClient`.

## Phase 9: Complete Heritage Knowledge Platform (Part 3 Final)
**What was built:**
- **Testing Suite:** Comprehensive unit, hook, and integration tests for claims, merging, and component behavior.
- **Mobile PWA:** Full service worker integration with offline sync, IndexedDB storage, and PWA installation prompts.
- **Admin Dashboard:** Centralized management interface for claims approval, duplicate detection, and data quality monitoring.
- **Production Hardening:** Rate limiting via Upstash Redis, security headers (CSP, HSTS), and structured logging.
- **API & Migrations:** Complete OpenAPI documentation and automated SQL migration scripts for family spaces and claims system.

## Current Unfinished Areas
- `fetchRelatives` Supabase integration remains a placeholder in the tree data slice.
- Specific fine-tuning of multi-spouse layout horizontal offsets.
