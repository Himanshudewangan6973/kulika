# Rendering Engine

## Tree Rendering Pipeline
The pipeline is designed to handle up to 5000+ nodes at 60fps.
1. **Zustand Store:** Holds `nodes` (with calculated x/y from worker), `edges`, and `viewport` state.
2. **`TreeViewport.tsx`:** The entry point. Mounts `d3.zoom` to handle touch/mouse events and updates `viewport` state in Zustand. Chooses the renderer based on `nodes.length` threshold (1000).
3. **Renderer (`TreeCanvas` or `TreeSVG`):** Reads the viewport state and redraws elements.

## Renderers

### `TreeSVG` (High Fidelity)
- **Usage:** < 1000 nodes.
- **Nodes:** Rendered as absolutely positioned React `<div>` elements utilizing Framer Motion for morphing states.
- **Edges:** Rendered as an overlay `<svg>` containing `<path>` elements.
- **Pros:** Perfect hit-testing, high accessibility, DOM events work natively.
- **Cons:** DOM size bloats, causing React commit-phase jank if nodes > 1000.

### `TreeCanvas` (Mass Visualization)
- **Usage:** >= 1000 nodes.
- **Implementation:** Native HTML5 `<canvas>` using `requestAnimationFrame`.
- **Optimization 1 - Viewport Culling:** Only loops over nodes/edges whose bounding boxes intersect the current screen rect.
- **Optimization 2 - Level of Detail (LOD):**
  - Zoom < 0.3: Tiny colored circles only.
  - Zoom < 0.8: Medium circles with initials or pre-cached images.
  - Zoom >= 0.8: Renders a placeholder block (assumes SVG focus-overlay handles details).
- **Optimization 3 - Fingerprinting:** Tracks `viewport.x`, `viewport.y`, and `viewport.zoom`. If unchanged from the last frame, it skips `ctx.clearRect` and redrawing.

## Edge Rendering
- Logic lives in `engine/path-utils.ts`.
- **Straight:** `L` SVG command.
- **Orthogonal (Elbow):** `V` and `H` commands based on midpoint.
- **Bezier:** Quadratic curve `C` with vertical offset control points.
- **Custom:** Polyline through user-defined `bendPoints`.

## Zoom/Pan System
Powered by `d3-zoom`. Bound to a container div. We map D3's internal transform object `(k, x, y)` into our Zustand `ViewportState`. This allows the UI Toolbar (React) and the Canvas (requestAnimationFrame) to share the exact same mathematical space.

## Performance Bottlenecks
- **Canvas Text Drawing:** `ctx.fillText` is surprisingly slow. LOD hides text when zoomed far out to mitigate this.
- **React Re-renders:** If `useTreeStore(state => state.nodes)` is called in a component, it re-renders every time a node moves. Must use atomic selectors (e.g. `state.expandedNode === id`).
