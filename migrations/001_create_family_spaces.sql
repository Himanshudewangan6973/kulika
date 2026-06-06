-- migrations/001_create_family_spaces.sql
-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  founding_ancestor_id UUID,
  privacy_level TEXT CHECK (privacy_level IN ('public', 'private')) DEFAULT 'private',
  banner_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_families_slug ON families(slug);
CREATE INDEX IF NOT EXISTS idx_families_privacy ON families(privacy_level);

-- Add family_id to existing tables if they exist
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
    ALTER TABLE family_members ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media') THEN
    ALTER TABLE media ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories') THEN
    ALTER TABLE stories ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    ALTER TABLE events ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);
  END IF;
END $$;
