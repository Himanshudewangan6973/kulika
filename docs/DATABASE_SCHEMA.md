# Database Schema: Collaborative Heritage Knowledge Platform

## Overview
The database is built on PostgreSQL via Supabase. The architecture is shifting from a flat "truth-based" model to a "claims-based" model with isolated family spaces and full audit traceability.

---

## 1. Governance & Space Isolation

### `families` (Multi-Space Support)
- **Purpose:** Segregates data into isolated family heritage environments.
- **Fields:** `id`, `name`, `slug` (unique), `privacy_level` (public/private), `founding_ancestor_id`.
- **Note:** Every record in other tables must now include a `family_id` foreign key.

### `family_roles` & `family_members_roles`
- **Purpose:** RBAC system for granular control.
- **Roles:** `platform_admin`, `family_owner`, `family_admin`, `branch_moderator`, `verified_contributor`, `public_contributor`, `visitor`.

---

## 2. Core Heritage Data

### `family_members`
- **Purpose:** Primary nodes of the tree.
- **Visibility:** Includes a `visibility_scope` field (public, family, branch, private, admin_only).
- **Indexing:** B-Tree on `parent1_id`, `parent2_id`, `generation`.

### `claims` (The Knowledge Store)
- **Purpose:** Stores verifiable data points instead of direct record edits.
- **Fields:** `subject_id`, `claim_type` (birth_date, gotra, etc.), `claim_value`, `confidence_score` (0.0-1.0), `source_type`, `status` (proposed, approved, disputed, archived).
- **Versioning:** Includes `is_current` and `superseded_by` for reversibility.

### `evidence`
- **Purpose:** Ties documents and media to specific claims to build trust.
- **Fields:** `claim_id`, `evidence_type` (document, certificate, photo), `file_url`, `trust_score`.

---

## 3. Operations & Maintenance

### `revisions` (Audit Trail)
- **Purpose:** Logs every change across all entities for full transparency and one-click reversibility.
- **Fields:** `entity_type`, `entity_id`, `field_name`, `old_value`, `new_value`, `can_undo`, `undone_at`.

### `potential_duplicates` & `merges`
- **Purpose:** Manages data quality without destructive deletions.
- **Merges:** Stores merged data in JSONB (`merged_data`) to allow for reversible merges if a mistake is made.

---

## 4. Specialized Data Structures

### `attribute_types` & `member_attributes`
- **Purpose:** Stores cultural-specific tags like Gotra, Caste, or Religion in a generic, extensible way.

### `sensitive_fields`
- **Purpose:** Stores sensitive data (contact info, medical) with field-level encryption and restricted access lists.

---

## Migration History
- **v1.0:** Basic `family_members` with parents.
- **v2.0:** Added `relationships` and `edge_customizations`.
- **v3.0 (Planned):** Full Collaborative Architecture (Families, Claims, Evidence, Revisions).

## Future Scalability
- **Ltree Migration:** For O(1) ancestor/descendant lookups if trees exceed 100k nodes.
- **Encryption:** Moving `sensitive_fields` to a dedicated vault with KMS integration.

