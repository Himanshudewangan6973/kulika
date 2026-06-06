-- Migration: Inbox Column and Permission Final Repair
-- Description: Fixes missing columns in inbox and ensures correct permissions for admin actions

-- 1. Ensure all required columns exist in inbox
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inbox' AND column_name='reviewed_by') THEN
    ALTER TABLE inbox ADD COLUMN reviewed_by TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inbox' AND column_name='review_notes') THEN
    ALTER TABLE inbox ADD COLUMN review_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inbox' AND column_name='review_date') THEN
    ALTER TABLE inbox ADD COLUMN review_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inbox' AND column_name='community_id') THEN
    ALTER TABLE inbox ADD COLUMN community_id UUID REFERENCES communities(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Ensure all core tables have correct permissions and RLS
DO $$ 
DECLARE
    t text;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('family_members', 'family_relationships', 'media', 'stories', 'events', 'inbox', 'communities', 'profiles')
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Explicit GRANTS
        EXECUTE format('GRANT ALL ON TABLE %I TO authenticated', t);
        EXECUTE format('GRANT ALL ON TABLE %I TO anon', t);
        EXECUTE format('GRANT ALL ON TABLE %I TO service_role', t);
        
        -- Safe Public SELECT policy
        EXECUTE format('DROP POLICY IF EXISTS "Public select %I" ON %I', t, t);
        EXECUTE format('CREATE POLICY "Public select %I" ON %I FOR SELECT TO authenticated USING (true)', t, t);
    END LOOP;
END $$;

-- 3. Upgrade the Approval Function to handle permissions (Security Definer)
ALTER FUNCTION IF EXISTS approve_member_submission(UUID, JSONB) SECURITY DEFINER;

-- 4. Final confirmation of permissions
GRANT ALL ON TABLE family_members TO authenticated;
GRANT ALL ON TABLE inbox TO authenticated;
GRANT ALL ON TABLE communities TO authenticated;
