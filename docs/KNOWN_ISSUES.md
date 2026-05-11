# Known Issues & Risks

## Existing Bugs
1. **Multi-Spouse Overlap:** If a person has multiple spouses, the D3 tree layout sometimes overlaps the spouse nodes horizontally. The offset logic in `layout.worker.ts` is currently stubbed and needs fine-tuning.
2. **Canvas Font Scaling:** At very specific zoom levels (around 0.35), the canvas text interpolation can look slightly blurry on non-Retina displays before LOD removes the text entirely.

## Architectural Concerns
1. **Zustand Store Bloat:** The `store.ts` file is handling both structural tree data, UI state, and API submission logic. It may need to be split into multiple slices (e.g., `createUIStore`, `createDataStore`) if it grows further.
2. **Worker Serialization Cost:** Sending 5000+ complex node objects back and forth between the Main Thread and the Web Worker involves JSON serialization overhead. 
   - *Risk:* If node objects gain too many nested properties, the `postMessage` transfer time might cause micro-stutters.
   - *Mitigation:* Transfer only `id`, `x`, `y`, and structural flags.

## Performance Bottlenecks
1. **Canvas `drawImage` limits:** `TreeCanvas` loops over visible nodes and calls `ctx.drawImage` for avatars. While cached, drawing thousands of bitmaps per frame drops FPS. 
   - *Mitigation:* The Viewport Culling helps, but LOD zoom thresholds might need aggressive adjustment for lower-end devices.

## Interaction Inconsistencies
1. **Bend Point Projection:** When adding a bend point on a Custom Edge, the screen-to-world coordinate math in `FamilyEdge.tsx` is basic. It might misalign slightly if the browser window is resized abruptly during a pan.

## Scalability Risks
1. **Database Recursive CTEs:** The Supabase `get_descendants` function uses recursive SQL. For a deep tree (e.g., 20+ generations), this query can become exponentially slow.

## Incomplete Implementations
1. **Supabase Integration:** The Zustand `submitChange` action now writes pending `New Member` submissions to the Supabase `inbox` table and shows a pending tree confirmation state. `fetchRelatives` still needs Supabase wiring.
2. **Tree Validation:** The `detectCycle` DFS runs in the main thread during submission. For massive subsets, it should be moved to a worker.
