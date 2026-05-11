# Database Schema

## Overview
The database is built on PostgreSQL via Supabase. It uses Row Level Security (RLS) to ensure that only authenticated users can submit data, and only admins can approve or permanently delete records.

## Core Tables

### 1. `family_members`
- **Purpose:** Primary nodes of the tree.
- **Key Fields:** `full_name`, `gender`, `date_of_birth`, `lineage`, `status`, `parent1_id`, `parent2_id`, `generation`.
- **Indexing:** B-Tree on `parent1_id`, `parent2_id`, `generation`. GIN on `search_vector`.

### 2. `relationships` (Advanced)
- **Purpose:** Handles non-standard linkages.
- **Fields:** `source_id`, `target_id`, `type` (enum: adoptive, step, guardian, etc.), `is_pending`.
- **Constraints:** `source_id != target_id`, unique active relationship per pair/type.

### 3. `edge_customizations`
- **Purpose:** Stores visualization state so tree modifications persist.
- **Fields:** `relationship_id`, `bend_points` (JSONB), `line_style` (straight, bezier, orthogonal, custom).

### 4. `inbox`
- **Purpose:** The submission queue for all community-added data.
- **Fields:** `submission_type`, `status` (Pending, Approved, Rejected), `raw_data` (JSONB).

## Relationships & Junctions
- **`marriages`:** Links two `family_members` with start/end dates.
- **`media_members` / `story_members`:** Links members to rich content (photos, stories).

## Triggers & Functions
- **`set_generation()`:** Automatically calculates a member's `generation` integer upon insert based on their parents' highest generation + 1.
- **`get_descendants()` / `get_ancestors()`:** Recursive CTEs for retrieving lineage sub-trees.

## Migration History
- **v1.0:** Basic `family_members` with `parent1_id`/`parent2_id` columns.
- **v2.0 (20240506000000):** Introduced `relationships` and `edge_customizations` to support complex family structures and persistent path drawing.

## Future Scalability Considerations
- If `family_members` exceeds 100,000 rows, the recursive CTEs (`get_descendants`) may become slow. Caching tree paths (Materialized Paths or Ltree) might be necessary.
- The `edge_customizations.bend_points` JSONB column could grow large; consider pruning orphaned points.
