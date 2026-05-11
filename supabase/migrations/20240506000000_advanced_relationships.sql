-- Migration: Advanced Relationships & Edge Customizations
-- Supports diverse family structures and persistent visualization settings.

-- 1. Create Relationship Type Enum
DO $$ BEGIN
    CREATE TYPE relationship_type AS ENUM (
      'parent', 
      'spouse', 
      'sibling', 
      'unknown', 
      'step-parent', 
      'adoptive-parent', 
      'guardian', 
      'foster', 
      'in-law', 
      'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Relationships Table
-- Handles any arbitrary link between two members with metadata support.
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    type relationship_type NOT NULL DEFAULT 'unknown',
    is_pending BOOLEAN DEFAULT TRUE,
    notes TEXT,
    custom_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_members CHECK (source_id != target_id)
);

-- 3. Create Edge Customizations Table
-- Persists visualization-specific data like bend points and line styles.
CREATE TABLE IF NOT EXISTS edge_customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE UNIQUE,
    bend_points JSONB DEFAULT '[]'::jsonb,
    line_style TEXT CHECK (line_style IN ('straight', 'bezier', 'orthogonal', 'custom')) DEFAULT 'orthogonal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Validation & Uniqueness
-- Prevent duplicate active relationships of same type between same people
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_relationship ON relationships(source_id, target_id, type) WHERE is_pending = FALSE;

-- 5. Indexing for Large Trees (Performance Optimization)
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(type);
CREATE INDEX IF NOT EXISTS idx_relationships_pending ON relationships(is_pending);
CREATE INDEX IF NOT EXISTS idx_edge_customizations_rel ON edge_customizations(relationship_id);

-- 6. Update Inbox Submission Types
ALTER TABLE inbox DROP CONSTRAINT IF EXISTS inbox_submission_type_check;
ALTER TABLE inbox ADD CONSTRAINT inbox_submission_type_check 
CHECK (submission_type IN ('New Member', 'Story', 'Media', 'Event', 'Tradition', 'Update Member', 'Relationship', 'Other'));

-- 7. Security (RLS)
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_customizations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can view relationships" ON relationships FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage relationships" ON relationships FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can view edge customizations" ON edge_customizations FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage edge customizations" ON edge_customizations FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8. Triggers for modified timestamps
DROP TRIGGER IF EXISTS update_relationships_modtime ON relationships;
CREATE TRIGGER update_relationships_modtime
BEFORE UPDATE ON relationships
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_edge_customizations_modtime ON edge_customizations;
CREATE TRIGGER update_edge_customizations_modtime
BEFORE UPDATE ON edge_customizations
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

COMMENT ON TABLE relationships IS 'Stores diverse family connections beyond the standard parent-child columns.';
COMMENT ON TABLE edge_customizations IS 'Stores visualization path data for the family tree lines.';
