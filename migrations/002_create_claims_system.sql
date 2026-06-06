-- migrations/002_create_claims_system.sql
-- Create claims table
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  claim_type TEXT NOT NULL,
  claim_value TEXT NOT NULL,
  claimed_by TEXT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  confidence_score DECIMAL(3,2),
  source_type TEXT CHECK (source_type IN (
    'oral_tradition', 'document', 'photo', 'certificate',
    'interview', 'family_bible', 'government_record', 'other'
  )),
  source_description TEXT,
  status TEXT CHECK (status IN ('proposed', 'approved', 'disputed', 'archived')) DEFAULT 'proposed',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  is_current BOOLEAN DEFAULT TRUE,
  superseded_by UUID REFERENCES claims(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_subject ON claims(subject_id, claim_type);
CREATE INDEX IF NOT EXISTS idx_claims_family ON claims(family_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);

-- Create evidence table
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  evidence_type TEXT CHECK (evidence_type IN (
    'document', 'photo', 'audio', 'video', 'transcript', 'certificate', 'other'
  )) NOT NULL,
  title TEXT,
  description TEXT,
  file_url TEXT,
  file_size_mb DECIMAL(10,2),
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  trust_score DECIMAL(3,2) DEFAULT 0.5,
  verified_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_claim ON evidence(claim_id);
