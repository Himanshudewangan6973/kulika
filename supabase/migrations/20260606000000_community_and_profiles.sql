-- Migration: Community and Profiles (Robust Version)
-- Description: Adds communities table and user profiles with safety checks

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create communities table
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Safety: Add slug column if it doesn't exist (handles partial previous runs)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='slug') THEN
    ALTER TABLE communities ADD COLUMN slug TEXT UNIQUE;
    -- Populate existing rows with a slug derived from name if any exist
    UPDATE communities SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;
    -- Make it NOT NULL after population
    ALTER TABLE communities ALTER COLUMN slug SET NOT NULL;
  END IF;
END $$;

-- 4. Insert default community
INSERT INTO communities (name, slug, description)
VALUES ('Dewangan', 'dewangan', 'The primary Dewangan heritage community')
ON CONFLICT (slug) DO NOTHING;

-- 5. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Explicit GRANTS
GRANT ALL ON TABLE communities TO authenticated;
GRANT ALL ON TABLE communities TO anon;
GRANT ALL ON TABLE communities TO service_role;

GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE profiles TO anon;
GRANT ALL ON TABLE profiles TO service_role;

-- 8. Communities policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public communities are viewable by everyone" ON communities;
    CREATE POLICY "Public communities are viewable by everyone" ON communities FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;
    CREATE POLICY "Authenticated users can create communities" ON communities FOR INSERT TO authenticated WITH CHECK (true);
END $$;

-- 9. Profiles policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
    CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
END $$;

-- 10. Add community_id to family_members if not present
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='family_members' AND column_name='community_id') THEN
      ALTER TABLE family_members ADD COLUMN community_id UUID REFERENCES communities(id);
    END IF;
  END IF;
END $$;
