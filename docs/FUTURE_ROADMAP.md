# Future Roadmap

## Immediate Technical Priorities
1. **Supabase Integration:** `submitChange` is now wired to actual Supabase inbox writes; the remaining task is to hook `fetchRelatives` into the database.
2. **Multi-Spouse Layout Fine-Tuning:** The D3 layout worker needs enhanced offset logic to place multiple spouses gracefully next to a central node without line overlapping.

## Scalability Ideas
- **Server-Side Tree Pruning:** Right now, the client loads generations 1-3. We need infinite-scrolling/lazy-loading for the tree, where expanding a node fetches generation N+1 dynamically.
- **Ltree Migration:** If tree traversal becomes slow, migrate PostgreSQL from recursive CTEs to the `ltree` extension for O(1) ancestor/descendant lookups.

## Missing Features
- **Minimap:** A small UI widget in the bottom corner showing the current viewport rectangle relative to the entire tree bounding box.
- **PDF/Image Export:** Implement `html2canvas` or a similar tool to let users download a high-res rendering of their current viewport.

## Technical Debt & Refactoring
- **Canvas/SVG Overlap:** Currently, `TreeCanvas` and `TreeSVG` duplicate some culling logic. This bounding-box math should be extracted into a shared hook (e.g., `useViewportCulling`).
- **Worker Messaging:** The Web Worker bridge in `useTreeLayout` is untyped. Needs a strict request/response message wrapper.

## AI-Assisted Genealogy Ideas
- **Auto-Linking:** Run semantic comparisons on `bio_summary` and `search_vector` to suggest potential unknown relationships (e.g., "These two people lived in the same village in 1940").
- **Photo Extraction:** Use AI to detect faces in bulk-uploaded media and automatically suggest tags for family members.

## Mobile Improvements
- Add "double tap to fit screen".
- Implement native-feeling bottom sheets for the `AddRelativeModal` on smaller screens.
