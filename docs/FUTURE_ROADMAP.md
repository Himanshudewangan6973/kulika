# Future Roadmap: The Collaborative Heritage Knowledge Platform

## Strategic Vision Shift
"Roots of Heritage" (kulika) is evolving from a single, global family tree application into a **Collaborative Heritage Knowledge Platform**. The core philosophy shifts from "storing the absolute truth" to "storing verifiable claims, evidence, and preserving uncertainty."

### Core Principles for Future Development
1. **Preserve Original Information:** Never destroy history. Store claims, not just "the truth".
2. **Store Uncertainty:** Do not force certainty. A 40% confidence score is valid data.
3. **Prefer Claims Over Truth:** Let humans decide what is true based on some accumulated evidence.
4. **Prefer Evidence Over Opinions:** Proof (documents, photos) > assumptions.
5. **Everything Important is Reversible:** Any merge, edit, or approval must be undoable.
6. **Privacy First:** Default to private, opt-in to public. Protect sensitive fields.
7. **Family Spaces Before Global Data:** Isolate data by family (e.g., Dewangan space is separate from others).

---

## Implementation Priority Phases

### Phase 1A: Foundation (Multi-Space & Auditing)
*   **Family Spaces:** Implement the `families` table to isolate data and governance. Add `family_id` to all existing entities.
*   **Claims Architecture:** Shift from editing records to submitting `claims` (with confidence scores) about records.
*   **Visibility Manager:** Implement `visibility_scopes` (public, family, branch, private, admin_only).
*   **Audit Logger:** Implement the `revisions` table to track every change and enable the `can_undo` workflow.

### Phase 1B: Discovery & Safety
*   **Duplicate Detection:** Implement a fuzzy-matching engine (`potential_duplicates` table) to flag similar entries during creation.
*   **Merge Strategy:** Implement reversible merges (`merges` table), ensuring data from the secondary record is preserved in JSONB and can be undone.
*   **UI Workflows:** Build the Duplicate Detection Panel and Merge Review Dialog.

### Phase 2: Trust & Governance
*   **Evidence System:** Build the `evidence` table linked to claims (documents, audio, transcripts) with trust scoring.
*   **Role Hierarchy:** Implement robust RBAC (`family_roles`, `family_members_roles`) including Platform Admin, Family Owner, Branch Moderator, and Contributors.
*   **Claim Approval Workflow:** Build the UI for moderators to review proposed claims and attached evidence.

### Phase 3: Culture & Privacy
*   **Cultural Attributes:** Implement generic `attribute_types` (gotra, caste, religion, samaj) to support diverse cultural data structures.
*   **Sensitive Information Policy:** Implement the `sensitive_fields` table with potential field-level encryption for emails, phones, and medical data.
*   **Privacy Controls UI:** Allow users to set their own visibility preferences.

---

## Technical Debt & Refactoring
- **Canvas/SVG Overlap:** `TreeCanvas` and `TreeSVG` duplicate some culling logic. This bounding-box math should be extracted into a shared hook.
- **Worker Messaging:** The Web Worker bridge in `useTreeLayout` needs a strict request/response message wrapper.
- **Tree Component Evolution:** The current `TreePageClient.tsx` will need to evolve into `TreeWithClaims.tsx`, allowing users to click a node and see the differing claims and confidence scores for that individual's data points.
