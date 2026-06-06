-- migrations/003_create_revisions_and_audit.sql
-- Create revisions table
CREATE TABLE IF NOT EXISTS revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('member', 'story', 'relationship', 'claim', 'evidence')),
  entity_id UUID NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT,
  can_undo BOOLEAN DEFAULT TRUE,
  undone_by TEXT,
  undone_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revisions_entity ON revisions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_revisions_family ON revisions(family_id);
CREATE INDEX IF NOT EXISTS idx_revisions_changed_by ON revisions(changed_by);

-- Create potential_duplicates table
CREATE TABLE IF NOT EXISTS potential_duplicates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id_1 UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  member_id_2 UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2),
  name_match BOOLEAN,
  parent_match BOOLEAN,
  spouse_match BOOLEAN,
  date_match BOOLEAN,
  location_match BOOLEAN,
  status TEXT CHECK (status IN ('detected', 'reviewing', 'confirmed', 'false_positive', 'merged')) DEFAULT 'detected',
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_duplicates_family ON potential_duplicates(family_id);
CREATE INDEX IF NOT EXISTS idx_duplicates_status ON potential_duplicates(status);
